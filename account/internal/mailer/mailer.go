package mailer

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/tls"
	"encoding/base64"
	"errors"
	"fmt"
	"mime"
	"mime/quotedprintable"
	"net"
	"net/mail"
	"net/smtp"
	"strings"
	"time"
)

// TLSMode describes how TLS is negotiated with the SMTP server.
type TLSMode string

const (
	// TLSModeNone disables TLS.
	TLSModeNone TLSMode = "none"
	// TLSModeStartTLS upgrades a plain connection via STARTTLS and fails when unsupported.
	TLSModeStartTLS TLSMode = "starttls"
	// TLSModeImplicit establishes the connection over TLS immediately.
	TLSModeImplicit TLSMode = "implicit"
	// TLSModeAuto attempts STARTTLS when supported and gracefully falls back to plain SMTP otherwise.
	TLSModeAuto TLSMode = "auto"
)

// ParseTLSMode normalises the provided value to a supported TLSMode. Unrecognised values
// default to TLSModeAuto in order to support both secure and non-secure transports when
// testing against simple SMTP servers.
func ParseTLSMode(value string) TLSMode {
	normalized := strings.ToLower(strings.TrimSpace(value))
	switch normalized {
	case "", "auto", "automatic", "detect":
		return TLSModeAuto
	case "none", "disable", "disabled", "off", "plain", "plaintext":
		return TLSModeNone
	case "implicit", "smtps":
		return TLSModeImplicit
	case "starttls", "start_tls", "start-tls":
		return TLSModeStartTLS
	default:
		return TLSModeAuto
	}
}

func normalizeTLSMode(mode TLSMode) TLSMode {
	return ParseTLSMode(string(mode))
}

// Config contains the information required to send email via SMTP.
type Config struct {
	Host               string
	Port               int
	Username           string
	Password           string
	From               string
	ReplyTo            string
	Timeout            time.Duration
	TLSMode            TLSMode
	InsecureSkipVerify bool
}

// Message represents an outbound email.
type Message struct {
	To        []string
	Subject   string
	PlainBody string
	HTMLBody  string
}

// Sender sends email messages over SMTP.
type Sender interface {
	Send(ctx context.Context, msg Message) error
}

type smtpSender struct {
	host               string
	port               int
	username           string
	password           string
	from               *mail.Address
	replyTo            *mail.Address
	timeout            time.Duration
	tlsMode            TLSMode
	insecureSkipVerify bool
}

// New constructs a Sender based on the provided configuration.
func New(cfg Config) (Sender, error) {
	host := strings.TrimSpace(cfg.Host)
	if host == "" {
		return nil, errors.New("smtp host is required")
	}
	if cfg.Port <= 0 {
		cfg.Port = 587
	}
	if cfg.Timeout <= 0 {
		cfg.Timeout = 10 * time.Second
	}
	from := strings.TrimSpace(cfg.From)
	if from == "" {
		return nil, errors.New("smtp from address is required")
	}
	fromAddr, err := mail.ParseAddress(from)
	if err != nil {
		return nil, fmt.Errorf("invalid from address: %w", err)
	}
	var replyAddr *mail.Address
	if reply := strings.TrimSpace(cfg.ReplyTo); reply != "" {
		replyAddr, err = mail.ParseAddress(reply)
		if err != nil {
			return nil, fmt.Errorf("invalid reply-to address: %w", err)
		}
	}

	mode := normalizeTLSMode(cfg.TLSMode)
	if mode == TLSModeAuto && cfg.Port == 465 {
		mode = TLSModeImplicit
	}

	sender := &smtpSender{
		host:               host,
		port:               cfg.Port,
		username:           strings.TrimSpace(cfg.Username),
		password:           cfg.Password,
		from:               fromAddr,
		replyTo:            replyAddr,
		timeout:            cfg.Timeout,
		tlsMode:            mode,
		insecureSkipVerify: cfg.InsecureSkipVerify,
	}
	return sender, nil
}

func (s *smtpSender) Send(ctx context.Context, msg Message) error {
	recipients, headerTo, err := s.parseRecipients(msg.To)
	if err != nil {
		return err
	}
	if len(recipients) == 0 {
		return errors.New("no recipients specified")
	}

	data, err := s.buildMessage(msg, headerTo)
	if err != nil {
		return err
	}

	addr := net.JoinHostPort(s.host, fmt.Sprintf("%d", s.port))
	dialer := &net.Dialer{Timeout: s.timeout}
	if deadline, ok := ctx.Deadline(); ok {
		dialer.Deadline = deadline
	}

	var conn net.Conn
	if s.tlsMode == TLSModeImplicit {
		tlsCfg := s.tlsConfig()
		conn, err = tls.DialWithDialer(dialer, "tcp", addr, tlsCfg)
	} else {
		conn, err = dialer.DialContext(ctx, "tcp", addr)
	}
	if err != nil {
		return err
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.host)
	if err != nil {
		return err
	}
	defer client.Close()

	switch s.tlsMode {
	case TLSModeStartTLS:
		tlsCfg := s.tlsConfig()
		if err := client.StartTLS(tlsCfg); err != nil {
			return err
		}
	case TLSModeAuto:
		if ok, _ := client.Extension("STARTTLS"); ok {
			tlsCfg := s.tlsConfig()
			if err := client.StartTLS(tlsCfg); err != nil {
				return err
			}
		}
	}

	if s.username != "" {
		auth := smtp.PlainAuth("", s.username, s.password, s.host)
		if err := client.Auth(auth); err != nil {
			return err
		}
	}

	if err := client.Mail(s.from.Address); err != nil {
		return err
	}
	for _, rcpt := range recipients {
		if err := client.Rcpt(rcpt.Address); err != nil {
			return err
		}
	}

	writer, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := writer.Write(data); err != nil {
		writer.Close()
		return err
	}
	if err := writer.Close(); err != nil {
		return err
	}

	if err := client.Quit(); err != nil {
		return err
	}
	return nil
}

func (s *smtpSender) parseRecipients(addresses []string) ([]*mail.Address, []string, error) {
	parsed := make([]*mail.Address, 0, len(addresses))
	headerValues := make([]string, 0, len(addresses))
	for _, addr := range addresses {
		value := strings.TrimSpace(addr)
		if value == "" {
			continue
		}
		parsedAddr, err := mail.ParseAddress(value)
		if err != nil {
			return nil, nil, fmt.Errorf("invalid recipient address %q: %w", addr, err)
		}
		parsed = append(parsed, parsedAddr)
		headerValues = append(headerValues, parsedAddr.String())
	}
	return parsed, headerValues, nil
}

func (s *smtpSender) buildMessage(msg Message, headerTo []string) ([]byte, error) {
	if len(headerTo) == 0 {
		return nil, errors.New("no recipients specified")
	}
	var builder strings.Builder
	builder.Grow(512 + len(msg.PlainBody) + len(msg.HTMLBody))

	subject := encodeHeader(msg.Subject)
	headers := []string{
		fmt.Sprintf("From: %s", s.from.String()),
		fmt.Sprintf("To: %s", strings.Join(headerTo, ", ")),
		fmt.Sprintf("Subject: %s", subject),
		"MIME-Version: 1.0",
	}
	if s.replyTo != nil {
		headers = append(headers, fmt.Sprintf("Reply-To: %s", s.replyTo.String()))
	}

	htmlBody := strings.TrimSpace(msg.HTMLBody)
	plainBody := strings.TrimSpace(msg.PlainBody)

	if htmlBody != "" {
		boundary, err := randomBoundary()
		if err != nil {
			return nil, err
		}
		headers = append(headers, fmt.Sprintf("Content-Type: multipart/alternative; boundary=\"%s\"", boundary))
		for _, header := range headers {
			builder.WriteString(header)
			builder.WriteString("\r\n")
		}
		builder.WriteString("\r\n")
		builder.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		builder.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
		builder.WriteString("Content-Transfer-Encoding: 7bit\r\n\r\n")
		builder.WriteString(normalizeNewlines(plainBody))
		builder.WriteString("\r\n\r\n")
		builder.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		builder.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
		builder.WriteString("Content-Transfer-Encoding: quoted-printable\r\n\r\n")
		builder.WriteString(toQuotedPrintable(htmlBody))
		builder.WriteString("\r\n\r\n")
		builder.WriteString(fmt.Sprintf("--%s--\r\n", boundary))
	} else {
		headers = append(headers, "Content-Type: text/plain; charset=UTF-8")
		headers = append(headers, "Content-Transfer-Encoding: 7bit")
		for _, header := range headers {
			builder.WriteString(header)
			builder.WriteString("\r\n")
		}
		builder.WriteString("\r\n")
		builder.WriteString(normalizeNewlines(plainBody))
		builder.WriteString("\r\n")
	}

	return []byte(builder.String()), nil
}

func (s *smtpSender) tlsConfig() *tls.Config {
	return &tls.Config{
		ServerName:         s.host,
		MinVersion:         tls.VersionTLS12,
		InsecureSkipVerify: s.insecureSkipVerify,
	}
}

func encodeHeader(value string) string {
	if value == "" {
		return ""
	}
	if isASCII(value) {
		return value
	}
	return mime.QEncoding.Encode("utf-8", value)
}

func isASCII(value string) bool {
	for i := 0; i < len(value); i++ {
		if value[i] >= 128 {
			return false
		}
	}
	return true
}

func normalizeNewlines(value string) string {
	value = strings.ReplaceAll(value, "\r\n", "\n")
	value = strings.ReplaceAll(value, "\r", "\n")
	return strings.ReplaceAll(value, "\n", "\r\n")
}

func randomBoundary() (string, error) {
	buf := make([]byte, 12)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

func toQuotedPrintable(value string) string {
	normalized := normalizeNewlines(value)
	var buf bytes.Buffer
	writer := quotedprintable.NewWriter(&buf)
	if _, err := writer.Write([]byte(normalized)); err != nil {
		return normalized
	}
	if err := writer.Close(); err != nil {
		return normalized
	}
	return buf.String()
}

package syncer

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"path"
	"sort"
	"strings"
	"time"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
	"golang.org/x/crypto/ssh/knownhosts"
	"gopkg.in/yaml.v3"

	"account/internal/migrate"
)

// Syncer coordinates snapshot exports, transfers and imports between two
// account service environments.
type Syncer struct {
	cfg    *Config
	logger *log.Logger
}

// New constructs a Syncer using the provided configuration and logger. When
// logger is nil the default log.Logger writing to stderr is used.
func New(cfg *Config, logger *log.Logger) *Syncer {
	if logger == nil {
		logger = log.Default()
	}
	return &Syncer{cfg: cfg, logger: logger}
}

// Push performs a one-way synchronisation from the local database to the remote
// environment.
func (s *Syncer) Push(ctx context.Context) error {
	s.logger.Println("⏳ exporting local account snapshot ...")
	dump, err := s.exportLocal(ctx)
	if err != nil {
		return err
	}

	contents, err := encodeDump(dump)
	if err != nil {
		return err
	}

	client, err := s.dialSSH(ctx)
	if err != nil {
		return err
	}
	defer client.Close()

	if err := s.uploadAndImport(ctx, client, contents); err != nil {
		return err
	}

	s.logger.Println("✅ push synchronisation finished")
	return nil
}

// Pull performs a one-way synchronisation from the remote environment into the
// local database.
func (s *Syncer) Pull(ctx context.Context) error {
	client, err := s.dialSSH(ctx)
	if err != nil {
		return err
	}
	defer client.Close()

	s.logger.Println("⏳ requesting remote export ...")
	if err := s.remoteExport(ctx, client); err != nil {
		return err
	}

	s.logger.Println("⏳ downloading remote snapshot ...")
	data, err := s.download(ctx, client)
	if err != nil {
		return err
	}

	dump, err := decodeDump(data)
	if err != nil {
		return err
	}

	s.logger.Println("⏳ importing snapshot into local database ...")
	if err := s.importLocal(ctx, dump); err != nil {
		return err
	}

	s.logger.Println("✅ pull synchronisation finished")
	return nil
}

// Mirror executes both push and pull operations sequentially, ensuring both
// environments converge to the most recent state.
func (s *Syncer) Mirror(ctx context.Context) error {
	if err := s.Push(ctx); err != nil {
		return err
	}
	return s.Pull(ctx)
}

func (s *Syncer) exportLocal(ctx context.Context) (*migrate.AccountDump, error) {
	exporter := migrate.NewExporter()
	ctx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	dump, err := exporter.Export(ctx, s.cfg.Local.DSN, s.cfg.Local.EmailKeyword)
	if err != nil {
		return nil, fmt.Errorf("local export: %w", err)
	}
	return dump, nil
}

func encodeDump(dump *migrate.AccountDump) ([]byte, error) {
	var buf bytes.Buffer
	enc := yaml.NewEncoder(&buf)
	enc.SetIndent(2)
	if err := enc.Encode(dump); err != nil {
		enc.Close()
		return nil, fmt.Errorf("encode dump: %w", err)
	}
	if err := enc.Close(); err != nil {
		return nil, fmt.Errorf("finalise dump: %w", err)
	}
	return buf.Bytes(), nil
}

func decodeDump(data []byte) (*migrate.AccountDump, error) {
	var dump migrate.AccountDump
	if err := yaml.Unmarshal(data, &dump); err != nil {
		return nil, fmt.Errorf("decode dump: %w", err)
	}
	return &dump, nil
}

func (s *Syncer) dialSSH(ctx context.Context) (*ssh.Client, error) {
	signer, err := s.publicKey()
	if err != nil {
		return nil, err
	}

	cfg := &ssh.ClientConfig{
		User:            s.cfg.Remote.User,
		Auth:            []ssh.AuthMethod{ssh.PublicKeys(signer)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         s.cfg.Remote.Timeout.Duration,
	}
	if s.cfg.Remote.KnownHostsFile != "" {
		callback, err := knownhosts.New(s.cfg.Remote.KnownHostsFile)
		if err != nil {
			return nil, fmt.Errorf("load known hosts: %w", err)
		}
		cfg.HostKeyCallback = callback
	}

	addr := net.JoinHostPort(s.cfg.Remote.Address, fmt.Sprintf("%d", s.cfg.Remote.Port))

	type dialResult struct {
		client *ssh.Client
		err    error
	}
	ch := make(chan dialResult, 1)
	go func() {
		client, err := ssh.Dial("tcp", addr, cfg)
		ch <- dialResult{client: client, err: err}
	}()

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case res := <-ch:
		if res.err != nil {
			return nil, fmt.Errorf("ssh dial: %w", res.err)
		}
		return res.client, nil
	}
}

func (s *Syncer) publicKey() (ssh.Signer, error) {
	keyPath := s.cfg.Remote.IdentityFile
	if keyPath == "" {
		return nil, fmt.Errorf("remote.identity_file must be configured to use public key auth")
	}
	key, err := os.ReadFile(keyPath)
	if err != nil {
		return nil, err
	}
	signer, err := ssh.ParsePrivateKey(key)
	if err != nil {
		return nil, err
	}
	return signer, nil
}

func (s *Syncer) uploadAndImport(ctx context.Context, client *ssh.Client, contents []byte) error {
	remotePath := s.remoteImportPath()
	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		return fmt.Errorf("create sftp client: %w", err)
	}
	defer sftpClient.Close()

	if err := sftpClient.MkdirAll(path.Dir(remotePath)); err != nil {
		return fmt.Errorf("create remote dir: %w", err)
	}

	file, err := sftpClient.OpenFile(remotePath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC)
	if err != nil {
		return fmt.Errorf("open remote file: %w", err)
	}
	if _, err := file.Write(contents); err != nil {
		file.Close()
		return fmt.Errorf("write remote file: %w", err)
	}
	if err := file.Chmod(0o600); err != nil {
		s.logger.Printf("⚠️ unable to chmod remote file: %v", err)
	}
	if err := file.Close(); err != nil {
		return fmt.Errorf("close remote file: %w", err)
	}

	s.logger.Println("⏳ triggering remote import ...")
	if err := s.remoteImport(ctx, client); err != nil {
		return err
	}
	return nil
}

func (s *Syncer) remoteExport(ctx context.Context, client *ssh.Client) error {
	env := map[string]string{
		"ACCOUNT_EXPORT_FILE": s.remoteExportPath(),
	}
	if s.cfg.Remote.RemoteEmail != "" {
		env["ACCOUNT_EMAIL_KEYWORD"] = s.cfg.Remote.RemoteEmail
	}

	cmd := fmt.Sprintf("cd %s && make account-export", shellQuote(s.cfg.Remote.AccountDir))
	return s.runRemoteCommand(ctx, client, env, cmd)
}

func (s *Syncer) remoteImport(ctx context.Context, client *ssh.Client) error {
	env := map[string]string{
		"ACCOUNT_IMPORT_FILE": s.remoteImportPath(),
	}

	cmd := fmt.Sprintf("cd %s && make account-import", shellQuote(s.cfg.Remote.AccountDir))
	return s.runRemoteCommand(ctx, client, env, cmd)
}

func (s *Syncer) runRemoteCommand(ctx context.Context, client *ssh.Client, extraEnv map[string]string, command string) error {
	session, err := client.NewSession()
	if err != nil {
		return fmt.Errorf("new ssh session: %w", err)
	}
	defer session.Close()

	env := s.composeRemoteEnv(extraEnv)
	if len(env) > 0 {
		command = env + " " + command
	}

	return s.runSession(ctx, session, command)
}

func (s *Syncer) composeRemoteEnv(extra map[string]string) string {
	combined := make(map[string]string, len(s.cfg.Remote.Env)+len(extra))
	for key, value := range s.cfg.Remote.Env {
		combined[key] = value
	}
	for key, value := range extra {
		combined[key] = value
	}
	if len(combined) == 0 {
		return ""
	}

	keys := make([]string, 0, len(combined))
	for key := range combined {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		parts = append(parts, fmt.Sprintf("%s=%s", key, shellQuote(combined[key])))
	}
	return strings.Join(parts, " ")
}

func (s *Syncer) download(ctx context.Context, client *ssh.Client) ([]byte, error) {
	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		return nil, fmt.Errorf("create sftp client: %w", err)
	}
	defer sftpClient.Close()

	file, err := sftpClient.Open(s.remoteExportPath())
	if err != nil {
		return nil, fmt.Errorf("open remote file: %w", err)
	}
	defer file.Close()

	var buf bytes.Buffer
	if _, err := io.Copy(&buf, file); err != nil {
		return nil, fmt.Errorf("read remote file: %w", err)
	}
	return buf.Bytes(), nil
}

func (s *Syncer) importLocal(ctx context.Context, dump *migrate.AccountDump) error {
	importer := migrate.NewImporter()
	opts := migrate.ImportOptions{
		Merge:         s.cfg.Local.Import.Merge,
		MergeStrategy: migrate.MergeStrategy(s.cfg.Local.Import.MergeStrategy),
		DryRun:        s.cfg.Local.Import.DryRun,
	}
	if len(s.cfg.Local.Import.Allowlist) > 0 {
		opts.Allowlist = make(map[string]struct{}, len(s.cfg.Local.Import.Allowlist))
		for _, uuid := range s.cfg.Local.Import.Allowlist {
			opts.Allowlist[uuid] = struct{}{}
		}
	}
	_, err := importer.Import(ctx, s.cfg.Local.DSN, dump, opts)
	if err != nil {
		return fmt.Errorf("local import: %w", err)
	}
	return nil
}

func (s *Syncer) remoteImportPath() string {
	return s.resolveRemotePath(s.cfg.Remote.ImportPath)
}

func (s *Syncer) remoteExportPath() string {
	return s.resolveRemotePath(s.cfg.Remote.ExportPath)
}

func (s *Syncer) resolveRemotePath(p string) string {
	remote := p
	if strings.HasPrefix(remote, "/") {
		return remote
	}
	return path.Join(s.cfg.Remote.AccountDir, remote)
}

func (s *Syncer) runSession(ctx context.Context, session *ssh.Session, command string) error {
	var stdout, stderr bytes.Buffer
	session.Stdout = &stdout
	session.Stderr = &stderr

	ch := make(chan error, 1)
	go func() {
		ch <- session.Run(command)
	}()

	select {
	case <-ctx.Done():
		session.Signal(ssh.SIGKILL)
		return ctx.Err()
	case err := <-ch:
		if stdout.Len() > 0 {
			s.logger.Print(strings.TrimSpace(stdout.String()))
		}
		if stderr.Len() > 0 {
			s.logger.Print(strings.TrimSpace(stderr.String()))
		}
		if err != nil {
			return fmt.Errorf("remote command %q failed: %w", command, err)
		}
		return nil
	}
}

// shellQuote returns a shell-escaped representation of value suitable for use
// in remote commands executed via /bin/sh -c.
func shellQuote(value string) string {
	if value == "" {
		return "''"
	}
	return "'" + strings.ReplaceAll(value, "'", "'\\''") + "'"
}

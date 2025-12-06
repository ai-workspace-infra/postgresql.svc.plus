package agentmode

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"account/internal/agentproto"
)

// ClientOptions configures the HTTP client used to communicate with the
// controller.
type ClientOptions struct {
	Timeout            time.Duration
	InsecureSkipVerify bool
	UserAgent          string
}

// Client issues authenticated requests against the controller.
type Client struct {
	baseURL   *url.URL
	token     string
	http      *http.Client
	userAgent string
}

// NewClient constructs a client for the provided controller URL and token.
func NewClient(baseURL, token string, opts ClientOptions) (*Client, error) {
	trimmedURL := strings.TrimSpace(baseURL)
	if trimmedURL == "" {
		return nil, errors.New("controller url is required")
	}
	parsed, err := url.Parse(trimmedURL)
	if err != nil {
		return nil, fmt.Errorf("parse controller url: %w", err)
	}
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, errors.New("controller token is required")
	}

	timeout := opts.Timeout
	if timeout <= 0 {
		timeout = 15 * time.Second
	}

	transport := http.DefaultTransport
	if t, ok := transport.(*http.Transport); ok {
		clone := t.Clone()
		if opts.InsecureSkipVerify {
			if clone.TLSClientConfig == nil {
				clone.TLSClientConfig = &tls.Config{}
			}
			clone.TLSClientConfig.InsecureSkipVerify = true
		}
		transport = clone
	}

	client := &http.Client{
		Timeout:   timeout,
		Transport: transport,
	}

	userAgent := strings.TrimSpace(opts.UserAgent)
	if userAgent == "" {
		userAgent = "xcontrol-agent"
	}

	return &Client{
		baseURL:   parsed,
		token:     token,
		http:      client,
		userAgent: userAgent,
	}, nil
}

// ListClients fetches the current set of Xray clients from the controller.
func (c *Client) ListClients(ctx context.Context) (agentproto.ClientListResponse, error) {
	endpoint, err := url.JoinPath(c.baseURL.String(), "/api/agent/v1/users")
	if err != nil {
		return agentproto.ClientListResponse{}, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return agentproto.ClientListResponse{}, err
	}
	c.applyHeaders(req)
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return agentproto.ClientListResponse{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<14))
		return agentproto.ClientListResponse{}, fmt.Errorf("controller returned %s: %s", resp.Status, strings.TrimSpace(string(body)))
	}

	var payload agentproto.ClientListResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return agentproto.ClientListResponse{}, fmt.Errorf("decode client list: %w", err)
	}
	return payload, nil
}

// ReportStatus submits the agent status report to the controller.
func (c *Client) ReportStatus(ctx context.Context, report agentproto.StatusReport) error {
	endpoint, err := url.JoinPath(c.baseURL.String(), "/api/agent/v1/status")
	if err != nil {
		return err
	}

	buf, err := json.Marshal(report)
	if err != nil {
		return fmt.Errorf("encode status report: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(buf))
	if err != nil {
		return err
	}
	c.applyHeaders(req)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<14))
		return fmt.Errorf("controller returned %s: %s", resp.Status, strings.TrimSpace(string(body)))
	}
	return nil
}

func (c *Client) applyHeaders(req *http.Request) {
	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("User-Agent", c.userAgent)
}

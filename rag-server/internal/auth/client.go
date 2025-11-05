package auth

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// AuthClient 用于调用 accounts-service 的认证接口
type AuthClient struct {
	authURL     string
	publicToken string
	httpClient  *http.Client
	timeout     time.Duration
}

// Config 认证客户端配置
type Config struct {
	AuthURL      string
	PublicToken  string
	Timeout      time.Duration
	MaxRetries   int
	RetryDelay   time.Duration
}

// DefaultConfig 返回默认配置
func DefaultConfig() *Config {
	return &Config{
		Timeout:    10 * time.Second,
		MaxRetries: 3,
		RetryDelay: 500 * time.Millisecond,
	}
}

// NewAuthClient 创建新的认证客户端
func NewAuthClient(cfg *Config) *AuthClient {
	if cfg == nil {
		cfg = DefaultConfig()
	}

	if cfg.Timeout == 0 {
		cfg.Timeout = 10 * time.Second
	}

	return &AuthClient{
		authURL:     cfg.AuthURL,
		publicToken: cfg.PublicToken,
		httpClient: &http.Client{
			Timeout: cfg.Timeout,
		},
		timeout: cfg.Timeout,
	}
}

// TokenVerifyResponse 验证 token 的响应
type TokenVerifyResponse struct {
	Valid  bool   `json:"valid"`
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Roles  string `json:"roles"`
}

// ExchangeRequest 交换 token 请求
type ExchangeRequest struct {
	PublicToken string `json:"public_token"`
	UserID      string `json:"user_id"`
	Email       string `json:"email"`
	Roles       string `json:"roles"`
}

// ExchangeResponse 交换 token 响应
type ExchangeResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
}

// RefreshRequest 刷新 token 请求
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// RefreshResponse 刷新 token 响应
type RefreshResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int64  `json:"expires_in"`
}

// ErrorResponse 标准错误响应
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

// VerifyToken 验证 access token
func (c *AuthClient) VerifyToken(token string) (*TokenVerifyResponse, error) {
	if token == "" {
		return nil, fmt.Errorf("token is required")
	}

	req, err := http.NewRequest("GET", fmt.Sprintf("%s/api/auth/verify", c.authURL), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to verify token: %w", err)
	}
	defer resp.Body.Close()

	// 解析响应
	if resp.StatusCode == http.StatusUnauthorized {
		return &TokenVerifyResponse{
			Valid: false,
		}, nil
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp ErrorResponse
		if err := json.NewDecoder(resp.Body).Decode(&errorResp); err != nil {
			return nil, fmt.Errorf("token verification failed with status %d", resp.StatusCode)
		}
		return nil, fmt.Errorf("verification failed: %s", errorResp.Message)
	}

	var verifyResp TokenVerifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&verifyResp); err != nil {
		return nil, fmt.Errorf("failed to decode verify response: %w", err)
	}

	return &verifyResp, nil
}

// ExchangeToken 使用 publicToken 换取 token 对
func (c *AuthClient) ExchangeToken(userID, email, roles string) (*ExchangeResponse, error) {
	if c.publicToken == "" {
		return nil, fmt.Errorf("public token is required")
	}

	payload := ExchangeRequest{
		PublicToken: c.publicToken,
		UserID:      userID,
		Email:       email,
		Roles:       roles,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest("POST", fmt.Sprintf("%s/api/auth/exchange", c.authURL), bytes.NewBuffer(jsonPayload))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errorResp ErrorResponse
		if err := json.NewDecoder(resp.Body).Decode(&errorResp); err != nil {
			return nil, fmt.Errorf("token exchange failed with status %d", resp.StatusCode)
		}
		return nil, fmt.Errorf("exchange failed: %s", errorResp.Message)
	}

	var exchangeResp ExchangeResponse
	if err := json.NewDecoder(resp.Body).Decode(&exchangeResp); err != nil {
		return nil, fmt.Errorf("failed to decode exchange response: %w", err)
	}

	return &exchangeResp, nil
}

// RefreshToken 刷新 access token
func (c *AuthClient) RefreshToken(refreshToken string) (*RefreshResponse, error) {
	if refreshToken == "" {
		return nil, fmt.Errorf("refresh token is required")
	}

	payload := RefreshRequest{
		RefreshToken: refreshToken,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest("POST", fmt.Sprintf("%s/api/auth/refresh", c.authURL), bytes.NewBuffer(jsonPayload))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to refresh token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errorResp ErrorResponse
		if err := json.NewDecoder(resp.Body).Decode(&errorResp); err != nil {
			return nil, fmt.Errorf("token refresh failed with status %d", resp.StatusCode)
		}
		return nil, fmt.Errorf("refresh failed: %s", errorResp.Message)
	}

	var refreshResp RefreshResponse
	if err := json.NewDecoder(resp.Body).Decode(&refreshResp); err != nil {
		return nil, fmt.Errorf("failed to decode refresh response: %w", err)
	}

	return &refreshResp, nil
}

// HealthCheck 检查认证服务健康状态
func (c *AuthClient) HealthCheck() error {
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/api/auth/self-check", c.authURL), nil)
	if err != nil {
		return fmt.Errorf("failed to create health check request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("health check failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("health check failed with status %d", resp.StatusCode)
	}

	return nil
}

// Close 关闭客户端
func (c *AuthClient) Close() {
	if c.httpClient != nil {
		c.httpClient.CloseIdleConnections()
	}
}

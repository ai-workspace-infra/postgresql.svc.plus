package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// TokenPair represents a pair of Public and Access tokens
type TokenPair struct {
	PublicToken  string `json:"public_token"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
}

// Claims represents JWT access token claims
type Claims struct {
	UserID   string   `json:"user_id"`
	Email    string   `json:"email"`
	Roles    []string `json:"roles"`
	Service  string   `json:"service"`
	jwt.RegisteredClaims
}

// TokenService handles token generation and validation for RAG server
type TokenService struct {
	publicToken    string
	refreshSecret  string
	accessSecret   string
	accessExpiry   time.Duration
	refreshExpiry  time.Duration
}

// TokenConfig holds configuration for token service
type TokenConfig struct {
	PublicToken     string
	RefreshSecret   string
	AccessSecret    string
	AccessExpiry    time.Duration
	RefreshExpiry   time.Duration
}

// NewTokenService creates a new TokenService instance
func NewTokenService(config TokenConfig) *TokenService {
	return &TokenService{
		publicToken:    config.PublicToken,
		refreshSecret:  config.RefreshSecret,
		accessSecret:   config.AccessSecret,
		accessExpiry:   config.AccessExpiry,
		refreshExpiry:  config.RefreshExpiry,
	}
}

// ValidatePublicToken validates the public token
func (s *TokenService) ValidatePublicToken(publicToken string) bool {
	return publicToken == s.publicToken
}

// GenerateTokenPair generates a new token pair for RAG services
func (s *TokenService) GenerateTokenPair(userID, email string, roles []string) (*TokenPair, error) {
	// Generate refresh token (JWT)
	refreshClaims := jwt.RegisteredClaims{
		Subject:   userID,
		Audience:  []string{"xcontrol-rag-refresh"},
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.refreshExpiry)),
		NotBefore: jwt.NewNumericDate(time.Now()),
		Issuer:    "xcontrol-rag",
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString([]byte(s.refreshSecret))
	if err != nil {
		return nil, fmt.Errorf("failed to sign refresh token: %w", err)
	}

	// Generate access token (JWT)
	claims := Claims{
		UserID:  userID,
		Email:   email,
		Roles:   roles,
		Service: "rag-server",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			Audience:  []string{"xcontrol-rag-access"},
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.accessExpiry)),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "xcontrol-rag",
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessTokenString, err := accessToken.SignedString([]byte(s.accessSecret))
	if err != nil {
		return nil, fmt.Errorf("failed to sign access token: %w", err)
	}

	return &TokenPair{
		PublicToken:  s.publicToken,
		AccessToken:  accessTokenString,
		RefreshToken: refreshTokenString,
		TokenType:    "Bearer",
		ExpiresIn:    int64(s.accessExpiry.Seconds()),
	}, nil
}

// ValidateAccessToken validates and parses an access token
func (s *TokenService) ValidateAccessToken(accessToken string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(accessToken, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.accessSecret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to parse access token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid access token")
	}

	return claims, nil
}

// RefreshAccessToken generates a new access token using refresh token
func (s *TokenService) RefreshAccessToken(refreshToken string) (string, error) {
	token, err := jwt.ParseWithClaims(refreshToken, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.refreshSecret), nil
	})
	if err != nil {
		return "", fmt.Errorf("failed to parse refresh token: %w", err)
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok || !token.Valid {
		return "", fmt.Errorf("invalid refresh token")
	}

	// Verify issuer and audience
	if claims.Issuer != "xcontrol-rag" {
		return "", fmt.Errorf("invalid token issuer")
	}

	if !contains(claims.Audience, "xcontrol-rag-refresh") {
		return "", fmt.Errorf("invalid token audience")
	}

	// Generate new access token
	newClaims := Claims{
		UserID:  claims.Subject,
		Email:   "",
		Roles:   []string{"user"},
		Service: "rag-server",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   claims.Subject,
			Audience:  []string{"xcontrol-rag-access"},
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.accessExpiry)),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "xcontrol-rag",
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaims)
	accessTokenString, err := accessToken.SignedString([]byte(s.accessSecret))
	if err != nil {
		return "", fmt.Errorf("failed to sign access token: %w", err)
	}

	return accessTokenString, nil
}

// GetAccessTokenExpiry returns the access token expiry duration
func (s *TokenService) GetAccessTokenExpiry() time.Duration {
	return s.accessExpiry
}

// Helper function to check if a slice contains a string
func contains(slice []string, str string) bool {
	for _, s := range slice {
		if s == str {
			return true
		}
	}
	return false
}

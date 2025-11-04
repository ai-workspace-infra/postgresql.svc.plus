package api

import (
	"context"
	"crypto/rand"
	"crypto/sha1"
	"encoding/base32"
	"encoding/hex"
	"errors"
	"fmt"
	"html"
	"log/slog"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
	"golang.org/x/crypto/bcrypt"

	"xcontrol/account/internal/service"
	"xcontrol/account/internal/store"
)

const defaultSessionTTL = 24 * time.Hour
const defaultMFAChallengeTTL = 10 * time.Minute
const defaultTOTPIssuer = "XControl Account"
const defaultEmailVerificationTTL = 10 * time.Minute
const defaultPasswordResetTTL = 30 * time.Minute
const maxMFAVerificationAttempts = 5
const defaultMFALockoutDuration = 5 * time.Minute

const sessionCookieName = "xc_session"

type session struct {
	userID    string
	expiresAt time.Time
}

type handler struct {
	store                     store.Store
	sessions                  map[string]session
	mu                        sync.RWMutex
	sessionTTL                time.Duration
	mfaChallenges             map[string]mfaChallenge
	mfaMu                     sync.RWMutex
	mfaChallengeTTL           time.Duration
	totpIssuer                string
	emailSender               EmailSender
	emailVerificationEnabled  bool
	verificationTTL           time.Duration
	verifications             map[string]emailVerification
	verificationMu            sync.RWMutex
	registrationVerifications map[string]registrationVerification
	registrationMu            sync.RWMutex
	resetTTL                  time.Duration
	passwordResets            map[string]passwordReset
	resetMu                   sync.RWMutex
	metricsProvider           service.UserMetricsProvider
	agentStatusReader         agentStatusReader
}

type mfaChallenge struct {
	userID         string
	expiresAt      time.Time
	totpSecret     string
	totpIssuer     string
	totpAccount    string
	totpIssuedAt   time.Time
	failedAttempts int
	lockedUntil    time.Time
}

type emailVerification struct {
	userID    string
	email     string
	code      string
	expiresAt time.Time
}

type passwordReset struct {
	userID    string
	email     string
	expiresAt time.Time
}

type registrationVerification struct {
	email     string
	code      string
	expiresAt time.Time
	verified  bool
}

// Option configures handler behaviour when registering routes.
type Option func(*handler)

// WithStore overrides the default in-memory store with the provided implementation.
func WithStore(st store.Store) Option {
	return func(h *handler) {
		if st != nil {
			h.store = st
		}
	}
}

// WithSessionTTL sets the TTL used for issued sessions.
func WithSessionTTL(ttl time.Duration) Option {
	return func(h *handler) {
		if ttl > 0 {
			h.sessionTTL = ttl
		}
	}
}

// WithEmailSender configures the handler to use the provided EmailSender for outbound notifications.
func WithEmailSender(sender EmailSender) Option {
	return func(h *handler) {
		if sender != nil {
			h.emailSender = sender
		}
	}
}

// WithEmailVerification configures whether user registration requires email verification.
func WithEmailVerification(enabled bool) Option {
	return func(h *handler) {
		h.emailVerificationEnabled = enabled
	}
}

// WithEmailVerificationTTL overrides the default TTL for email verification tokens.
func WithEmailVerificationTTL(ttl time.Duration) Option {
	return func(h *handler) {
		if ttl > 0 {
			h.verificationTTL = ttl
		}
	}
}

// WithUserMetricsProvider configures the handler with the provided metrics provider.
func WithUserMetricsProvider(provider service.UserMetricsProvider) Option {
	return func(h *handler) {
		if provider != nil {
			h.metricsProvider = provider
		}
	}
}

// WithAgentStatusReader wires the agent status reader used by admin endpoints.
func WithAgentStatusReader(reader agentStatusReader) Option {
	return func(h *handler) {
		if reader != nil {
			h.agentStatusReader = reader
		}
	}
}

// WithPasswordResetTTL overrides the default TTL for password reset tokens.
func WithPasswordResetTTL(ttl time.Duration) Option {
	return func(h *handler) {
		if ttl > 0 {
			h.resetTTL = ttl
		}
	}
}

// RegisterRoutes attaches account service endpoints to the router.
func RegisterRoutes(r *gin.Engine, opts ...Option) {
	h := &handler{
		store:                     store.NewMemoryStore(),
		sessions:                  make(map[string]session),
		sessionTTL:                defaultSessionTTL,
		mfaChallenges:             make(map[string]mfaChallenge),
		mfaChallengeTTL:           defaultMFAChallengeTTL,
		totpIssuer:                defaultTOTPIssuer,
		emailSender:               noopEmailSender,
		emailVerificationEnabled:  true,
		verificationTTL:           defaultEmailVerificationTTL,
		verifications:             make(map[string]emailVerification),
		registrationVerifications: make(map[string]registrationVerification),
		resetTTL:                  defaultPasswordResetTTL,
		passwordResets:            make(map[string]passwordReset),
	}

	for _, opt := range opts {
		opt(h)
	}

	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	auth := r.Group("/api/auth")

	auth.POST("/register", h.register)
	auth.POST("/register/verify", h.verifyEmail)
	auth.POST("/register/send", h.sendEmailVerification)

	auth.POST("/login", h.login)

	auth.GET("/session", h.session)
	auth.DELETE("/session", h.deleteSession)

	auth.POST("/mfa/totp/provision", h.provisionTOTP)
	auth.POST("/mfa/totp/verify", h.verifyTOTP)
	auth.POST("/mfa/disable", h.disableMFA)
	auth.GET("/mfa/status", h.mfaStatus)

	auth.POST("/password/reset", h.requestPasswordReset)
	auth.POST("/password/reset/confirm", h.confirmPasswordReset)

	auth.POST("/config/sync", h.syncConfig)

	auth.GET("/admin/settings", h.getAdminSettings)
	auth.POST("/admin/settings", h.updateAdminSettings)

	registerAdminRoutes(auth, h)
}

type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Code     string `json:"code"`
}

type loginRequest struct {
	Identifier string `json:"identifier"`
	Username   string `json:"username"`
	Email      string `json:"email"`
	Password   string `json:"password"`
	TOTPCode   string `json:"totpCode"`
}

type verificationCodeRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

type verificationSendRequest struct {
	Email string `json:"email"`
}

type passwordResetRequestBody struct {
	Email string `json:"email"`
}

type passwordResetConfirmRequest struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

func hasQueryParameter(c *gin.Context, keys ...string) bool {
	if len(keys) == 0 {
		return false
	}

	values := c.Request.URL.Query()
	for _, key := range keys {
		if _, ok := values[key]; ok {
			return true
		}
	}

	return false
}

func (h *handler) register(c *gin.Context) {
	if hasQueryParameter(c, "password", "email", "confirmPassword") {
		respondError(c, http.StatusBadRequest, "credentials_in_query", "sensitive credentials must not be sent in the query string")
		return
	}

	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_request", "invalid request payload")
		return
	}

	name := strings.TrimSpace(req.Name)
	email := strings.ToLower(strings.TrimSpace(req.Email))
	password := strings.TrimSpace(req.Password)
	code := strings.TrimSpace(req.Code)

	if name == "" {
		respondError(c, http.StatusBadRequest, "name_required", "name is required")
		return
	}

	if email == "" || password == "" {
		respondError(c, http.StatusBadRequest, "missing_credentials", "email and password are required")
		return
	}

	if !strings.Contains(email, "@") {
		respondError(c, http.StatusBadRequest, "invalid_email", "email must be a valid address")
		return
	}

	if len(password) < 8 {
		respondError(c, http.StatusBadRequest, "password_too_short", "password must be at least 8 characters")
		return
	}

	if h.emailVerificationEnabled {
		if code == "" {
			respondError(c, http.StatusBadRequest, "verification_required", "verification code is required")
			return
		}

		verification, ok := h.lookupRegistrationVerification(email)
		if !ok {
			respondError(c, http.StatusBadRequest, "verification_required", "verification code is required")
			return
		}

		if !verification.verified {
			respondError(c, http.StatusBadRequest, "verification_required", "verification code is required")
			return
		}

		if verification.code != code {
			respondError(c, http.StatusBadRequest, "invalid_code", "verification code is invalid or expired")
			return
		}
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "hash_failure", "failed to secure password")
		return
	}

	user := &store.User{
		Name:         name,
		Email:        email,
		PasswordHash: string(hashed),
		Level:        store.LevelUser,
		Role:         store.RoleUser,
		Groups:       []string{"User"},
	}

	if !h.emailVerificationEnabled || code != "" {
		user.EmailVerified = true
	}

	if err := h.store.CreateUser(c.Request.Context(), user); err != nil {
		switch {
		case errors.Is(err, store.ErrEmailExists):
			respondError(c, http.StatusConflict, "email_already_exists", "user with this email already exists")
			return
		case errors.Is(err, store.ErrNameExists):
			respondError(c, http.StatusConflict, "name_already_exists", "user with this name already exists")
			return
		case errors.Is(err, store.ErrInvalidName):
			respondError(c, http.StatusBadRequest, "invalid_name", "name is invalid")
			return
		default:
			respondError(c, http.StatusInternalServerError, "user_creation_failed", "failed to create user")
			return
		}
	}

	if h.emailVerificationEnabled {
		h.removeRegistrationVerification(email)
	}

	message := "registration successful"

	response := gin.H{
		"message": message,
		"user":    sanitizeUser(user, nil),
	}
	c.JSON(http.StatusCreated, response)
}

func (h *handler) verifyEmail(c *gin.Context) {
	if hasQueryParameter(c, "token", "code") {
		respondError(c, http.StatusBadRequest, "token_in_query", "verification code must be sent in the request body")
		return
	}

	var req verificationCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_request", "invalid request payload")
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	code := strings.TrimSpace(req.Code)

	if email == "" || code == "" {
		respondError(c, http.StatusBadRequest, "invalid_request", "email and verification code are required")
		return
	}

	if len(code) != 6 {
		respondError(c, http.StatusBadRequest, "invalid_code", "verification code must be 6 digits")
		return
	}

	for _, r := range code {
		if r < '0' || r > '9' {
			respondError(c, http.StatusBadRequest, "invalid_code", "verification code must be 6 digits")
			return
		}
	}

	if verification, ok := h.lookupEmailVerification(email); ok {
		if verification.code != code {
			respondError(c, http.StatusBadRequest, "invalid_code", "verification code is invalid or expired")
			return
		}

		user, err := h.store.GetUserByID(c.Request.Context(), verification.userID)
		if err != nil {
			slog.Error("failed to load user for email verification", "err", err, "userID", verification.userID)
			respondError(c, http.StatusInternalServerError, "verification_failed", "failed to verify email")
			return
		}

		if !strings.EqualFold(strings.TrimSpace(user.Email), verification.email) {
			h.removeEmailVerification(email)
			respondError(c, http.StatusBadRequest, "invalid_code", "verification code is invalid or expired")
			return
		}

		if !user.EmailVerified {
			user.EmailVerified = true
			if err := h.store.UpdateUser(c.Request.Context(), user); err != nil {
				slog.Error("failed to update user during email verification", "err", err, "userID", user.ID)
				respondError(c, http.StatusInternalServerError, "verification_failed", "failed to verify email")
				return
			}
		}

		h.removeEmailVerification(email)

		sessionToken, expiresAt, err := h.createSession(user.ID)
		if err != nil {
			respondError(c, http.StatusInternalServerError, "session_creation_failed", "failed to create session")
			return
		}

		h.setSessionCookie(c, sessionToken, expiresAt)

		c.JSON(http.StatusOK, gin.H{
			"message":   "email verified",
			"token":     sessionToken,
			"expiresAt": expiresAt.UTC(),
			"user":      sanitizeUser(user, nil),
		})
		return
	}

	pending, ok := h.lookupRegistrationVerification(email)
	if !ok || pending.code != code {
		respondError(c, http.StatusBadRequest, "invalid_code", "verification code is invalid or expired")
		return
	}

	if !h.markRegistrationVerified(email) {
		respondError(c, http.StatusBadRequest, "invalid_code", "verification code is invalid or expired")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "verification successful", "verified": true})
}

func (h *handler) sendEmailVerification(c *gin.Context) {
	if hasQueryParameter(c, "email") {
		respondError(c, http.StatusBadRequest, "email_in_query", "email must be sent in the request body")
		return
	}

	var req verificationSendRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_request", "invalid request payload")
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" {
		respondError(c, http.StatusBadRequest, "invalid_email", "email must be a valid address")
		return
	}

	// 与线上 SMTP 配置对齐：统一使用 10s 的超时控制
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// 基础邮箱校验，避免明显无效地址触发外发
	if !strings.Contains(email, "@") {
		respondError(c, http.StatusBadRequest, "invalid_email", "email must be a valid address")
		return
	}

	user, err := h.store.GetUserByEmail(ctx, email)
	if err == nil {
		if strings.TrimSpace(user.Email) == "" {
			respondError(c, http.StatusBadRequest, "invalid_email", "email must be a valid address")
			return
		}

		if user.EmailVerified {
			respondError(c, http.StatusConflict, "email_already_exists", "email is already registered")
			return
		}

		if err := h.enqueueEmailVerification(ctx, user); err != nil {
			slog.Error("failed to send verification email", "err", err, "email", user.Email)
			if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
				respondError(c, http.StatusGatewayTimeout, "smtp_timeout", "email sending timed out")
			} else {
				respondError(c, http.StatusInternalServerError, "verification_failed", "verification email could not be sent")
			}
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "verification email sent"})
		return
	}

	if err != nil && !errors.Is(err, store.ErrUserNotFound) {
		respondError(c, http.StatusInternalServerError, "verification_failed", "verification email could not be sent")
		return
	}

	if _, err := h.issueRegistrationVerification(ctx, email); err != nil {
		slog.Error("failed to issue registration verification", "err", err, "email", email)
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
			respondError(c, http.StatusGatewayTimeout, "smtp_timeout", "email sending timed out")
		} else {
			respondError(c, http.StatusInternalServerError, "verification_failed", "verification email could not be sent")
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "verification email sent"})
}

func (h *handler) requestPasswordReset(c *gin.Context) {
	if hasQueryParameter(c, "email") {
		respondError(c, http.StatusBadRequest, "email_in_query", "email must be sent in the request body")
		return
	}

	var req passwordResetRequestBody
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_request", "invalid request payload")
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" {
		respondError(c, http.StatusBadRequest, "email_required", "email is required")
		return
	}

	user, err := h.store.GetUserByEmail(c.Request.Context(), email)
	if err != nil {
		if errors.Is(err, store.ErrUserNotFound) {
			c.JSON(http.StatusAccepted, gin.H{"message": "if the account exists a reset email will be sent"})
			return
		}
		respondError(c, http.StatusInternalServerError, "password_reset_failed", "failed to initiate password reset")
		return
	}

	if strings.TrimSpace(user.Email) == "" || !user.EmailVerified {
		c.JSON(http.StatusAccepted, gin.H{"message": "if the account exists a reset email will be sent"})
		return
	}

	if err := h.enqueuePasswordReset(c.Request.Context(), user); err != nil {
		slog.Error("failed to send password reset email", "err", err, "email", user.Email)
		respondError(c, http.StatusInternalServerError, "password_reset_failed", "failed to initiate password reset")
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "if the account exists a reset email will be sent"})
}

func (h *handler) confirmPasswordReset(c *gin.Context) {
	if hasQueryParameter(c, "token", "password") {
		respondError(c, http.StatusBadRequest, "credentials_in_query", "sensitive credentials must not be sent in the query string")
		return
	}

	var req passwordResetConfirmRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_request", "invalid request payload")
		return
	}

	token := strings.TrimSpace(req.Token)
	password := strings.TrimSpace(req.Password)

	if token == "" || password == "" {
		respondError(c, http.StatusBadRequest, "invalid_request", "token and password are required")
		return
	}

	if len(password) < 8 {
		respondError(c, http.StatusBadRequest, "password_too_short", "password must be at least 8 characters")
		return
	}

	reset, ok := h.lookupPasswordReset(token)
	if !ok {
		respondError(c, http.StatusBadRequest, "invalid_token", "reset token is invalid or expired")
		return
	}

	user, err := h.store.GetUserByID(c.Request.Context(), reset.userID)
	if err != nil {
		slog.Error("failed to load user for password reset", "err", err, "userID", reset.userID)
		respondError(c, http.StatusInternalServerError, "password_reset_failed", "failed to reset password")
		return
	}

	if !strings.EqualFold(strings.TrimSpace(user.Email), reset.email) {
		h.removePasswordReset(token)
		respondError(c, http.StatusBadRequest, "invalid_token", "reset token is invalid or expired")
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "password_reset_failed", "failed to reset password")
		return
	}

	user.PasswordHash = string(hashed)
	user.EmailVerified = true
	if err := h.store.UpdateUser(c.Request.Context(), user); err != nil {
		slog.Error("failed to update user during password reset", "err", err, "userID", user.ID)
		respondError(c, http.StatusInternalServerError, "password_reset_failed", "failed to reset password")
		return
	}

	h.removePasswordReset(token)

	sessionToken, expiresAt, err := h.createSession(user.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "session_creation_failed", "failed to create session")
		return
	}

	h.setSessionCookie(c, sessionToken, expiresAt)

	c.JSON(http.StatusOK, gin.H{
		"message":   "password reset successful",
		"token":     sessionToken,
		"expiresAt": expiresAt.UTC(),
		"user":      sanitizeUser(user, nil),
	})
}

var allowedAdminRoles = map[string]struct{}{
	"admin":    {},
	"operator": {},
	"user":     {},
}

func (h *handler) getAdminSettings(c *gin.Context) {
	if _, ok := h.requireAdminOrOperator(c); !ok {
		return
	}
	settings, err := service.GetAdminSettings(c.Request.Context())
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrServiceDBNotInitialized) {
			status = http.StatusServiceUnavailable
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"version": settings.Version,
		"matrix":  settings.Matrix,
	})
}

func (h *handler) updateAdminSettings(c *gin.Context) {
	if _, ok := h.requireAdminOrOperator(c); !ok {
		return
	}

	var req struct {
		Version uint64                     `json:"version"`
		Matrix  map[string]map[string]bool `json:"matrix"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	normalized, err := normalizeAdminMatrix(req.Matrix)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := service.SaveAdminSettings(c.Request.Context(), service.AdminSettings{
		Version: req.Version,
		Matrix:  normalized,
	})
	if err != nil {
		if errors.Is(err, service.ErrAdminSettingsVersionConflict) {
			c.JSON(http.StatusConflict, gin.H{
				"error":   err.Error(),
				"version": updated.Version,
				"matrix":  updated.Matrix,
			})
			return
		}
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrServiceDBNotInitialized) {
			status = http.StatusServiceUnavailable
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"version": updated.Version,
		"matrix":  updated.Matrix,
	})
}

func normalizeAdminMatrix(in map[string]map[string]bool) (map[string]map[string]bool, error) {
	if in == nil {
		return make(map[string]map[string]bool), nil
	}
	out := make(map[string]map[string]bool, len(in))
	for module, roles := range in {
		moduleKey := strings.TrimSpace(module)
		if moduleKey == "" {
			return nil, errors.New("module key cannot be empty")
		}
		if roles == nil {
			out[moduleKey] = make(map[string]bool)
			continue
		}
		normalizedRoles := make(map[string]bool, len(roles))
		for role, enabled := range roles {
			key := strings.ToLower(strings.TrimSpace(role))
			if key == "" {
				return nil, errors.New("role cannot be empty")
			}
			if _, ok := allowedAdminRoles[key]; !ok {
				return nil, fmt.Errorf("unsupported role: %s", role)
			}
			normalizedRoles[key] = enabled
		}
		out[moduleKey] = normalizedRoles
	}
	return out, nil
}

func (h *handler) login(c *gin.Context) {
	if hasQueryParameter(c, "username", "password", "identifier", "totp") {
		respondError(c, http.StatusBadRequest, "credentials_in_query", "sensitive credentials must not be sent in the query string")
		return
	}

	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_request", "invalid request payload")
		return
	}

	identifier := strings.TrimSpace(req.Identifier)
	if identifier == "" {
		identifier = strings.TrimSpace(req.Username)
	}
	if identifier == "" {
		identifier = strings.TrimSpace(req.Email)
	}

	password := strings.TrimSpace(req.Password)
	totpCode := strings.TrimSpace(req.TOTPCode)

	if identifier == "" {
		respondError(c, http.StatusBadRequest, "missing_credentials", "identifier is required")
		return
	}

	user, err := h.findUserByIdentifier(c.Request.Context(), identifier)
	if err != nil {
		if errors.Is(err, store.ErrUserNotFound) {
			respondError(c, http.StatusNotFound, "user_not_found", "user not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "authentication_failed", "failed to authenticate user")
		return
	}

	if password != "" {
		if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)) != nil {
			respondError(c, http.StatusUnauthorized, "invalid_credentials", "invalid credentials")
			return
		}
	} else {
		if totpCode == "" {
			respondError(c, http.StatusBadRequest, "missing_credentials", "totp code is required")
			return
		}
		if !strings.EqualFold(strings.TrimSpace(user.Email), identifier) {
			respondError(c, http.StatusUnauthorized, "password_required", "password required for this identifier")
			return
		}
	}

	if strings.TrimSpace(user.Email) != "" && !user.EmailVerified {
		respondError(c, http.StatusUnauthorized, "email_not_verified", "email must be verified before login")
		return
	}

	if user.MFAEnabled {
		if totpCode == "" {
			respondError(c, http.StatusBadRequest, "mfa_code_required", "totp code is required")
			return
		}

		valid, err := totp.ValidateCustom(totpCode, user.MFATOTPSecret, time.Now().UTC(), totp.ValidateOpts{
			Period:    30,
			Skew:      1,
			Digits:    otp.DigitsSix,
			Algorithm: otp.AlgorithmSHA1,
		})
		if err != nil {
			respondError(c, http.StatusInternalServerError, "invalid_mfa_code", "invalid totp code")
			return
		}
		if !valid {
			respondError(c, http.StatusUnauthorized, "invalid_mfa_code", "invalid totp code")
			return
		}

		token, expiresAt, err := h.createSession(user.ID)
		if err != nil {
			respondError(c, http.StatusInternalServerError, "session_creation_failed", "failed to create session")
			return
		}

		h.setSessionCookie(c, token, expiresAt)

		c.JSON(http.StatusOK, gin.H{
			"message":   "login successful",
			"token":     token,
			"expiresAt": expiresAt.UTC(),
			"user":      sanitizeUser(user, nil),
		})
		return
	}

	token, expiresAt, err := h.createSession(user.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "session_creation_failed", "failed to create session")
		return
	}

	h.setSessionCookie(c, token, expiresAt)

	response := gin.H{
		"message":   "login successful",
		"token":     token,
		"expiresAt": expiresAt.UTC(),
		"user":      sanitizeUser(user, nil),
	}

	if challengeToken, err := h.createMFAChallenge(user.ID); err != nil {
		slog.Error("failed to create mfa challenge during login", "err", err, "userID", user.ID)
	} else {
		response["mfaToken"] = challengeToken
	}

	c.JSON(http.StatusOK, response)
}

func (h *handler) findUserByIdentifier(ctx context.Context, identifier string) (*store.User, error) {
	user, err := h.store.GetUserByName(ctx, identifier)
	if err == nil {
		return user, nil
	}
	if err != nil && !errors.Is(err, store.ErrUserNotFound) {
		return nil, err
	}
	return h.store.GetUserByEmail(ctx, identifier)
}

func (h *handler) session(c *gin.Context) {
	token := extractToken(c.GetHeader("Authorization"))
	if token == "" {
		if value := c.Query("token"); value != "" {
			token = value
		}
	}
	if token == "" {
		if cookie, err := c.Cookie(sessionCookieName); err == nil {
			cookie = strings.TrimSpace(cookie)
			if cookie != "" {
				token = cookie
			}
		}
	}
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "session token required"})
		return
	}

	sess, ok := h.lookupSession(token)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "session not found"})
		return
	}

	user, err := h.store.GetUserByID(c.Request.Context(), sess.userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load session user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": sanitizeUser(user, nil)})
}

func (h *handler) deleteSession(c *gin.Context) {
	token := extractToken(c.GetHeader("Authorization"))
	if token == "" {
		if value := c.Query("token"); value != "" {
			token = value
		}
	}
	if token == "" {
		if cookie, err := c.Cookie(sessionCookieName); err == nil {
			cookie = strings.TrimSpace(cookie)
			if cookie != "" {
				token = cookie
			}
		}
	}
	if token == "" {
		c.Status(http.StatusNoContent)
		return
	}

	h.removeSession(token)
	c.Status(http.StatusNoContent)
}

func (h *handler) createSession(userID string) (string, time.Time, error) {
	token, err := h.newRandomToken()
	if err != nil {
		return "", time.Time{}, err
	}
	ttl := h.sessionTTL
	if ttl <= 0 {
		ttl = defaultSessionTTL
	}
	expiresAt := time.Now().Add(ttl)

	h.mu.Lock()
	defer h.mu.Unlock()
	h.sessions[token] = session{userID: userID, expiresAt: expiresAt}
	return token, expiresAt, nil
}

func (h *handler) setSessionCookie(c *gin.Context, token string, expiresAt time.Time) {
	maxAge := int(time.Until(expiresAt).Seconds())
	if maxAge < 0 {
		maxAge = 0
	}
	secure := c.Request.TLS != nil
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(sessionCookieName, token, maxAge, "/", "", secure, true)
}

func (h *handler) lookupSession(token string) (session, bool) {
	h.mu.RLock()
	sess, ok := h.sessions[token]
	h.mu.RUnlock()
	if !ok {
		return session{}, false
	}
	if time.Now().After(sess.expiresAt) {
		h.removeSession(token)
		return session{}, false
	}
	return sess, true
}

func (h *handler) removeSession(token string) {
	h.mu.Lock()
	delete(h.sessions, token)
	h.mu.Unlock()
}

func (h *handler) newRandomToken() (string, error) {
	buffer := make([]byte, 32)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return hex.EncodeToString(buffer), nil
}

func (h *handler) newVerificationCode() (string, error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func (h *handler) effectiveMFAChallengeTTL() time.Duration {
	ttl := h.mfaChallengeTTL
	if ttl <= 0 {
		ttl = defaultMFAChallengeTTL
	}
	return ttl
}

func clearMFAChallenge(ch *mfaChallenge) {
	if ch == nil {
		return
	}
	ch.totpSecret = ""
	ch.totpIssuer = ""
	ch.totpAccount = ""
	ch.totpIssuedAt = time.Time{}
	ch.failedAttempts = 0
	ch.lockedUntil = time.Time{}
}

func (h *handler) updateMFAChallenge(token string, update func(*mfaChallenge) bool) (mfaChallenge, bool) {
	h.mfaMu.Lock()
	defer h.mfaMu.Unlock()

	challenge, ok := h.mfaChallenges[token]
	if !ok {
		return mfaChallenge{}, false
	}

	if time.Now().After(challenge.expiresAt) {
		clearMFAChallenge(&challenge)
		delete(h.mfaChallenges, token)
		return mfaChallenge{}, false
	}

	if update != nil {
		if !update(&challenge) {
			clearMFAChallenge(&challenge)
			delete(h.mfaChallenges, token)
			return mfaChallenge{}, false
		}
		h.mfaChallenges[token] = challenge
	}

	return challenge, true
}

func (h *handler) createMFAChallenge(userID string) (string, error) {
	token, err := h.newRandomToken()
	if err != nil {
		return "", err
	}
	ttl := h.effectiveMFAChallengeTTL()
	challenge := mfaChallenge{userID: userID, expiresAt: time.Now().Add(ttl)}
	h.mfaMu.Lock()
	h.mfaChallenges[token] = challenge
	h.mfaMu.Unlock()
	return token, nil
}

func (h *handler) lookupMFAChallenge(token string) (mfaChallenge, bool) {
	return h.updateMFAChallenge(token, nil)
}

func (h *handler) refreshMFAChallenge(token string) (mfaChallenge, bool) {
	ttl := h.effectiveMFAChallengeTTL()
	return h.updateMFAChallenge(token, func(ch *mfaChallenge) bool {
		ch.expiresAt = time.Now().Add(ttl)
		return true
	})
}

func (h *handler) enqueueEmailVerification(ctx context.Context, user *store.User) error {
	email := strings.TrimSpace(user.Email)
	if email == "" {
		return errors.New("user email is empty")
	}

	ttl := h.verificationTTL
	if ttl <= 0 {
		ttl = defaultEmailVerificationTTL
	}

	expiresAt := time.Now().Add(ttl)
	code, err := h.newVerificationCode()
	if err != nil {
		return err
	}

	normalizedEmail := strings.ToLower(email)
	verification := emailVerification{
		userID:    user.ID,
		email:     normalizedEmail,
		code:      code,
		expiresAt: expiresAt,
	}

	h.verificationMu.Lock()
	h.verifications[normalizedEmail] = verification
	h.verificationMu.Unlock()

	name := strings.TrimSpace(user.Name)
	if name == "" {
		name = "there"
	}

	subject := "Verify your XControl account"
	plainBody := fmt.Sprintf("Hello %s,\n\nUse the following verification code to verify your XControl account: %s\n\nThis code expires at %s UTC (in %d minutes).\nIf you did not request this email you can ignore it.\n", name, code, expiresAt.UTC().Format(time.RFC3339), int(ttl.Minutes()))
	htmlBody := fmt.Sprintf("<p>Hello %s,</p><p>Use the following verification code to verify your XControl account:</p><p><strong>%s</strong></p><p>This code expires at %s UTC (in %d minutes).</p><p>If you did not request this email you can ignore it.</p>", html.EscapeString(name), code, expiresAt.UTC().Format(time.RFC3339), int(ttl.Minutes()))

	msg := EmailMessage{
		To:        []string{email},
		Subject:   subject,
		PlainBody: plainBody,
		HTMLBody:  htmlBody,
	}

	if err := h.emailSender.Send(ctx, msg); err != nil {
		h.removeEmailVerification(normalizedEmail)
		return err
	}

	return nil
}

func (h *handler) lookupEmailVerification(email string) (emailVerification, bool) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return emailVerification{}, false
	}

	h.verificationMu.RLock()
	verification, ok := h.verifications[email]
	h.verificationMu.RUnlock()
	if !ok {
		return emailVerification{}, false
	}

	if time.Now().After(verification.expiresAt) {
		h.removeEmailVerification(email)
		return emailVerification{}, false
	}

	return verification, true
}

func (h *handler) removeEmailVerification(email string) {
	h.verificationMu.Lock()
	delete(h.verifications, strings.ToLower(strings.TrimSpace(email)))
	h.verificationMu.Unlock()
}

func (h *handler) issueRegistrationVerification(ctx context.Context, email string) (registrationVerification, error) {
	normalized := strings.ToLower(strings.TrimSpace(email))
	if normalized == "" {
		return registrationVerification{}, errors.New("email is empty")
	}

	ttl := h.verificationTTL
	if ttl <= 0 {
		ttl = defaultEmailVerificationTTL
	}

	code, err := h.newVerificationCode()
	if err != nil {
		return registrationVerification{}, err
	}

	verification := registrationVerification{
		email:     normalized,
		code:      code,
		expiresAt: time.Now().Add(ttl),
	}

	h.registrationMu.Lock()
	h.registrationVerifications[normalized] = verification
	h.registrationMu.Unlock()

	trimmedEmail := strings.TrimSpace(email)
	if trimmedEmail == "" {
		trimmedEmail = normalized
	}

	subject := "Verify your email for XControl"
	plainBody := fmt.Sprintf(
		"Hello,\n\nUse the following verification code to continue creating your XControl account: %s\n\nThis code expires at %s UTC (in %d minutes).\nIf you did not request this email you can ignore it.\n",
		code,
		verification.expiresAt.UTC().Format(time.RFC3339),
		int(ttl.Minutes()),
	)
	htmlBody := fmt.Sprintf(
		"<p>Hello,</p><p>Use the following verification code to continue creating your XControl account:</p><p><strong>%s</strong></p><p>This code expires at %s UTC (in %d minutes).</p><p>If you did not request this email you can ignore it.</p>",
		html.EscapeString(code),
		verification.expiresAt.UTC().Format(time.RFC3339),
		int(ttl.Minutes()),
	)

	msg := EmailMessage{
		To:        []string{trimmedEmail},
		Subject:   subject,
		PlainBody: plainBody,
		HTMLBody:  htmlBody,
	}

	if err := h.emailSender.Send(ctx, msg); err != nil {
		h.removeRegistrationVerification(normalized)
		return registrationVerification{}, err
	}

	return verification, nil
}

func (h *handler) lookupRegistrationVerification(email string) (registrationVerification, bool) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return registrationVerification{}, false
	}

	h.registrationMu.RLock()
	verification, ok := h.registrationVerifications[email]
	h.registrationMu.RUnlock()
	if !ok {
		return registrationVerification{}, false
	}

	if time.Now().After(verification.expiresAt) {
		h.removeRegistrationVerification(email)
		return registrationVerification{}, false
	}

	return verification, true
}

func (h *handler) markRegistrationVerified(email string) bool {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return false
	}

	h.registrationMu.Lock()
	defer h.registrationMu.Unlock()

	verification, ok := h.registrationVerifications[email]
	if !ok {
		return false
	}

	if time.Now().After(verification.expiresAt) {
		delete(h.registrationVerifications, email)
		return false
	}

	verification.verified = true
	h.registrationVerifications[email] = verification
	return true
}

func (h *handler) removeRegistrationVerification(email string) {
	h.registrationMu.Lock()
	delete(h.registrationVerifications, strings.ToLower(strings.TrimSpace(email)))
	h.registrationMu.Unlock()
}

func (h *handler) enqueuePasswordReset(ctx context.Context, user *store.User) error {
	email := strings.TrimSpace(user.Email)
	if email == "" {
		return errors.New("user email is empty")
	}

	token, err := h.newRandomToken()
	if err != nil {
		return err
	}

	ttl := h.resetTTL
	if ttl <= 0 {
		ttl = defaultPasswordResetTTL
	}

	expiresAt := time.Now().Add(ttl)
	reset := passwordReset{
		userID:    user.ID,
		email:     strings.ToLower(email),
		expiresAt: expiresAt,
	}

	h.resetMu.Lock()
	h.passwordResets[token] = reset
	h.resetMu.Unlock()

	name := strings.TrimSpace(user.Name)
	if name == "" {
		name = "there"
	}

	subject := "Reset your XControl password"
	plainBody := fmt.Sprintf("Hello %s,\n\nUse the following token to reset your XControl account password: %s\n\nThis token expires at %s UTC.\nIf you did not request a reset you can ignore this email.\n", name, token, expiresAt.UTC().Format(time.RFC3339))
	htmlBody := fmt.Sprintf("<p>Hello %s,</p><p>Use the following token to reset your XControl account password:</p><p><strong>%s</strong></p><p>This token expires at %s UTC.</p><p>If you did not request a reset you can ignore this email.</p>", html.EscapeString(name), token, expiresAt.UTC().Format(time.RFC3339))

	msg := EmailMessage{
		To:        []string{email},
		Subject:   subject,
		PlainBody: plainBody,
		HTMLBody:  htmlBody,
	}

	if err := h.emailSender.Send(ctx, msg); err != nil {
		h.removePasswordReset(token)
		return err
	}

	return nil
}

func (h *handler) lookupPasswordReset(token string) (passwordReset, bool) {
	token = strings.TrimSpace(token)
	if token == "" {
		return passwordReset{}, false
	}

	h.resetMu.RLock()
	reset, ok := h.passwordResets[token]
	h.resetMu.RUnlock()
	if !ok {
		return passwordReset{}, false
	}

	if time.Now().After(reset.expiresAt) {
		h.removePasswordReset(token)
		return passwordReset{}, false
	}

	return reset, true
}

func (h *handler) removePasswordReset(token string) {
	h.resetMu.Lock()
	delete(h.passwordResets, strings.TrimSpace(token))
	h.resetMu.Unlock()
}

func (h *handler) removeMFAChallenge(token string) {
	h.mfaMu.Lock()
	if challenge, ok := h.mfaChallenges[token]; ok {
		clearMFAChallenge(&challenge)
		delete(h.mfaChallenges, token)
	}
	h.mfaMu.Unlock()
}

func (h *handler) removeMFAChallengesForUser(userID string) {
	if userID == "" {
		return
	}
	h.mfaMu.Lock()
	for token, challenge := range h.mfaChallenges {
		if challenge.userID == userID {
			clearMFAChallenge(&challenge)
			delete(h.mfaChallenges, token)
		}
	}
	h.mfaMu.Unlock()
}

func (h *handler) provisionTOTP(c *gin.Context) {
	var req struct {
		Token   string `json:"token"`
		Issuer  string `json:"issuer"`
		Account string `json:"account"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_request", "invalid request payload")
		return
	}

	token := strings.TrimSpace(req.Token)
	ctx := c.Request.Context()
	var (
		user      *store.User
		err       error
		challenge mfaChallenge
		ok        bool
	)

	if token != "" {
		challenge, ok = h.refreshMFAChallenge(token)
		if !ok {
			respondError(c, http.StatusUnauthorized, "invalid_mfa_token", "mfa token is invalid or expired")
			return
		}

		user, err = h.store.GetUserByID(ctx, challenge.userID)
		if err != nil {
			respondError(c, http.StatusInternalServerError, "mfa_user_lookup_failed", "failed to load user for mfa provisioning")
			return
		}
	} else {
		sessionToken := extractToken(c.GetHeader("Authorization"))
		if sessionToken == "" {
			respondError(c, http.StatusBadRequest, "mfa_token_required", "mfa token or valid session is required")
			return
		}

		sess, ok := h.lookupSession(sessionToken)
		if !ok {
			respondError(c, http.StatusUnauthorized, "invalid_session", "session token is invalid or expired")
			return
		}

		user, err = h.store.GetUserByID(ctx, sess.userID)
		if err != nil {
			respondError(c, http.StatusInternalServerError, "mfa_user_lookup_failed", "failed to load user for mfa provisioning")
			return
		}

		challengeToken, err := h.createMFAChallenge(user.ID)
		if err != nil {
			respondError(c, http.StatusInternalServerError, "mfa_challenge_creation_failed", "failed to create mfa challenge")
			return
		}

		token = challengeToken
		challenge, ok = h.refreshMFAChallenge(token)
		if !ok {
			respondError(c, http.StatusInternalServerError, "mfa_challenge_creation_failed", "failed to initialize mfa challenge")
			return
		}
	}

	if user.MFAEnabled {
		respondError(c, http.StatusBadRequest, "mfa_already_enabled", "mfa already enabled for this account")
		return
	}

	issuer := strings.TrimSpace(req.Issuer)
	if issuer == "" {
		issuer = strings.TrimSpace(h.totpIssuer)
		if issuer == "" {
			issuer = defaultTOTPIssuer
		}
	}

	accountName := strings.TrimSpace(req.Account)
	if accountName == "" {
		accountName = deriveDefaultAccountLabel(user, issuer)
	}

	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      issuer,
		AccountName: accountName,
		Period:      30,
		Digits:      otp.DigitsSix,
		Algorithm:   otp.AlgorithmSHA1,
	})
	if err != nil {
		respondError(c, http.StatusInternalServerError, "mfa_secret_generation_failed", "failed to generate totp secret")
		return
	}

	issuedAt := time.Now().UTC()
	ttl := h.effectiveMFAChallengeTTL()

	pendingChallenge, ok := h.refreshMFAChallenge(token)
	if !ok || pendingChallenge.userID != user.ID {
		respondError(c, http.StatusUnauthorized, "invalid_mfa_token", "mfa token is invalid or expired")
		return
	}

	secret := strings.TrimSpace(key.Secret())
	previousSecret := user.MFATOTPSecret
	previousIssuedAt := user.MFASecretIssuedAt
	previousConfirmedAt := user.MFAConfirmedAt
	previousEnabled := user.MFAEnabled

	user.MFATOTPSecret = secret
	user.MFASecretIssuedAt = issuedAt
	user.MFAConfirmedAt = time.Time{}
	user.MFAEnabled = false

	if err := h.store.UpdateUser(ctx, user); err != nil {
		user.MFATOTPSecret = previousSecret
		user.MFASecretIssuedAt = previousIssuedAt
		user.MFAConfirmedAt = previousConfirmedAt
		user.MFAEnabled = previousEnabled
		respondError(c, http.StatusInternalServerError, "mfa_setup_failed", "failed to persist mfa provisioning state")
		return
	}

	pendingChallenge, ok = h.updateMFAChallenge(token, func(ch *mfaChallenge) bool {
		if ch.userID != user.ID {
			return false
		}
		ch.totpSecret = secret
		ch.totpIssuer = issuer
		ch.totpAccount = accountName
		ch.totpIssuedAt = issuedAt
		ch.failedAttempts = 0
		ch.lockedUntil = time.Time{}
		ch.expiresAt = time.Now().Add(ttl)
		return true
	})
	if !ok {
		user.MFATOTPSecret = previousSecret
		user.MFASecretIssuedAt = previousIssuedAt
		user.MFAConfirmedAt = previousConfirmedAt
		user.MFAEnabled = previousEnabled
		if err := h.store.UpdateUser(ctx, user); err != nil {
			slog.Error("failed to revert mfa provisioning state", "err", err, "userID", user.ID)
		}
		respondError(c, http.StatusInternalServerError, "mfa_challenge_creation_failed", "failed to initialize mfa challenge")
		return
	}

	state := buildMFAState(user, &pendingChallenge)
	sanitized := sanitizeUser(user, &pendingChallenge)
	c.JSON(http.StatusOK, gin.H{
		"secret":      secret,
		"otpauth_url": key.URL(),
		"issuer":      issuer,
		"account":     accountName,
		"mfaToken":    token,
		"mfa":         state,
		"user":        sanitized,
	})
}

func deriveDefaultAccountLabel(user *store.User, issuer string) string {
	if user == nil {
		if issuer == "" {
			return "account"
		}
		return fmt.Sprintf("%s account", issuer)
	}

	identifier := strings.TrimSpace(user.ID)
	if identifier == "" {
		if issuer == "" {
			return "account"
		}
		return fmt.Sprintf("%s account", issuer)
	}

	sum := sha1.Sum([]byte(identifier))
	encoder := base32.StdEncoding.WithPadding(base32.NoPadding)
	encoded := strings.ToLower(encoder.EncodeToString(sum[:]))
	if len(encoded) > 10 {
		encoded = encoded[:10]
	}
	return fmt.Sprintf("user-%s", encoded)
}

func (h *handler) verifyTOTP(c *gin.Context) {
	var req struct {
		Token string `json:"token"`
		Code  string `json:"code"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_request", "invalid request payload")
		return
	}

	token := strings.TrimSpace(req.Token)
	if token == "" {
		respondError(c, http.StatusBadRequest, "mfa_token_required", "mfa token is required")
		return
	}

	challenge, ok := h.lookupMFAChallenge(token)
	if !ok {
		respondError(c, http.StatusUnauthorized, "invalid_mfa_token", "mfa token is invalid or expired")
		return
	}

	ctx := c.Request.Context()
	user, err := h.store.GetUserByID(ctx, challenge.userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "mfa_user_lookup_failed", "failed to load user for verification")
		return
	}

	challenge, ok = h.updateMFAChallenge(token, func(ch *mfaChallenge) bool {
		if ch.userID != user.ID {
			return false
		}
		ch.expiresAt = time.Now().Add(h.effectiveMFAChallengeTTL())
		return true
	})
	if !ok {
		respondError(c, http.StatusUnauthorized, "invalid_mfa_token", "mfa token is invalid or expired")
		return
	}

	now := time.Now()
	if !challenge.lockedUntil.IsZero() && now.Before(challenge.lockedUntil) {
		retryAt := challenge.lockedUntil.UTC()
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":    "mfa_challenge_locked",
			"message":  "too many invalid mfa attempts, try again later",
			"retryAt":  retryAt,
			"mfaToken": token,
		})
		return
	}

	secret := strings.TrimSpace(user.MFATOTPSecret)
	if secret == "" {
		secret = strings.TrimSpace(challenge.totpSecret)
	}
	if secret == "" {
		respondError(c, http.StatusBadRequest, "mfa_secret_missing", "mfa secret has not been provisioned")
		return
	}

	code := strings.TrimSpace(req.Code)
	if code == "" {
		respondError(c, http.StatusBadRequest, "mfa_code_required", "totp code is required")
		return
	}

	valid, err := totp.ValidateCustom(code, secret, time.Now().UTC(), totp.ValidateOpts{
		Period:    30,
		Skew:      1,
		Digits:    otp.DigitsSix,
		Algorithm: otp.AlgorithmSHA1,
	})
	if err != nil {
		respondError(c, http.StatusInternalServerError, "invalid_mfa_code", "invalid totp code")
		return
	}
	if !valid {
		ttl := h.effectiveMFAChallengeTTL()
		updatedChallenge, ok := h.updateMFAChallenge(token, func(ch *mfaChallenge) bool {
			if ch.userID != user.ID {
				return false
			}
			if now.Before(ch.lockedUntil) {
				return true
			}
			ch.failedAttempts++
			if ch.failedAttempts >= maxMFAVerificationAttempts {
				ch.failedAttempts = 0
				ch.lockedUntil = now.Add(defaultMFALockoutDuration)
			}
			ch.expiresAt = time.Now().Add(ttl)
			return true
		})
		if ok {
			challenge = updatedChallenge
		}

		if !challenge.lockedUntil.IsZero() && now.Before(challenge.lockedUntil) {
			retryAt := challenge.lockedUntil.UTC()
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":    "mfa_challenge_locked",
				"message":  "too many invalid mfa attempts, try again later",
				"retryAt":  retryAt,
				"mfaToken": token,
			})
			return
		}

		respondError(c, http.StatusUnauthorized, "invalid_mfa_code", "invalid totp code")
		return
	}

	confirmationTime := time.Now().UTC()
	issuedAt := challenge.totpIssuedAt
	if issuedAt.IsZero() {
		issuedAt = confirmationTime
	}

	if strings.TrimSpace(user.MFATOTPSecret) == "" {
		user.MFATOTPSecret = secret
	}
	if user.MFASecretIssuedAt.IsZero() {
		user.MFASecretIssuedAt = issuedAt
	}
	user.MFAEnabled = true
	user.MFAConfirmedAt = confirmationTime

	if err := h.store.UpdateUser(ctx, user); err != nil {
		respondError(c, http.StatusInternalServerError, "mfa_update_failed", "failed to enable mfa")
		return
	}

	h.removeMFAChallenge(token)

	sessionToken, expiresAt, err := h.createSession(user.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "session_creation_failed", "failed to create session")
		return
	}

	h.setSessionCookie(c, sessionToken, expiresAt)

	c.JSON(http.StatusOK, gin.H{
		"message":   "mfa_verified",
		"token":     sessionToken,
		"expiresAt": expiresAt.UTC(),
		"user":      sanitizeUser(user, nil),
	})
}

func (h *handler) mfaStatus(c *gin.Context) {
	token := strings.TrimSpace(c.Query("token"))
	if token == "" {
		token = strings.TrimSpace(c.GetHeader("X-MFA-Token"))
	}

	identifier := strings.TrimSpace(c.Query("identifier"))
	if identifier == "" {
		identifier = strings.TrimSpace(c.Query("email"))
	}

	authToken := extractToken(c.GetHeader("Authorization"))

	var (
		user      *store.User
		err       error
		challenge *mfaChallenge
	)

	ctx := c.Request.Context()

	if authToken != "" {
		if sess, ok := h.lookupSession(authToken); ok {
			user, err = h.store.GetUserByID(ctx, sess.userID)
			if err != nil {
				respondError(c, http.StatusInternalServerError, "mfa_status_failed", "failed to load user for status")
				return
			}
		} else if token == "" {
			token = authToken
		}
	}

	if token != "" {
		if refreshed, ok := h.refreshMFAChallenge(token); ok {
			if user != nil && user.ID != refreshed.userID {
				challenge = nil
			} else {
				challenge = &refreshed
				if user == nil {
					user, err = h.store.GetUserByID(ctx, refreshed.userID)
					if err != nil {
						respondError(c, http.StatusInternalServerError, "mfa_status_failed", "failed to load user for status")
						return
					}
				}
			}
		}
	}

	if user == nil && identifier != "" {
		user, err = h.findUserByIdentifier(ctx, identifier)
		if err != nil {
			if errors.Is(err, store.ErrUserNotFound) {
				respondError(c, http.StatusNotFound, "user_not_found", "user not found")
				return
			}
			respondError(c, http.StatusInternalServerError, "mfa_status_failed", "failed to load user for status")
			return
		}
	}

	if user == nil {
		respondError(c, http.StatusUnauthorized, "mfa_token_required", "valid session or mfa token is required")
		return
	}

	state := buildMFAState(user, challenge)
	c.JSON(http.StatusOK, gin.H{
		"enabled": user.MFAEnabled,
		"mfa":     state,
		"user":    sanitizeUser(user, challenge),
	})
}

func sanitizeUser(user *store.User, challenge *mfaChallenge) gin.H {
	identifier := strings.TrimSpace(user.ID)
	groups := user.Groups
	if len(groups) == 0 {
		groups = []string{}
	} else {
		cloned := make([]string, len(groups))
		copy(cloned, groups)
		groups = cloned
	}
	permissions := user.Permissions
	if len(permissions) == 0 {
		permissions = []string{}
	} else {
		cloned := make([]string, len(permissions))
		copy(cloned, permissions)
		permissions = cloned
	}
	return gin.H{
		"id":            identifier,
		"uuid":          identifier,
		"name":          user.Name,
		"username":      user.Name,
		"email":         user.Email,
		"emailVerified": user.EmailVerified,
		"mfaEnabled":    user.MFAEnabled,
		"mfa":           buildMFAState(user, challenge),
		"role":          user.Role,
		"groups":        groups,
		"permissions":   permissions,
	}
}

func buildMFAState(user *store.User, challenge *mfaChallenge) gin.H {
	pending := strings.TrimSpace(user.MFATOTPSecret) != "" && !user.MFAEnabled
	issuedAt := user.MFASecretIssuedAt

	if challenge != nil && !user.MFAEnabled {
		if strings.TrimSpace(challenge.totpSecret) != "" {
			pending = true
		}
		if issuedAt.IsZero() && !challenge.totpIssuedAt.IsZero() {
			issuedAt = challenge.totpIssuedAt
		}
	}

	state := gin.H{
		"totpEnabled": user.MFAEnabled,
		"totpPending": pending,
	}
	if !issuedAt.IsZero() {
		state["totpSecretIssuedAt"] = issuedAt.UTC()
	}
	if !user.MFAConfirmedAt.IsZero() {
		state["totpConfirmedAt"] = user.MFAConfirmedAt.UTC()
	}
	if challenge != nil && !challenge.lockedUntil.IsZero() && time.Now().Before(challenge.lockedUntil) {
		state["totpLockedUntil"] = challenge.lockedUntil.UTC()
	}
	return state
}

func (h *handler) disableMFA(c *gin.Context) {
	token := extractToken(c.GetHeader("Authorization"))
	if token == "" {
		token = strings.TrimSpace(c.Query("token"))
	}
	if token == "" {
		respondError(c, http.StatusUnauthorized, "session_token_required", "session token is required")
		return
	}

	sess, ok := h.lookupSession(token)
	if !ok {
		respondError(c, http.StatusUnauthorized, "invalid_session", "session token is invalid or expired")
		return
	}

	ctx := c.Request.Context()
	user, err := h.store.GetUserByID(ctx, sess.userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "mfa_disable_failed", "failed to load user for mfa disable")
		return
	}

	hasSecret := strings.TrimSpace(user.MFATOTPSecret) != ""
	if !user.MFAEnabled && !hasSecret {
		respondError(c, http.StatusBadRequest, "mfa_not_enabled", "multi-factor authentication is not enabled")
		return
	}

	user.MFATOTPSecret = ""
	user.MFAEnabled = false
	user.MFASecretIssuedAt = time.Time{}
	user.MFAConfirmedAt = time.Time{}

	if err := h.store.UpdateUser(ctx, user); err != nil {
		respondError(c, http.StatusInternalServerError, "mfa_disable_failed", "failed to disable mfa")
		return
	}

	h.removeMFAChallengesForUser(user.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "mfa_disabled",
		"user":    sanitizeUser(user, nil),
	})
}

func respondError(c *gin.Context, status int, code, message string) {
	c.JSON(status, gin.H{
		"error":   code,
		"message": message,
	})
}

func extractToken(header string) string {
	if header == "" {
		return ""
	}
	const prefix = "Bearer "
	if strings.HasPrefix(header, prefix) {
		header = header[len(prefix):]
	}
	return strings.TrimSpace(header)
}

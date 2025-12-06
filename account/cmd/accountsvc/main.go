package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"account/api"
	"account/config"
	"account/internal/agentmode"
	"account/internal/agentproto"
	"account/internal/agentserver"
	"account/internal/auth"
	"account/internal/mailer"
	"account/internal/model"
	"account/internal/service"
	"account/internal/store"
	"account/internal/xrayconfig"
)

var (
	configPath string
	logLevel   string
)

type mailerAdapter struct {
	sender mailer.Sender
}

func (m mailerAdapter) Send(ctx context.Context, msg api.EmailMessage) error {
	if m.sender == nil {
		return nil
	}
	mail := mailer.Message{
		To:        append([]string(nil), msg.To...),
		Subject:   msg.Subject,
		PlainBody: msg.PlainBody,
		HTMLBody:  msg.HTMLBody,
	}
	return m.sender.Send(ctx, mail)
}

func runServer(ctx context.Context, cfg *config.Config, logger *slog.Logger) error {
	if ctx == nil {
		ctx = context.Background()
	}
	if cfg == nil {
		return errors.New("config is nil")
	}
	if logger == nil {
		logger = slog.Default()
	}

	r := gin.New()
	corsConfig := buildCORSConfig(logger, cfg.Server)
	if corsConfig.AllowAllOrigins {
		logger.Info("configured cors", "allowAllOrigins", true)
	} else {
		logger.Info("configured cors", "allowedOrigins", corsConfig.AllowOrigins)
	}
	r.Use(cors.New(corsConfig))
	r.Use(gin.Recovery())
	r.Use(func(c *gin.Context) {
		start := time.Now()
		c.Next()
		logger.Info("request", "method", c.Request.Method, "path", c.FullPath(), "status", c.Writer.Status(), "latency", time.Since(start))
	})

	storeCfg := store.Config{
		Driver:       cfg.Store.Driver,
		DSN:          cfg.Store.DSN,
		MaxOpenConns: cfg.Store.MaxOpenConns,
		MaxIdleConns: cfg.Store.MaxIdleConns,
	}

	st, cleanup, err := store.New(ctx, storeCfg)
	if err != nil {
		return err
	}
	defer func() {
		if cleanup == nil {
			return
		}
		if err := cleanup(context.Background()); err != nil {
			logger.Error("failed to close store", "err", err)
		}
	}()

	var emailSender api.EmailSender
	emailVerificationEnabled := true
	smtpHost := strings.TrimSpace(cfg.SMTP.Host)
	if smtpHost == "" {
		emailVerificationEnabled = false
	}
	if smtpHost != "" && isExampleDomain(smtpHost) {
		emailVerificationEnabled = false
		logger.Warn("smtp host is a placeholder; disabling email delivery", "host", smtpHost)
		smtpHost = ""
	}
	if smtpHost != "" {
		tlsMode := mailer.ParseTLSMode(cfg.SMTP.TLS.Mode)
		sender, err := mailer.New(mailer.Config{
			Host:               smtpHost,
			Port:               cfg.SMTP.Port,
			Username:           cfg.SMTP.Username,
			Password:           cfg.SMTP.Password,
			From:               cfg.SMTP.From,
			ReplyTo:            cfg.SMTP.ReplyTo,
			Timeout:            cfg.SMTP.Timeout,
			TLSMode:            tlsMode,
			InsecureSkipVerify: cfg.SMTP.TLS.InsecureSkipVerify,
		})
		if err != nil {
			return err
		}
		emailSender = mailerAdapter{sender: sender}
	}
	if emailSender == nil {
		emailVerificationEnabled = false
	}

	// Initialize TokenService for authentication
	var tokenService *auth.TokenService
	if cfg.Auth.Enable {
		accessExpiry := cfg.Auth.Token.AccessExpiry
		if accessExpiry <= 0 {
			accessExpiry = 1 * time.Hour
		}
		refreshExpiry := cfg.Auth.Token.RefreshExpiry
		if refreshExpiry <= 0 {
			refreshExpiry = 168 * time.Hour // 7 days
		}

		tokenService = auth.NewTokenService(auth.TokenConfig{
			PublicToken:   cfg.Auth.Token.PublicToken,
			RefreshSecret: cfg.Auth.Token.RefreshSecret,
			AccessSecret:  cfg.Auth.Token.AccessSecret,
			AccessExpiry:  accessExpiry,
			RefreshExpiry: refreshExpiry,
		})
		logger.Info("token service initialized", "auth_enabled", cfg.Auth.Enable)
	}

	gormDB, gormCleanup, err := openAdminSettingsDB(cfg.Store)
	if err != nil {
		return err
	}
	defer func() {
		if gormCleanup != nil {
			if err := gormCleanup(context.Background()); err != nil {
				logger.Error("failed to close admin settings db", "err", err)
			}
		}
	}()
	service.SetDB(gormDB)

	gormSource, err := xrayconfig.NewGormClientSource(gormDB)
	if err != nil {
		return err
	}

	var agentRegistry *agentserver.Registry
	if len(cfg.Agents.Credentials) > 0 {
		creds := make([]agentserver.Credential, 0, len(cfg.Agents.Credentials))
		for _, c := range cfg.Agents.Credentials {
			creds = append(creds, agentserver.Credential{
				ID:     c.ID,
				Name:   c.Name,
				Token:  c.Token,
				Groups: append([]string(nil), c.Groups...),
			})
		}
		agentRegistry, err = agentserver.NewRegistry(agentserver.Config{Credentials: creds})
		if err != nil {
			return err
		}
	}

	var stopXraySync func(context.Context) error
	if cfg.Xray.Sync.Enabled {
		syncInterval := cfg.Xray.Sync.Interval
		if syncInterval <= 0 {
			syncInterval = 5 * time.Minute
		}
		outputPath := strings.TrimSpace(cfg.Xray.Sync.OutputPath)
		if outputPath == "" {
			outputPath = "/usr/local/etc/xray/config.json"
		}
		syncer, err := xrayconfig.NewPeriodicSyncer(xrayconfig.PeriodicOptions{
			Logger:          logger.With("component", "xray-sync"),
			Interval:        syncInterval,
			Source:          gormSource,
			Generator:       xrayconfig.Generator{Definition: xrayconfig.DefaultDefinition(), OutputPath: outputPath},
			ValidateCommand: cfg.Xray.Sync.ValidateCommand,
			RestartCommand:  cfg.Xray.Sync.RestartCommand,
		})
		if err != nil {
			return err
		}
		stop, err := syncer.Start(ctx)
		if err != nil {
			return err
		}
		logger.Info("xray periodic sync enabled", "interval", syncInterval, "output", outputPath)
		stopXraySync = stop
	}

	if stopXraySync != nil {
		defer func() {
			waitCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := stopXraySync(waitCtx); err != nil {
				logger.Warn("xray syncer shutdown", "err", err)
			}
		}()
	}

	options := []api.Option{
		api.WithStore(st),
		api.WithSessionTTL(cfg.Session.TTL),
	}
	if emailSender != nil {
		options = append(options, api.WithEmailSender(emailSender))
	}
	options = append(options, api.WithEmailVerification(emailVerificationEnabled))
	if tokenService != nil {
		options = append(options, api.WithTokenService(tokenService))
	}
	if agentRegistry != nil {
		options = append(options, api.WithAgentStatusReader(agentRegistry))
	}
	api.RegisterRoutes(r, options...)

	if agentRegistry != nil {
		registerAgentAPIRoutes(r, agentRegistry, gormSource, logger)
	}

	addr := strings.TrimSpace(cfg.Server.Addr)
	if addr == "" {
		addr = ":8080"
	}

	tlsSettings := cfg.Server.TLS
	certFile := strings.TrimSpace(tlsSettings.CertFile)
	keyFile := strings.TrimSpace(tlsSettings.KeyFile)
	caFile := strings.TrimSpace(tlsSettings.CAFile)
	clientCAFile := strings.TrimSpace(tlsSettings.ClientCAFile)

	useTLS := tlsSettings.IsEnabled()

	var tlsConfig *tls.Config
	if useTLS {
		if certFile == "" || keyFile == "" {
			return fmt.Errorf("tls is enabled but certFile (%q) or keyFile (%q) is empty", certFile, keyFile)
		}

		cert, err := tls.LoadX509KeyPair(certFile, keyFile)
		if err != nil {
			return fmt.Errorf("failed to load tls certificate: %w", err)
		}

		if caFile != "" {
			caPEM, err := os.ReadFile(caFile)
			if err != nil {
				return fmt.Errorf("failed to read ca file %q: %w", caFile, err)
			}

			var block *pem.Block
			existing := make(map[string]struct{}, len(cert.Certificate))
			for _, c := range cert.Certificate {
				existing[string(c)] = struct{}{}
			}

			for len(caPEM) > 0 {
				block, caPEM = pem.Decode(caPEM)
				if block == nil {
					break
				}
				if block.Type != "CERTIFICATE" || len(block.Bytes) == 0 {
					continue
				}
				if _, ok := existing[string(block.Bytes)]; ok {
					continue
				}
				cert.Certificate = append(cert.Certificate, block.Bytes)
			}

			if len(cert.Certificate) == 0 {
				return fmt.Errorf("ca file %q did not contain any certificates", caFile)
			}
		}

		tlsConfig = &tls.Config{
			MinVersion:   tls.VersionTLS12,
			Certificates: []tls.Certificate{cert},
		}

		if clientCAFile != "" {
			caBytes, err := os.ReadFile(clientCAFile)
			if err != nil {
				return err
			}
			pool := x509.NewCertPool()
			if !pool.AppendCertsFromPEM(caBytes) {
				return errors.New("failed to parse client CA file")
			}
			tlsConfig.ClientCAs = pool
			tlsConfig.ClientAuth = tls.RequireAndVerifyClientCert
		}
	} else {
		if certFile != "" || keyFile != "" {
			logger.Info("TLS disabled; certificate paths will be ignored", "certFile", certFile, "keyFile", keyFile)
		}
		if clientCAFile != "" {
			logger.Warn("client CA configured but TLS is disabled; ignoring", "clientCAFile", clientCAFile)
		}
	}

	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	if useTLS {
		srv.TLSConfig = tlsConfig
	}

	logger.Info("starting account service", "addr", addr, "tls", useTLS)

	var listenCertFile, listenKeyFile string
	if useTLS {
		if tlsSettings.RedirectHTTP {
			go func() {
				redirectAddr := deriveRedirectAddr(addr)
				redirectSrv := &http.Server{
					Addr: redirectAddr,
					Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						host := r.Host
						if host == "" {
							host = redirectAddr
						}
						target := "https://" + host + r.URL.RequestURI()
						http.Redirect(w, r, target, http.StatusPermanentRedirect)
					}),
				}
				if err := redirectSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
					logger.Error("http redirect listener exited", "err", err)
				}
			}()
		}

		if tlsConfig != nil && len(tlsConfig.Certificates) > 0 {
			listenCertFile = ""
			listenKeyFile = ""
		} else {
			listenCertFile = certFile
			listenKeyFile = keyFile
		}

		if err := srv.ListenAndServeTLS(listenCertFile, listenKeyFile); err != nil {
			if !errors.Is(err, http.ErrServerClosed) {
				logger.Error("account service shutdown", "err", err)
				return err
			}
		}
	} else {
		if err := srv.ListenAndServe(); err != nil {
			if !errors.Is(err, http.ErrServerClosed) {
				logger.Error("account service shutdown", "err", err)
				return err
			}
		}
	}
	return nil
}

func runServerAndAgent(ctx context.Context, cfg *config.Config, logger *slog.Logger) error {
	if ctx == nil {
		ctx = context.Background()
	}
	if cfg == nil {
		return errors.New("config is nil")
	}

	agentCtx, cancel := context.WithCancel(ctx)
	defer cancel()

	agentErrCh := make(chan error, 1)
	go func() {
		agentErrCh <- runAgent(agentCtx, cfg, logger)
	}()

	agentPending := true

	select {
	case err := <-agentErrCh:
		agentPending = false
		if err == nil {
			err = errors.New("agent exited unexpectedly")
		}
		return fmt.Errorf("agent startup failed: %w", err)
	default:
	}

	serverErr := runServer(ctx, cfg, logger)
	cancel()

	var agentErr error
	if agentPending {
		agentErr = <-agentErrCh
	}

	if serverErr != nil {
		return serverErr
	}
	if agentErr != nil {
		return agentErr
	}
	return nil
}

func runAgent(ctx context.Context, cfg *config.Config, logger *slog.Logger) error {
	if cfg == nil {
		return errors.New("config is nil")
	}
	if logger == nil {
		logger = slog.Default()
	}
	if !cfg.Xray.Sync.Enabled {
		logger.Warn("xray sync is disabled in configuration; agent mode will still attempt to manage xray config")
	}
	options := agentmode.Options{
		Logger: logger.With("component", "agent"),
		Agent:  cfg.Agent,
		Xray:   cfg.Xray,
	}
	return agentmode.Run(ctx, options)
}

const agentIdentityContextKey = "xcontrol-account-agent-identity"

func registerAgentAPIRoutes(r *gin.Engine, registry *agentserver.Registry, source xrayconfig.ClientSource, logger *slog.Logger) {
	if registry == nil {
		return
	}
	group := r.Group("/api/agent/v1")
	group.Use(agentAuthMiddleware(registry))
	group.GET("/users", agentListUsersHandler(source))
	group.POST("/status", agentReportStatusHandler(registry, logger))
}

func agentAuthMiddleware(registry *agentserver.Registry) gin.HandlerFunc {
	return func(c *gin.Context) {
		if registry == nil {
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": "agent_registry_unavailable", "message": "agent registry not configured"})
			return
		}
		token := extractBearerToken(c.GetHeader("Authorization"))
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "agent_token_required", "message": "agent token is required"})
			return
		}
		identity, ok := registry.Authenticate(token)
		if !ok || identity == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid_agent_token", "message": "invalid agent token"})
			return
		}
		c.Set(agentIdentityContextKey, *identity)
		c.Next()
	}
}

func agentListUsersHandler(source xrayconfig.ClientSource) gin.HandlerFunc {
	return func(c *gin.Context) {
		if source == nil {
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": "client_source_unavailable", "message": "client source not configured"})
			return
		}
		clients, err := source.ListClients(c.Request.Context())
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "list_clients_failed", "message": "failed to list clients"})
			return
		}
		response := agentproto.ClientListResponse{
			Clients:     clients,
			Total:       len(clients),
			GeneratedAt: time.Now().UTC(),
		}
		c.JSON(http.StatusOK, response)
	}
}

func agentReportStatusHandler(registry *agentserver.Registry, logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		value, exists := c.Get(agentIdentityContextKey)
		if !exists {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "agent_identity_missing", "message": "agent identity missing"})
			return
		}
		identity, ok := value.(agentserver.Identity)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "agent_identity_invalid", "message": "agent identity malformed"})
			return
		}
		var report agentproto.StatusReport
		if err := c.ShouldBindJSON(&report); err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid_status_payload", "message": "invalid status payload"})
			return
		}
		registry.ReportStatus(identity, report)
		if logger != nil {
			logger.Info("agent status updated", "agent", identity.ID, "healthy", report.Healthy, "clients", report.Xray.Clients)
		}
		c.Status(http.StatusNoContent)
	}
}

func extractBearerToken(header string) string {
	header = strings.TrimSpace(header)
	if header == "" {
		return ""
	}
	const prefix = "Bearer "
	if strings.HasPrefix(header, prefix) {
		header = header[len(prefix):]
	}
	return strings.TrimSpace(header)
}

var rootCmd = &cobra.Command{
	Use:   "xcontrol-account",
	Short: "Start the xcontrol account service",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load(configPath)
		if err != nil {
			return err
		}
		if logLevel != "" {
			cfg.Log.Level = logLevel
		}

		level := slog.LevelInfo
		switch strings.ToLower(strings.TrimSpace(cfg.Log.Level)) {
		case "debug":
			level = slog.LevelDebug
		case "warn", "warning":
			level = slog.LevelWarn
		case "error":
			level = slog.LevelError
		}

		logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: level}))
		slog.SetDefault(logger)

		ctx := context.Background()
		mode := strings.ToLower(strings.TrimSpace(cfg.Mode))
		if mode == "" {
			mode = "server"
		}

		switch mode {
		case "server":
			return runServer(ctx, cfg, logger)
		case "agent":
			return runAgent(ctx, cfg, logger)
		case "server-agent", "all", "combined":
			return runServerAndAgent(ctx, cfg, logger)
		default:
			return fmt.Errorf("unsupported mode %q", cfg.Mode)
		}
	},
}

func openAdminSettingsDB(cfg config.Store) (*gorm.DB, func(context.Context) error, error) {
	driver := strings.ToLower(strings.TrimSpace(cfg.Driver))
	var (
		db  *gorm.DB
		err error
	)
	switch driver {
	case "", "memory":
		db, err = gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	case "postgres", "postgresql", "pgx":
		if strings.TrimSpace(cfg.DSN) == "" {
			return nil, nil, errors.New("admin settings database requires a dsn")
		}
		db, err = gorm.Open(postgres.Open(cfg.DSN), &gorm.Config{})
	default:
		return nil, nil, fmt.Errorf("unsupported admin settings driver %q", cfg.Driver)
	}
	if err != nil {
		return nil, nil, err
	}

	if err := db.AutoMigrate(&model.AdminSetting{}); err != nil {
		return nil, nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, nil, err
	}
	if cfg.MaxOpenConns > 0 {
		sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	}
	if cfg.MaxIdleConns > 0 {
		sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	}

	cleanup := func(context.Context) error {
		return sqlDB.Close()
	}
	return db, cleanup, nil
}

func init() {
	rootCmd.Flags().StringVar(&configPath, "config", "", "path to xcontrol account configuration file")
	rootCmd.Flags().StringVar(&logLevel, "log-level", "", "log level (debug, info, warn, error)")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func isExampleDomain(host string) bool {
	normalized := strings.ToLower(strings.TrimSpace(host))
	if normalized == "" {
		return false
	}
	if h, _, ok := strings.Cut(normalized, ":"); ok {
		normalized = h
	}
	if normalized == "example.com" {
		return true
	}
	return strings.HasSuffix(normalized, ".example.com")
}

func buildCORSConfig(logger *slog.Logger, serverCfg config.Server) cors.Config {
	allowOrigins, allowAll := resolveAllowedOrigins(logger, serverCfg)

	cfg := cors.Config{
		AllowMethods: []string{
			http.MethodGet,
			http.MethodHead,
			http.MethodPost,
			http.MethodPut,
			http.MethodPatch,
			http.MethodDelete,
			http.MethodOptions,
		},
		AllowHeaders: []string{
			"Authorization",
			"Content-Type",
			"Accept",
			"Origin",
			"X-Requested-With",
			"Cookie",
		},
		ExposeHeaders: []string{
			"Content-Length",
		},
		MaxAge: 12 * time.Hour,
	}

	if allowAll {
		cfg.AllowAllOrigins = true
		cfg.AllowCredentials = false
	} else {
		cfg.AllowOrigins = allowOrigins
		cfg.AllowCredentials = true
	}

	return cfg
}

func resolveAllowedOrigins(logger *slog.Logger, serverCfg config.Server) ([]string, bool) {
	rawOrigins := serverCfg.AllowedOrigins
	seen := make(map[string]struct{}, len(rawOrigins))
	origins := make([]string, 0, len(rawOrigins))
	allowAll := false

	for _, origin := range rawOrigins {
		trimmed := strings.TrimSpace(origin)
		if trimmed == "" {
			continue
		}
		if trimmed == "*" {
			allowAll = true
			continue
		}

		normalized, err := parseOrigin(trimmed)
		if err != nil {
			logger.Warn("ignoring invalid cors origin", "origin", origin, "err", err)
			continue
		}
		if _, exists := seen[normalized]; exists {
			continue
		}
		seen[normalized] = struct{}{}
		origins = append(origins, normalized)
	}

	if allowAll {
		return nil, true
	}

	if len(origins) == 0 {
		publicURL := strings.TrimSpace(serverCfg.PublicURL)
		if publicURL != "" {
			normalized, err := parseOrigin(publicURL)
			if err != nil {
				logger.Warn("invalid server public url; falling back to defaults", "publicUrl", publicURL, "err", err)
			} else {
				origins = append(origins, normalized)
			}
		}
	}

	if len(origins) == 0 {
		origins = []string{
			"http://localhost:3001",
			"http://127.0.0.1:3001",
		}
	}

	return origins, false
}

func parseOrigin(value string) (string, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "", fmt.Errorf("origin is empty")
	}

	normalized := trimmed
	if !strings.Contains(normalized, "://") {
		normalized = "https://" + normalized
	}

	parsed, err := url.Parse(normalized)
	if err != nil {
		return "", err
	}

	scheme := strings.ToLower(strings.TrimSpace(parsed.Scheme))
	if scheme == "" {
		return "", fmt.Errorf("origin must include a scheme")
	}

	hostname := strings.ToLower(strings.TrimSpace(parsed.Hostname()))
	if hostname == "" {
		return "", fmt.Errorf("origin must include a host")
	}

	host := hostname
	if port := strings.TrimSpace(parsed.Port()); port != "" {
		host = net.JoinHostPort(hostname, port)
	}

	return scheme + "://" + host, nil
}

func deriveRedirectAddr(addr string) string {
	host, port, err := net.SplitHostPort(strings.TrimSpace(addr))
	if err != nil {
		trimmed := strings.TrimSpace(addr)
		if strings.HasPrefix(trimmed, ":") {
			port = strings.TrimPrefix(trimmed, ":")
			if port == "" || port == "443" {
				return ":80"
			}
			return ":" + port
		}
		return ":80"
	}
	if port == "" || port == "443" {
		port = "80"
	}
	return net.JoinHostPort(host, port)
}

package server

import (
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"rag-server/config"
)

// UseCORS applies a restrictive CORS policy to the provided gin engine based on the
// server configuration. When the configuration specifies explicit origins the
// middleware allows credentials and mirrors the origin. When the configuration
// uses the "*" wildcard, credentials are disabled to remain compliant with the
// Fetch specification.
func UseCORS(r *gin.Engine, logger *slog.Logger, serverCfg config.ServerCfg) {
	if r == nil {
		return
	}
	if logger == nil {
		logger = slog.Default()
	}

	corsCfg := buildCORSConfig(logger, serverCfg)
	if corsCfg.AllowAllOrigins {
		logger.Info("configured cors", "allowAllOrigins", true)
	} else {
		logger.Info("configured cors", "allowedOrigins", corsCfg.AllowOrigins)
	}
	r.Use(cors.New(corsCfg))
}

func buildCORSConfig(logger *slog.Logger, serverCfg config.ServerCfg) cors.Config {
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

func resolveAllowedOrigins(logger *slog.Logger, serverCfg config.ServerCfg) ([]string, bool) {
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
			"http://localhost:3000",
			"http://127.0.0.1:3000",
			"http://localhost:3001",
			"http://127.0.0.1:3001",
			"https://localhost:8443",
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

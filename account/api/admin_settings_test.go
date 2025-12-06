package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"account/internal/model"
	"account/internal/service"
	"account/internal/store"
)

type adminSettingsTestEnv struct {
	router        *gin.Engine
	adminToken    string
	operatorToken string
	userToken     string
}

func setupAdminSettingsTestRouter(t *testing.T) adminSettingsTestEnv {
	t.Helper()
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.AutoMigrate(&model.AdminSetting{}); err != nil {
		t.Fatalf("auto migrate: %v", err)
	}
	service.SetDB(db)
	t.Cleanup(func() {
		service.SetDB(nil)
		sqlDB, _ := db.DB()
		sqlDB.Close()
	})

	memoryStore := store.NewMemoryStore()
	ctx := context.Background()

	createUser := func(name, email, password, role string, level int) string {
		hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			t.Fatalf("hash password: %v", err)
		}
		user := &store.User{
			Name:          name,
			Email:         email,
			PasswordHash:  string(hashed),
			Role:          role,
			Level:         level,
			EmailVerified: true,
		}
		if err := memoryStore.CreateUser(ctx, user); err != nil {
			t.Fatalf("create user: %v", err)
		}
		return password
	}

	adminPassword := createUser("admin", "admin@example.com", "AdminPass123!", store.RoleAdmin, store.LevelAdmin)
	operatorPassword := createUser("operator", "operator@example.com", "OperatorPass123!", store.RoleOperator, store.LevelOperator)
	userPassword := createUser("user", "user@example.com", "UserPass123!", store.RoleUser, store.LevelUser)

	router := gin.New()
	RegisterRoutes(router, WithStore(memoryStore), WithEmailVerification(false))

	login := func(email, password string) string {
		payload := map[string]string{
			"email":    email,
			"password": password,
		}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		resp := httptest.NewRecorder()
		router.ServeHTTP(resp, req)
		if resp.Code != http.StatusOK {
			t.Fatalf("login failed for %s: %d %s", email, resp.Code, resp.Body.String())
		}
		var result struct {
			Token string `json:"token"`
		}
		if err := json.Unmarshal(resp.Body.Bytes(), &result); err != nil {
			t.Fatalf("decode login response: %v", err)
		}
		if result.Token == "" {
			t.Fatalf("expected session token for %s", email)
		}
		return result.Token
	}

	env := adminSettingsTestEnv{router: router}
	env.adminToken = login("admin@example.com", adminPassword)
	env.operatorToken = login("operator@example.com", operatorPassword)
	env.userToken = login("user@example.com", userPassword)

	return env
}

func TestAdminSettingsReadWrite(t *testing.T) {
	env := setupAdminSettingsTestRouter(t)
	router := env.router

	payload := map[string]any{
		"version": 0,
		"matrix": map[string]map[string]bool{
			"registration": {
				"admin":    true,
				"operator": false,
			},
		},
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/admin/settings", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+env.adminToken)

	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d (%s)", resp.Code, resp.Body.String())
	}

	var postResp struct {
		Version uint64                     `json:"version"`
		Matrix  map[string]map[string]bool `json:"matrix"`
	}
	if err := json.Unmarshal(resp.Body.Bytes(), &postResp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if postResp.Version != 1 {
		t.Fatalf("expected version 1, got %d", postResp.Version)
	}
	if !postResp.Matrix["registration"]["admin"] {
		t.Fatalf("expected admin flag to be true")
	}

	req = httptest.NewRequest(http.MethodGet, "/api/auth/admin/settings", nil)
	req.Header.Set("Authorization", "Bearer "+env.operatorToken)
	resp = httptest.NewRecorder()
	router.ServeHTTP(resp, req)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d (%s)", resp.Code, resp.Body.String())
	}
	var getResp struct {
		Version uint64                     `json:"version"`
		Matrix  map[string]map[string]bool `json:"matrix"`
	}
	if err := json.Unmarshal(resp.Body.Bytes(), &getResp); err != nil {
		t.Fatalf("unmarshal get response: %v", err)
	}
	if getResp.Version != postResp.Version {
		t.Fatalf("expected version %d, got %d", postResp.Version, getResp.Version)
	}
	if getResp.Matrix["registration"]["operator"] {
		t.Fatalf("expected operator flag to remain false")
	}
}

func TestAdminSettingsUnauthorized(t *testing.T) {
	env := setupAdminSettingsTestRouter(t)
	router := env.router

	req := httptest.NewRequest(http.MethodGet, "/api/auth/admin/settings", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)
	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", resp.Code)
	}

	payload := map[string]any{
		"version": 0,
		"matrix":  map[string]map[string]bool{},
	}
	body, _ := json.Marshal(payload)
	req = httptest.NewRequest(http.MethodPost, "/api/auth/admin/settings", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+env.userToken)
	resp = httptest.NewRecorder()
	router.ServeHTTP(resp, req)
	if resp.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d", resp.Code)
	}
}

func TestAdminSettingsVersionConflict(t *testing.T) {
	env := setupAdminSettingsTestRouter(t)
	router := env.router

	payload := map[string]any{
		"version": 0,
		"matrix": map[string]map[string]bool{
			"registration": {"admin": true},
		},
	}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/auth/admin/settings", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+env.adminToken)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}

	// Replay the payload with the stale version.
	req = httptest.NewRequest(http.MethodPost, "/api/auth/admin/settings", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+env.adminToken)
	resp = httptest.NewRecorder()
	router.ServeHTTP(resp, req)
	if resp.Code != http.StatusConflict {
		t.Fatalf("expected status 409, got %d", resp.Code)
	}
	var conflict struct {
		Version uint64 `json:"version"`
	}
	if err := json.Unmarshal(resp.Body.Bytes(), &conflict); err != nil {
		t.Fatalf("unmarshal conflict response: %v", err)
	}
	if conflict.Version != 1 {
		t.Fatalf("expected current version 1, got %d", conflict.Version)
	}
}

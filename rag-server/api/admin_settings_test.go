package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"rag-server/internal/model"
	"rag-server/internal/service"
)

func setupAdminSettingsTestRouter(t *testing.T) *gin.Engine {
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

	r := gin.New()
	register := RegisterRoutes(nil, "")
	register(r)
	return r
}

func TestAdminSettingsReadWrite(t *testing.T) {
	r := setupAdminSettingsTestRouter(t)

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
	req := httptest.NewRequest(http.MethodPost, "/api/admin/settings", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-Role", "admin")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	var resp struct {
		Version uint                       `json:"version"`
		Matrix  map[string]map[string]bool `json:"matrix"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if resp.Version != 1 {
		t.Fatalf("expected version 1, got %d", resp.Version)
	}
	if resp.Matrix["registration"]["admin"] != true {
		t.Fatalf("expected admin enabled")
	}

	// Read back using operator role.
	req = httptest.NewRequest(http.MethodGet, "/api/admin/settings", nil)
	req.Header.Set("X-Role", "operator")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	var getResp struct {
		Version uint                       `json:"version"`
		Matrix  map[string]map[string]bool `json:"matrix"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &getResp); err != nil {
		t.Fatalf("unmarshal get response: %v", err)
	}
	if getResp.Version != resp.Version {
		t.Fatalf("expected version %d, got %d", resp.Version, getResp.Version)
	}
	if getResp.Matrix["registration"]["operator"] {
		t.Fatalf("operator flag should be false")
	}
}

func TestAdminSettingsUnauthorized(t *testing.T) {
	r := setupAdminSettingsTestRouter(t)

	// Missing role header.
	req := httptest.NewRequest(http.MethodGet, "/api/admin/settings", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d", w.Code)
	}

	// User role is not permitted.
	payload := map[string]any{
		"version": 0,
		"matrix":  map[string]map[string]bool{},
	}
	body, _ := json.Marshal(payload)
	req = httptest.NewRequest(http.MethodPost, "/api/admin/settings", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-Role", "user")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d", w.Code)
	}
}

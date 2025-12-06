package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"rag-server/internal/rag"
	"rag-server/internal/rag/store"
)

type mockRAGService struct {
	dim  int
	docs []store.DocRow
}

func (m *mockRAGService) Upsert(ctx context.Context, rows []store.DocRow) (int, error) {
	for _, r := range rows {
		if len(r.Embedding) != m.dim {
			return 0, fmt.Errorf("embedding dimension %d != %d", len(r.Embedding), m.dim)
		}
		m.docs = append(m.docs, r)
	}
	return len(rows), nil
}

func (m *mockRAGService) Query(ctx context.Context, question string, limit int) ([]rag.Document, error) {
	docs := make([]rag.Document, len(m.docs))
	for i, d := range m.docs {
		docs[i] = rag.Document{
			Repo:     d.Repo,
			Path:     d.Path,
			ChunkID:  d.ChunkID,
			Content:  d.Content,
			Metadata: d.Metadata,
		}
	}
	if limit < len(docs) {
		docs = docs[:limit]
	}
	return docs, nil
}

// TestRAGUpsertAndQuery verifies that a 1024-dimensional vector can be stored
// and retrieved through the RAG API.
func TestRAGUpsertAndQuery(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	register := RegisterRoutes(nil, "")

	old := ragSvc
	mock := &mockRAGService{dim: 1024}
	ragSvc = mock
	defer func() { ragSvc = old }()

	register(r)

	vec := make([]float32, 1024)
	for i := range vec {
		vec[i] = float32(i)
	}
	doc := store.DocRow{Repo: "repo", Path: "file", ChunkID: 1, Content: "hello", Embedding: vec}
	body, _ := json.Marshal(map[string]any{"docs": []store.DocRow{doc}})
	req := httptest.NewRequest(http.MethodPost, "/api/rag/upsert", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	var resp map[string]int
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if resp["rows"] != 1 {
		t.Fatalf("expected rows 1, got %d", resp["rows"])
	}

	qbody, _ := json.Marshal(map[string]string{"question": "q"})
	req = httptest.NewRequest(http.MethodPost, "/api/rag/query", bytes.NewReader(qbody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	var qresp struct {
		Chunks []rag.Document `json:"chunks"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &qresp); err != nil {
		t.Fatalf("unmarshal query response: %v", err)
	}
	if len(qresp.Chunks) != 1 || qresp.Chunks[0].Content != "hello" {
		t.Fatalf("unexpected chunks: %+v", qresp.Chunks)
	}
}

// TestRAGUpsert_DimensionMismatch ensures upsert fails when dimensions do not match.
func TestRAGUpsert_DimensionMismatch(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	register := RegisterRoutes(nil, "")

	old := ragSvc
	ragSvc = &mockRAGService{dim: 1024}
	defer func() { ragSvc = old }()

	register(r)

	vec := []float32{1, 2, 3} // wrong dimension
	doc := store.DocRow{Repo: "repo", Path: "file", ChunkID: 1, Content: "bad", Embedding: vec}
	body, _ := json.Marshal(map[string]any{"docs": []store.DocRow{doc}})
	req := httptest.NewRequest(http.MethodPost, "/api/rag/upsert", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected status 503, got %d", w.Code)
	}
}

package api

import (
	"context"
	"errors"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"

	"rag-server/internal/rag"
	rconfig "rag-server/internal/rag/config"
	ragembed "rag-server/internal/rag/embed"
	"rag-server/internal/rag/store"
	"rag-server/proxy"
)

// ragService defines methods used by the RAG API. It allows tests to supply a
// mock implementation without touching the real vector database or embedding
// service.
type ragService interface {
	Upsert(ctx context.Context, rows []store.DocRow) (int, error)
	Query(ctx context.Context, question string, limit int) ([]rag.Document, error)
}

// ragSvc handles RAG document storage and retrieval. It is initialized lazily
// on demand. ragMu guards concurrent initialization attempts.
var (
	ragSvc ragService
	ragMu  sync.Mutex
)

// initRAG attempts to construct a RAG service from server configuration.
func initRAG() ragService {
	cfg, err := rconfig.LoadServer()
	if err != nil {
		return nil
	}
	proxy.Set(cfg.Proxy)
	return rag.New(cfg.ToConfig())
}

// getRAG returns an initialized ragService, creating it if necessary.
func getRAG() ragService {
	ragMu.Lock()
	defer ragMu.Unlock()
	if ragSvc == nil {
		ragSvc = initRAG()
	}
	return ragSvc
}

// registerRAGRoutes wires the /api/rag upsert and query endpoints.
func registerRAGRoutes(r *gin.RouterGroup) {
	r.POST("/rag/upsert", func(c *gin.Context) {
		svc := getRAG()
		if svc == nil {
			c.JSON(http.StatusOK, gin.H{"rows": 0})
			return
		}
		var req struct {
			Docs []store.DocRow `json:"docs"`
		}
		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		n, err := svc.Upsert(c.Request.Context(), req.Docs)
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"rows": 0, "error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"rows": n})
	})

	r.POST("/rag/query", func(c *gin.Context) {
		var req struct {
			Question string `json:"question"`
		}
		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		svc := getRAG()
		if svc == nil {
			c.JSON(http.StatusOK, gin.H{"chunks": nil})
			return
		}
		docs, err := svc.Query(c.Request.Context(), req.Question, 5)
		if err != nil {
			var httpErr *ragembed.HTTPError
			if errors.As(err, &httpErr) {
				c.JSON(httpErr.Code, gin.H{"error": httpErr.Error()})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
			return
		}
		c.JSON(http.StatusOK, gin.H{"chunks": docs})
	})
}

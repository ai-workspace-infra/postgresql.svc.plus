package api

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"rag-server"
)

// RegisterRoutes returns a server.Registrar that registers all API routes.
// It wires user, node, and knowledge base handlers under /api.
func RegisterRoutes(conn *pgx.Conn, repoProxy string) server.Registrar {
	return func(r *gin.Engine) {
		api := r.Group("/api")
		registerUserRoutes(api)
		registerNodeRoutes(api)
		registerKnowledgeRoutes(api, conn, repoProxy)
		registerRAGRoutes(api)
		registerAskAIRoutes(api)
		registerAdminSettingRoutes(api)
	}
}

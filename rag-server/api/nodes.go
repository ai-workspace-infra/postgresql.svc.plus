package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"rag-server/internal/service"
)

// registerNodeRoutes sets up node related endpoints.
func registerNodeRoutes(r *gin.RouterGroup) {
	r.GET("/nodes", getNodes)
}

func getNodes(c *gin.Context) {
	nodes, err := service.ListNodes(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, nodes)
}

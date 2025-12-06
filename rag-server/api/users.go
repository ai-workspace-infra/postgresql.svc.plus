package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"rag-server/internal/service"
)

// registerUserRoutes sets up user related endpoints.
func registerUserRoutes(r *gin.RouterGroup) {
	r.GET("/users", getUsers)
}

func getUsers(c *gin.Context) {
	users, err := service.ListUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

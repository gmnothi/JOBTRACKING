package main

import (
	"net/http"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func StartWebServer() {
	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Vite's default port
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
	}))

	r.LoadHTMLGlob("templates/*")

	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{})
	})

	r.GET("/api/jobs", func(c *gin.Context) {
		jobs := GetAllJobs()
		c.JSON(http.StatusOK, jobs)
	})

	r.DELETE("/api/jobs/:id", func(c *gin.Context) {
		id := c.Param("id")
		err := DeleteJob(id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Job deleted successfully"})
	})

	// Serve React frontend (built with Vite) under /app/*
	r.Static("/app", "./frontend/dist") // Make sure this path is correct

	// Serve index.html for any unknown frontend route (e.g. /app/dashboard)
	r.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/app") {
			c.File("./frontend/dist/index.html")
		} else {
			c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		}
	})

	r.Run(":8080")
}

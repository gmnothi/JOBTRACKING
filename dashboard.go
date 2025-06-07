package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func StartWebServer() {
	r := gin.Default()
	r.LoadHTMLGlob("templates/*")

	r.GET("/", func(c *gin.Context) {
		jobs := GetAllJobs()
		c.HTML(http.StatusOK, "index.html", gin.H{
			"Jobs": jobs,
		})
	})

	r.Run(":8080")
}

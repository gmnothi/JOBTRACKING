package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/robfig/cron/v3"
)

func init() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("❌ Error loading .env file")
	}
	log.Println("📛 GMAIL_PASS =", os.Getenv("GMAIL_PASS"))
	// Optional: log what's loaded
	log.Println("📛 GMAIL_USER =", os.Getenv("GMAIL_USER"))
}

func main() {
	InitDB()
	CheckInbox()

	c := cron.New()
	c.AddFunc("@every 5s", CheckInbox)
	c.Start()

	StartWebServer()
}

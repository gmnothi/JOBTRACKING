package main

import (
	"github.com/robfig/cron/v3"
)

func main() {
	InitDB()
	CheckInbox()

	c := cron.New()
	c.AddFunc("@every 5s", CheckInbox)
	c.Start()

	StartWebServer()
}

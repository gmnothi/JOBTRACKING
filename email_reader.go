package main

import (
	"log"
	"os"
	"strings"

	"github.com/emersion/go-imap"
	"github.com/emersion/go-imap/client"
	imapmail "github.com/emersion/go-message/mail"
)

func CheckInbox() {
	log.Println("📬 Connecting to Gmail IMAP...")

	email := os.Getenv("GMAIL_USER")
	password := os.Getenv("GMAIL_PASS")

	c, err := client.DialTLS("imap.gmail.com:993", nil)
	if err != nil {
		log.Println("❌ IMAP dial error:", err)
		return
	}
	defer c.Logout()

	if err := c.Login(email, password); err != nil {
		log.Println("❌ Login failed:", err)
		return
	}

	mbox, err := c.Select("INBOX", false)
	if err != nil {
		log.Println("❌ Unable to select inbox:", err)
		return
	}

	if mbox.Messages == 0 {
		log.Println("📭 No messages found.")
		return
	}

	seqSet := new(imap.SeqSet)
	seqSet.AddRange(mbox.Messages-10, mbox.Messages) // last 10 messages

	section := &imap.BodySectionName{}
	messages := make(chan *imap.Message, 10)
	err = c.Fetch(seqSet, []imap.FetchItem{section.FetchItem()}, messages)
	if err != nil {
		log.Println("❌ Fetch failed:", err)
		return
	}

	for msg := range messages {
		if msg == nil {
			continue
		}
		r := msg.GetBody(section)
		if r == nil {
			continue
		}
		mr, err := imapmail.CreateReader(r)
		if err != nil {
			log.Println("❌ Could not parse message:", err)
			continue
		}

		header := mr.Header
		subject, _ := header.Subject()
		from, _ := header.AddressList("From")
		log.Println("📩", subject, "| From:", from[0].Address)

		if isJobRelated(subject) {
			job := Job{
				Company: "Unknown",
				Title:   subject,
				Status:  "Applied",
				EmailID: msg.Envelope.MessageId,
				Date:    msg.Envelope.Date.Format("2006-01-02"),
			}
			SaveJob(job)
		}
	}
}

func isJobRelated(subject string) bool {
	subject = strings.ToLower(subject)
	return strings.Contains(subject, "applied") ||
		strings.Contains(subject, "thank you") ||
		strings.Contains(subject, "application received") ||
		strings.Contains(subject, "we regret")
}

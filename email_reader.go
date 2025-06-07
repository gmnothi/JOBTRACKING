package main

import (
	"crypto/tls"
	"log"
	"net"
	"os"
	"strings"
	"time"

	"github.com/emersion/go-imap"
	"github.com/emersion/go-imap/client"
	imapmail "github.com/emersion/go-message/mail"
)

func CheckInbox() {
	log.Println("📬 Connecting to Gmail IMAP...")

	email := os.Getenv("GMAIL_USER")
	password := os.Getenv("GMAIL_PASS")

	// Dial with timeout
	dialer := &net.Dialer{Timeout: 5 * time.Second}
	conn, err := tls.DialWithDialer(dialer, "tcp", "imap.gmail.com:993", &tls.Config{})
	if err != nil {
		log.Println("❌ IMAP dial timeout/error:", err)
		return
	}
	log.Println("✅ Connected, creating IMAP client...")

	c, err := client.New(conn)
	if err != nil {
		log.Println("❌ IMAP client creation failed:", err)
		return
	}
	defer c.Logout()

	log.Println("🔑 Attempting login with:", email)
	err = c.Login(email, password)
	if err != nil {
		log.Println("❌ Login failed:", err)
		return
	}
	log.Println("🔑 Login successful!")

	mbox, err := c.Select("INBOX", false)
	if err != nil {
		log.Println("❌ Unable to select inbox:", err)
		return
	}
	log.Println("📥 Inbox selected with", mbox.Messages, "messages.")

	if mbox.Messages == 0 {
		log.Println("📭 No messages found.")
		return
	}

	seqSet := new(imap.SeqSet)
	from := uint32(1)
	if mbox.Messages > 10 {
		from = mbox.Messages - 10
	}
	seqSet.AddRange(from, mbox.Messages)

	section := &imap.BodySectionName{}
	messages := make(chan *imap.Message, 10)

	go func() {
		if err := c.Fetch(seqSet, []imap.FetchItem{section.FetchItem()}, messages); err != nil {
			log.Println("❌ Fetch failed:", err)
		}
	}()

	for msg := range messages {
		if msg == nil {
			log.Println("⚠️ Received nil message, skipping")
			continue
		}
		r := msg.GetBody(section)
		if r == nil {
			log.Println("⚠️ No body in message, skipping")
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

	log.Println("✅ Done processing recent messages.")
}

func isJobRelated(subject string) bool {
	subject = strings.ToLower(subject)
	return strings.Contains(subject, "applied") ||
		strings.Contains(subject, "thank you") ||
		strings.Contains(subject, "application received") ||
		strings.Contains(subject, "we regret")
}

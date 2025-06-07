package main

import (
	"crypto/tls"
	"io"
	"log"
	"net"
	"os"
	"strings"
	"time"

	"github.com/emersion/go-imap"
	"github.com/emersion/go-imap/client"
	"github.com/emersion/go-message"
	imapmail "github.com/emersion/go-message/mail"
	"golang.org/x/net/html/charset"
)

func init() {
	// Correct: setting the global CharsetReader
	message.CharsetReader = func(charsetStr string, input io.Reader) (io.Reader, error) {
		return charset.NewReaderLabel(charsetStr, input)
	}
}

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

	const fetchCount = 1000

	from := uint32(1)
	if mbox.Messages > fetchCount {
		from = mbox.Messages - fetchCount + 1
	}
	seqSet.AddRange(from, mbox.Messages)

	section := &imap.BodySectionName{}
	messages := make(chan *imap.Message, fetchCount)

	var emailCount = 0

	go func() {
		if err := c.Fetch(seqSet, []imap.FetchItem{
			section.FetchItem(),
			imap.FetchEnvelope,
		}, messages); err != nil {
			log.Println("❌ Fetch failed:", err)
		}
		close(messages) // ✅ close only here, inside the goroutine
	}()

	for msg := range messages {
		emailCount += 1
		if msg == nil {
			log.Println("⚠️ Received nil message, skipping")
			continue
		}
		if msg.Envelope == nil {
			log.Println("⚠️ Skipping message with nil envelope")
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

		fromAddress := "unknown"
		if len(from) > 0 && from[0] != nil {
			fromAddress = from[0].Address
		}

		log.Println("📩", subject, "| From:", fromAddress)
		log.Println(emailCount)

		if isJobRelated(subject) && isCareerDomain(fromAddress) {
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

func isCareerDomain(address string) bool {
	domains := []string{
		"linkedin.com",
		"indeed.com",
		"workdaymail.com",
		"jobs.noreply@",
		"myworkdayjobs.com",
		"glassdoor.com",
		"jobvite.com",
		"lever.co",
		"greenhouse.io",
		"careers@", // generic
	}

	address = strings.ToLower(address)
	for _, domain := range domains {
		if strings.Contains(address, domain) {
			return true
		}
	}
	return false
}

func isJobRelated(subject string) bool {
	subject = strings.ToLower(subject)
	return strings.Contains(subject, "applied") ||
		strings.Contains(subject, "thank you") ||
		strings.Contains(subject, "application received") ||
		strings.Contains(subject, "we regret")
}

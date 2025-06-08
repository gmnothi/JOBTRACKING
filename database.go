package main

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

func InitDB() {
	var err error
	db, err = sql.Open("sqlite3", "./jobs.db")
	if err != nil {
		log.Fatal(err)
	}

	createTable := `
	CREATE TABLE IF NOT EXISTS jobs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		company TEXT,
		title TEXT,
		status TEXT,
		email_id TEXT UNIQUE,
		date TEXT
	);`
	_, err = db.Exec(createTable)
	if err != nil {
		log.Fatal(err)
	}
}

func SaveJob(job Job) {
	stmt, _ := db.Prepare("INSERT OR IGNORE INTO jobs(company, title, status, email_id, date) VALUES (?, ?, ?, ?, ?)")
	_, err := stmt.Exec(job.Company, job.Title, job.Status, job.EmailID, job.Date)
	if err != nil {
		log.Println("Failed to insert job:", err)
	}
}

func GetAllJobs() []Job {
	rows, _ := db.Query("SELECT id, company, title, status, email_id, date FROM jobs")
	defer rows.Close()

	var jobs []Job
	for rows.Next() {
		var job Job
		rows.Scan(&job.ID, &job.Company, &job.Title, &job.Status, &job.EmailID, &job.Date)
		jobs = append(jobs, job)
	}
	return jobs
}

func ClearJobs() {
	db, err := sql.Open("sqlite3", "./jobs.db")
	if err != nil {
		log.Println("❌ Failed to open DB:", err)
		return
	}
	defer db.Close()

	_, err = db.Exec("DELETE FROM jobs")
	if err != nil {
		log.Println("❌ Failed to clear jobs table:", err)
	} else {
		log.Println("🧹 Cleared old jobs from DB")
	}
}

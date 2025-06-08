package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"regexp"

	"github.com/sashabaranov/go-openai"
)

func ExtractJobDetails(subject, body string) (string, string, error) {
	client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))
	ctx := context.Background()

	prompt := "Extract the company and job title from this job application email. Return only valid JSON like:\n{\"company\": \"...\", \"title\": \"...\"}\n\n"
	prompt += "Subject: " + subject + "\n\n"
	prompt += "Body: " + body

	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
	})
	if err != nil {
		return "", "", err
	}

	content := resp.Choices[0].Message.Content

	// Extract JSON from the response
	re := regexp.MustCompile(`\{.*?\}`)
	jsonStr := re.FindString(content)
	if jsonStr == "" {
		return "", "", errors.New("no JSON found in OpenAI response")
	}

	var result struct {
		Company string `json:"company"`
		Title   string `json:"title"`
	}
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return "", "", err
	}

	return result.Company, result.Title, nil
}

func TestOpenAI() {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		fmt.Println("❌ OPENAI_API_KEY not set")
		return
	}

	client := openai.NewClient(apiKey)
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT3Dot5Turbo, // or openai.GPT3Dot5Turbo
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    "user",
					Content: "Say hello!",
				},
			},
		},
	)

	if err != nil {
		fmt.Printf("❌ OpenAI API error: %v\n", err)
		return
	}

	fmt.Println("✅ OpenAI response:", resp.Choices[0].Message.Content)
}

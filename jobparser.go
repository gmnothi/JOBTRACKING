package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/sashabaranov/go-openai"
)

func ExtractJobDetails(subject, body string) (string, string, error) {
	client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))
	ctx := context.Background()

	prompt := `Extract the company and job title from this job application email. 
Return ONLY a JSON object in this exact format, with no additional text:
{
    "company": "Company Name",
    "title": "Job Title"
}

Email Subject: ` + subject + `

Email Body: ` + body

	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT3Dot5Turbo,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: "You are a job application parser. Extract company and job title information and return it in JSON format only.",
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		Temperature: 0.1, // Lower temperature for more consistent output
	})
	if err != nil {
		return "", "", fmt.Errorf("OpenAI API error: %v", err)
	}

	content := resp.Choices[0].Message.Content

	// Clean the response to ensure it's valid JSON
	content = strings.TrimSpace(content)
	
	// Try to find JSON object in the response
	jsonStart := strings.Index(content, "{")
	jsonEnd := strings.LastIndex(content, "}")
	
	if jsonStart == -1 || jsonEnd == -1 {
		return "", "", errors.New("no JSON found in OpenAI response")
	}
	
	jsonStr := content[jsonStart:jsonEnd+1]

	var result struct {
		Company string `json:"company"`
		Title   string `json:"title"`
	}
	
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return "", "", fmt.Errorf("failed to parse JSON: %v", err)
	}

	// Validate the extracted data
	if result.Company == "" || result.Title == "" {
		return "", "", errors.New("missing company or title in extracted data")
	}

	return result.Company, result.Title, nil
}

func TestOpenAI() {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		fmt.Println("OPENAI_API_KEY not set")
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
		fmt.Printf("OpenAI API error: %v\n", err)
		return
	}

	fmt.Println("OpenAI response:", resp.Choices[0].Message.Content)
}

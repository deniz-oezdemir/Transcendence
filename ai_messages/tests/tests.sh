#!/bin/bash

# Colors for output
BLUE='\033[0;34m'
NC='\033[0m'

# Base URL
API_URL="http://localhost:8003/generate/"

# Helper function to test endpoint
test_message() {
	local test_name=$1
	local payload=$2
	local iterations=10
	echo -e "\n${BLUE}Testing: ${test_name}${NC}"

	for ((i=1; i<=iterations; i++)); do
		response=$(curl -s -X POST $API_URL \
			-H "Content-Type: application/json" \
			-d "$payload")

		echo "Message $i: $(echo $response | jq -r '.message')"
	done
}

# Run all tests
test_message "Game Start" '{
	"type": "game_start"
}'

test_message "Opponent Scoring" '{
	"type": "opponent_scored"
}'

test_message "AI Scoring" '{
	"type": "ai_scored"
}'

test_message "Game End (Victory)" '{
	"type": "game_victory",
	"result": "victory"
}'

test_message "Game End (Defeat)" '{
	"type": "game_defeat",
	"result": "defeat"
}'

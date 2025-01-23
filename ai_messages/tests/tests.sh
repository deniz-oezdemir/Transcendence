#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Base URL
API_URL="http://localhost:8000/generate/"

# Helper function to test endpoint
test_message() {
    local test_name=$1
    local payload=$2

    echo -e "\n${BLUE}Testing: ${test_name}${NC}"
    echo "Payload: $payload"
    echo -e "\nResponse:"

    response=$(curl -s -X POST $API_URL \
        -H "Content-Type: application/json" \
        -d "$payload")

    echo $response | jq '.'
    echo -e "\n${GREEN}------------------------${NC}"
}

# Run all tests
test_message "Game Start" '{
    "type": "game_start",
    "game_context": {}
}'

test_message "Opponent Scoring" '{
    "type": "opponent_scored",
    "game_context": {
        "score": "2-1"
    }
}'

test_message "AI Scoring" '{
    "type": "ai_scored",
    "game_context": {
        "score": "3-1"
    }
}'

test_message "Game End (Victory)" '{
    "type": "game_victory",
    "game_context": {
        "score": "5-1",
        "result": "victory"
    }
}'

test_message "Game End (Defeat)" '{
    "type": "game_defeat",
    "game_context": {
        "score": "3-5",
        "result": "defeat"
    }
}'

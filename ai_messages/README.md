# AI messages services

TODO: delete sqlite

## Frontend Integration Guide
- Plan API requests in advance to account for 1-2 second response times
- Consider implementing an AI message toggle feature
- Add a Beta disclaimer for AI message service due to potential sensitive content

## Testing Guide

### Using Test Script
Run all tests using:
```bash
./tests/tests.sh
```

### Manual Testing with cURL

#### Game Events
Test different game scenarios using these cURL commands:

```bash
# Game Start
curl -X POST http://localhost:8001/generate/ \
-H "Content-Type: application/json" \
-d '{"type": "game_start"}'

# Scoring Events
curl -X POST http://localhost:8001/generate/ \
-H "Content-Type: application/json" \
-d '{"type": "opponent_scored"}'

curl -X POST http://localhost:8001/generate/ \
-H "Content-Type: application/json" \
-d '{"type": "ai_scored"}'

# Game End Events
curl -X POST http://localhost:8001/generate/ \
-H "Content-Type: application/json" \
-d '{"type": "game_end_victory"}'

curl -X POST http://localhost:8001/generate/ \
-H "Content-Type: application/json" \
-d '{"type": "game_end_defeat"}'
```

## Technical Reference
Model: [DistilGPT2 on Hugging Face](https://huggingface.co/distilbert/distilgpt2)

**Knowledge Distillation**: A compression technique where a compact model (student) is trained to reproduce the behavior of a larger model (teacher).
*Reference: Sanh et al. (2019), Bucila et al. (2006), Hinton et al. (2015)*

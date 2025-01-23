# Sources
https://huggingface.co/distilbert/distilgpt2

Knowledge Distillation: As described in Sanh et al. (2019), “knowledge distillation is a compression technique in which a compact model – the student – is trained to reproduce the behavior of a larger model – the teacher – or an ensemble of models.” Also see Bucila et al. (2006) and Hinton et al. (2015).

# Test with tests/tests.sh or below separate tests

# Test opponent scoring
curl -X POST http://localhost:8000/generate/ \
-H "Content-Type: application/json" \
-d '{
    "type": "opponent_scored",
    "game_context": {
        "score": "2-1",
        "opponent_name": "Player 2"
    }
}'

# Test AI scoring
curl -X POST http://localhost:8000/generate/ \
-H "Content-Type: application/json" \
-d '{
    "type": "ai_scored",
    "game_context": {
        "score": "3-1",
        "opponent_name": "Player 2"
    }
}'

# Test game start
curl -X POST http://localhost:8000/generate/ \
-H "Content-Type: application/json" \
-d '{
    "type": "game_start",
    "game_context": {
        "opponent_name": "Player 2"
    }
}'

# Test victory
curl -X POST http://localhost:8000/generate/ \
-H "Content-Type: application/json" \
-d '{
    "type": "game_end_victory",
    "game_context": {
        "score": "5-3",
        "opponent_name": "Player 2"
    }
}'

# Test defeat
curl -X POST http://localhost:8000/generate/ \
-H "Content-Type: application/json" \
-d '{
    "type": "game_end_defeat",
    "game_context": {
        "score": "3-5",
        "opponent_name": "Player 2"
    }
}'

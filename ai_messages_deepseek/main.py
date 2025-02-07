from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from model import ModelHandler
from enum import Enum

app = FastAPI()
model_handler = ModelHandler()


class MessageType(str, Enum):
    GAME_START = "game_start"
    OPPONENT_SCORED = "opponent_scored"
    AI_SCORED = "ai_scored"
    GAME_VICTORY = "game_victory"
    GAME_DEFEAT = "game_defeat"


class GenerateResponse(BaseModel):
    message: str
    raw_output: str


@app.get("/generate")
async def generate_message(type: MessageType = MessageType.GAME_START):
    try:
        prompt = {
            MessageType.GAME_START: (
                "Generate a 4-8 word competitive greeting as the AI opponent in Pong. "
                "Must mention either paddle, ball or match. Be confident but sporting. "
                "Example: 'Ready to test that paddle control?'"
            ),
            MessageType.OPPONENT_SCORED: (
                "As the AI opponent in Pong, your human opponent just scored. "
                "Generate a 3-6 word sporting acknowledgment. "
                "Example: 'Great shot past my paddle!'"
            ),
            MessageType.AI_SCORED: (
                "As the AI opponent in Pong, you just scored against the human player. "
                "Generate a 3-6 word playful taunt about the game. "
                "Example: 'Your paddle wasn't quick enough!'"
            ),
            MessageType.GAME_VICTORY: (
                "As the AI opponent who won this Pong match, "
                "generate a 4-8 word gracious victory message to the human player. "
                "Example: 'Your paddle skills made this challenging!'"
            ),
            MessageType.GAME_DEFEAT: (
                "As the AI opponent who lost this Pong match, "
                "generate a 3-6 word sporting acknowledgment to the human winner. "
                "Example: 'Superior paddle work! Well played!'"
            ),
        }[type]


        result = model_handler.generate_text(prompt=prompt)
        return GenerateResponse(message=result["extracted"], raw_output=result["raw"])

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi import FastAPI, WebSocket
import asyncio
import websockets
import json
from pydantic import BaseModel
from game_ai import PongAI

app = FastAPI()


class GameRequest(BaseModel):
    game_id: str
    pong_api_url: str


# Store active AI instances
active_games = {}


@app.post("/start_game")
async def start_game(game_request: GameRequest):
    """Endpoint called by matchmaking to start an AI instance for a game"""
    if game_request.game_id in active_games:
        return {"status": "AI already active for this game"}

    # Create new AI instance and start its game loop
    ai_instance = PongAI()
    game_task = asyncio.create_task(
        ai_instance.connect_and_play(game_request.game_id, game_request.pong_api_url)
    )
    active_games[game_request.game_id] = {"ai": ai_instance, "task": game_task}
    return {"status": "AI instance started"}


@app.post("/stop_game/{game_id}")
async def stop_game(game_id: str):
    """Endpoint to stop an AI instance when game is finished"""
    if game_id in active_games:
        active_games[game_id]["task"].cancel()
        del active_games[game_id]
        return {"status": "AI instance stopped"}
    return {"status": "Game not found"}


# game_ai.py
class PongAI:
    def __init__(self):
        self.last_state = None
        self.paddle_position = 0
        self.last_update_time = 0

    async def connect_and_play(self, game_id: str, pong_api_url: str):
        """Connect to game websocket and start playing"""
        ws_url = f"{pong_api_url}/ws/game/{game_id}"

        async with websockets.connect(ws_url) as websocket:
            while True:
                try:
                    # Receive game state
                    game_state = await websocket.recv()
                    game_state = json.loads(game_state)

                    # Update only once per second
                    current_time = asyncio.get_event_loop().time()
                    if current_time - self.last_update_time >= 1.0:
                        move = self.calculate_move(game_state)
                        if move:
                            await websocket.send(
                                json.dumps({"type": "move", "direction": move})
                            )
                        self.last_update_time = current_time

                except websockets.exceptions.ConnectionClosed:
                    break

    def calculate_move(self, game_state):
        """Calculate next move based on current game state"""
        # Get relevant state information
        ball_x = game_state["ball"]["x"]
        ball_y = game_state["ball"]["y"]
        ball_dx = game_state["ball"]["dx"]
        ball_dy = game_state["ball"]["dy"]
        paddle_y = game_state["ai_paddle"]["y"]

        # Predict ball position
        predicted_y = self.predict_ball_position(ball_x, ball_y, ball_dx, ball_dy)

        # Move paddle based on prediction
        if predicted_y > paddle_y + 10:
            return "DOWN"
        elif predicted_y < paddle_y - 10:
            return "UP"
        return None

    def predict_ball_position(self, ball_x, ball_y, ball_dx, ball_dy):
        """Predict where ball will intersect with AI paddle"""
        # Simple linear prediction - can be made more sophisticated
        time_to_paddle = (800 - ball_x) / ball_dx  # assuming 800px width
        predicted_y = ball_y + (ball_dy * time_to_paddle)

        # Account for bounces off top/bottom
        canvas_height = 600  # assuming 600px height
        while predicted_y < 0 or predicted_y > canvas_height:
            if predicted_y < 0:
                predicted_y = -predicted_y
            if predicted_y > canvas_height:
                predicted_y = 2 * canvas_height - predicted_y

        return predicted_y

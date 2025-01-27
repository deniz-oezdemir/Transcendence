import asyncio
import websockets
import json
import logging
from threading import Thread

logger = logging.getLogger(__name__)


class WebSocketClient:
    def __init__(self, uri, ai_player):
        self.uri = uri.replace("8000", "8002")  # Replace port 8000 with 8002
        self.ai_player = ai_player

    async def connect(self):
        async with websockets.connect(self.uri) as websocket:
            self.websocket = websocket
            await self.listen()

    async def listen(self):
        try:
            async for message in self.websocket:
                data = json.loads(message)
                logger.info(f"Received message: {data}")
                self.handle_game_update(data)
        except websockets.ConnectionClosed:
            logger.warning("Connection closed")

    def handle_game_update(self, data):
        if data.get("type") == "game_state_update":
            state = data.get("state", {})
            ball_x_position = state.get("ball_x_position")
            ball_y_position = state.get("ball_y_position")
            ball_x_direction = state.get("ball_x_direction")
            ball_y_direction = state.get("ball_y_direction")
            game_width = state.get("game_width")
            game_height = state.get("game_height")
            players = state.get("players", [])
            ai_player_position = None

            # Find the AI player's position
            for player in players:
                if player["player"] == self.ai_player.ai_player_id:
                    ai_player_position = player["player_position"]
                    break

            if (
                ai_player_position is not None
                and ball_x_position is not None
                and ball_y_position is not None
            ):
                predicted_y = self.predict_ball_y(
                    ball_x_position,
                    ball_y_position,
                    ball_x_direction,
                    ball_y_direction,
                    game_width,
                    game_height,
                )
                self.move_towards_ball(ai_player_position, predicted_y)

    def predict_ball_y(
        self,
        ball_x,
        ball_y,
        ball_x_direction,
        ball_y_direction,
        game_width,
        game_height,
    ):
        # Predict the Y position of the ball when it reaches the AI player's goal line
        while ball_x < game_width:
            ball_x += ball_x_direction
            ball_y += ball_y_direction

            # Check for collisions with the top and bottom walls
            if ball_y <= 0 or ball_y >= game_height:
                ball_y_direction = -ball_y_direction  # Reverse the Y direction

        return ball_y

    def move_towards_ball(self, ai_player_position, predicted_y):
        # Move towards the predicted Y position of the ball
        if ai_player_position < predicted_y:
            self.send_move_command(1)  # Move down
        elif ai_player_position > predicted_y:
            self.send_move_command(-1)  # Move up

    def send_move_command(self, direction):
        move_command = {
            "action": "move",
            "player_id": self.ai_player.ai_player_id,
            "direction": direction,
        }
        asyncio.run_coroutine_threadsafe(
            self.websocket.send(json.dumps(move_command)), asyncio.get_event_loop()
        )
        logger.info(f"Sent move command: {move_command}")

    def run(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self.connect())

    def start(self):
        thread = Thread(target=self.run)
        thread.start()

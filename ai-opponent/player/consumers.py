import asyncio
import time
import websockets
import json
import logging
from threading import Thread
from websockets.exceptions import ConnectionClosedError, InvalidURI, InvalidHandshake
from django.http import JsonResponse

logger = logging.getLogger(__name__)


class WebSocketConnectionError(Exception):
    def __init__(self, message):
        super().__init__(message)
        self.status_code = 450


class WebSocketClient:
    def __init__(self, uri, ai_player):
        self.uri = uri
        self.ai_player = ai_player
        self.websocket = None
        self.last_update_time = 0

    async def connect(self):
        try:
            async with websockets.connect(self.uri) as websocket:
                self.websocket = websocket
                await self.listen()
        except (
            ConnectionRefusedError,
            ConnectionClosedError,
            InvalidURI,
            InvalidHandshake,
            OSError,
        ) as e:
            logger.error(f"WebSocket connection error: {e}")
            self.connection_error = True
            raise WebSocketConnectionError(f"WebSocket connection error: {e}")

    async def listen(self):
        try:
            while True:
                message = await self.websocket.recv()
                data = json.loads(message)
                current_time = time.time()
                if current_time - self.last_update_time >= 1:
                    logger.info(f"Received message: {data}")
                    self.handle_game_update(data)
                    self.last_update_time = current_time
        except websockets.ConnectionClosed:
            logger.warning("Connection closed")
            self.delete_ai_player()

    def handle_game_update(self, data):
        if data.get("type") == "game_state_update":
            state = data.get("state", {})
            ball_x_position = state.get("ball_x_position")
            ball_y_position = state.get("ball_y_position")
            ball_x_direction = state.get("ball_x_direction")
            ball_y_direction = state.get("ball_y_direction")
            game_width = state.get("game_width")
            game_height = state.get("game_height")
            player_1_id = state.get("player_1_id")
            player_2_id = state.get("player_2_id")
            player_1_position = state.get("player_1_position")
            player_2_position = state.get("player_2_position")

            ai_player_position = None

            # Find the AI player's position
            if self.ai_player == player_1_id:
                ai_player_position = player_1_position
            elif self.ai_player == player_2_id:
                ai_player_position = player_2_position

            if (
                ai_player_position is not None
                and ball_x_position is not None
                and ball_y_position is not None
            ):
                if (self.ai_player == player_1_id and ball_x_direction < 0) or (
                    self.ai_player == player_2_id and ball_x_direction > 0
                ):
                    # Ball is moving towards the AI player
                    predicted_y = self.predict_ball_y(
                        ball_x_position,
                        ball_y_position,
                        ball_x_direction,
                        ball_y_direction,
                        game_width,
                        game_height,
                    )
                else:
                    # Ball is moving away from the AI player, move towards the center
                    predicted_y = game_height / 2

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

    def delete_ai_player(self):
        self.ai_player.delete()
        logger.info(f"AI player {self.ai_player.id} deleted from database and Redis")

    def run(self):
        self.connection_error = False
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self.connect())
        return self.connection_error

    def start(self):
        self.connection_error = False
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self.connect())
        return self.connection_error

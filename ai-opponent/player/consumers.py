import asyncio
import datetime
import socketio
import time
import math
import json
import logging
import threading
from socketio.exceptions import ConnectionError

logger = logging.getLogger(__name__)


class SocketIOConnectionError(Exception):
    def __init__(self, message):
        super().__init__(message)
        self.status_code = 450


class SocketIOClient:
    def __init__(self, uri, ai_player):
        self.uri = uri
        self.ai_player = ai_player
        self.sio = socketio.AsyncClient()
        self.last_update_time = 0
        self.move_task = None
        self.game_running = True
        self.move_step = 1
        self.predicted_ball_y = None
        self.ball_x_direction_sign = 0
        self.current_game_state = {}  # Maintain the current game state
        self.connection_lock = asyncio.Lock()  # Add a lock for connection

        # Register event handlers
        self.sio.event(self.connect)
        self.sio.event(self.disconnect)
        self.sio.on("game_state_update", self.handle_game_state_update)
        self.sio.on("connection_closed", self.handle_connection_closed)

    async def connect(self):
        async with (
            self.connection_lock
        ):  # Use the lock to synchronize connection attempts
            if self.sio.connected:
                logger.info("Already connected to Socket.IO server")
                return
            try:
                logger.info(f"Attempting to connect to {self.uri}")
                await self.sio.connect(self.uri)
                logger.info("connect: Socket.IO connection success")
            except ConnectionError as e:
                logger.error(f"Socket.IO connection error: {e}")
                self.connection_error = True
                raise SocketIOConnectionError(f"Socket.IO connection error: {e}")

    async def disconnect(self):
        if not self.sio.connected:
            logger.info("Already disconnected from Socket.IO server")
            return
        logger.info("Socket.IO disconnected")
        self.delete_ai_player()
        await self.sio.disconnect()

    async def handle_game_state_update(self, data):
        encoded_state = data.get("state", "")

        if encoded_state:
            partial_state = json.loads(encoded_state)
            self.current_game_state.update(partial_state)  # Merge partial update
            logger.debug(
                f"partial_state merge into self.current_game_state: {self.current_game_state}"
            )

        is_game_running = self.current_game_state.get("is_game_running", True)
        is_game_ended = self.current_game_state.get("is_game_ended", False)
        if not is_game_running or is_game_ended:
            self.game_running = False
        current_time = time.time()
        if current_time - self.last_update_time >= 1:  # Only once per second
            logger.debug(f"Received message: {self.current_game_state}")
            await self.handle_game_update(self.current_game_state)
            self.last_update_time = current_time

    async def handle_game_update(self, state):
        ball_x_position = state.get("ball_x_position")
        ball_y_position = state.get("ball_y_position")
        new_ball_x_direction = state.get("ball_x_direction")
        ball_y_direction = state.get("ball_y_direction")
        game_width = state.get("game_width")
        game_height = state.get("game_height")
        paddle_height = state.get("paddle_height")
        player_1_id = state.get("player_1_id")
        player_2_id = state.get("player_2_id")
        player_1_position = state.get("player_1_position")
        player_2_position = state.get("player_2_position")
        is_game_running = state.get("is_game_running", True)
        is_game_ended = state.get("is_game_ended", False)
        self.move_step = state.get("move_step")

        if self.predicted_ball_y is None:
            logger.debug(
                "handle_game_update: predicted_y is None, setting to middle of board"
            )
            self.predicted_ball_y = game_height / 2

        if not is_game_running or is_game_ended:
            logger.debug("Game has ended or is paused. Stopping AI.")
            self.game_running = False
            if self.move_task is not None:
                self.move_task.cancel()
            return
        else:
            self.game_running = True

        ai_player_position = None

        # Find the AI player's position
        if self.ai_player.ai_player_id == player_1_id:
            ai_player_position = player_1_position
        elif self.ai_player.ai_player_id == player_2_id:
            ai_player_position = player_2_position
        # Because in game engine position is top of paddle, set it to middle:
        ai_player_position += paddle_height / 2

        if ai_player_position is None:
            logger.error(
                f"ai_player_position is None. AI-Player ID: {self.ai_player.ai_player_id}. ai-opponent will not move. Player_1_id: {player_1_id}, player_2_id: {player_2_id}"
            )
            return

        if (
            ai_player_position is not None
            and ball_x_position is not None
            and ball_y_position is not None
        ):
            new_ball_x_direction_sign = 1 if new_ball_x_direction > 0 else -1
            if new_ball_x_direction_sign != self.ball_x_direction_sign:
                self.ball_x_direction_sign = new_ball_x_direction_sign
                logger.debug("Ball direction sign changed, updating prediction")
                if (
                    self.ai_player.ai_player_id == player_1_id
                    and self.ball_x_direction_sign < 0
                ) or (
                    self.ai_player.ai_player_id == player_2_id
                    and self.ball_x_direction_sign > 0
                ):
                    # Ball is moving towards the AI player
                    new_predicted_y = self.predict_ball_y(
                        ball_x_position,
                        ball_y_position,
                        new_ball_x_direction,
                        ball_y_direction,
                        game_width,
                        game_height,
                    )
                    if math.fabs(self.predicted_ball_y - new_predicted_y) > 10:
                        self.predicted_ball_y = new_predicted_y
                else:
                    # Ball is moving away from the AI player, move towards the center
                    self.predicted_ball_y = game_height / 2
                    logger.debug(
                        f"Ball is moving away, go to middle: {self.predicted_ball_y}"
                    )

                # Cancel any existing move task
                if self.move_task is not None:
                    self.move_task.cancel()

                # Start a new move task
                self.move_task = asyncio.create_task(
                    self.continuous_move(ai_player_position)
                )
        else:
            logger.error(
                f"ai-player cannot move because one of these is null:\nai_player_position: {ai_player_position}\nball_x_position: {ball_x_position}\nball_y_position: {ball_y_position}"
            )

    def predict_ball_y(
        self,
        ball_x,
        ball_y,
        ball_x_direction,
        ball_y_direction,
        game_width,
        game_height,
    ):
        logger.debug("Predicting ball Y position")
        # Predict the Y position of the ball when it reaches the AI player's goal line
        while ball_x < game_width:
            ball_x += ball_x_direction
            ball_y += ball_y_direction

            # Check for collisions with the top and bottom walls
            if ball_y <= 0 or ball_y >= game_height:
                ball_y_direction = -ball_y_direction  # Reverse the Y direction

        return ball_y

    async def continuous_move(self, ai_player_position):
        try:
            while self.game_running:
                if (
                    math.fabs(ai_player_position - self.predicted_ball_y) < 10
                ):  # TODO: remove magic number
                    break
                elif ai_player_position < self.predicted_ball_y:
                    await self.send_move_command(1)  # Move down
                    ai_player_position += self.move_step
                elif ai_player_position > self.predicted_ball_y:
                    await self.send_move_command(-1)  # Move up
                    ai_player_position -= self.move_step
                else:
                    break  # Target position reached

                # Wait for a short interval before sending the next move command
                await asyncio.sleep(0.2)
        except asyncio.CancelledError:
            pass

    async def send_move_command(self, direction):
        if not self.game_running:
            logger.debug("send move cancelled, game not running")
            return
        move_command = {
            "action": "move",
            "player_id": self.ai_player.ai_player_id,
            "direction": direction,
        }
        logger.debug("Sending move command")
        await self.sio.emit("move", move_command)
        logger.debug(f"{datetime.datetime.now()} - Sent move command")

    async def handle_connection_closed(self, data):
        logger.debug("Connection closed by server.")
        self.game_running = False
        if self.move_task is not None:
            self.move_task.cancel()
        self.delete_ai_player()
        await self.sio.disconnect()
        logger.info("Connection closed")

    def delete_ai_player(self):
        self.ai_player.delete()
        logger.info(
            f"AI player {self.ai_player.ai_player_id} deleted from database and Redis"
        )

    def run(self):
        self.connection_error = False
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self.connect())
        return self.connection_error

    def start(self):
        self.connection_error = False
        thread = threading.Thread(target=self.run)
        thread.start()
        return self.connection_error

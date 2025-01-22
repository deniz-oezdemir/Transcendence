import json
import logging
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
from django.conf import settings
from .models import GameState
from .engine.pong_game_engine import PongGameEngine

logger = logging.getLogger(__name__)


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
        self.game_group_name = f"game_{self.game_id}"

        await self.channel_layer.group_add(self.game_group_name, self.channel_name)
        await self.accept()
        logger.debug(f"WebSocket connected: {self.channel_name}")
        print(f"WebSocket connected: {self.channel_name}")
        self.periodic_task = asyncio.create_task(self.send_periodic_updates())

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.game_group_name, self.channel_name)
        logger.debug(f"WebSocket disconnected: {self.channel_name}")

        self.periodic_task.cancel()

    async def receive(self, text_data):
        logger.debug(f"Message received: {text_data}")
        text_data_json = json.loads(text_data)
        action = text_data_json["action"]

        if action == "move":
            player_id = text_data_json["player_id"]
            direction = text_data_json["direction"]
            await self.move_player(player_id, direction)

        await self.channel_layer.group_send(
            self.game_group_name, {"type": "game_update", "message": text_data_json}
        )

    async def game_update(self, event):
        message = event["message"]
        logger.debug(f"Game update: {message}")

        await self.send(text_data=json.dumps(message))

    async def game_state_update(self, event):
        state = event["state"]
        logger.debug(f"Game state update: {state}")

        await self.send(
            text_data=json.dumps({"type": "game_state_update", "state": state})
        )

    @database_sync_to_async
    def move_player(self, player_id, direction):
        game_state = self.get_game_state()
        if game_state.is_game_running:
            try:
                game_state = self.get_game_state()
                engine = PongGameEngine(game_state)
                engine.move_player(player_id, direction)
                logger.debug(f"Player {player_id} moved to direction {direction}")
                self.save_game_state(game_state)
            except Exception as e:
                logger.error(f"Unexpected error occurred while moving player: {e}")
        else:
            logger.debug("Move player exception, game not running")
            raise RuntimeError("move_player: Game not running")

    async def send_periodic_updates(self):
        try:
            while True:
                game_state = await database_sync_to_async(self.get_game_state)()
                if not game_state.is_game_running or game_state.is_game_ended:
                    logger.info(
                        f"Disconnect because is_game_running is: {game_state.is_game_running}, is_game_ended is: {game_state.is_game_ended}"
                    )
                    await self.close()
                    break

                await database_sync_to_async(self.update_game_state)()
                game_state = await database_sync_to_async(self.get_game_state)()
                game_state_data = {
                    "id": game_state.id,
                    "max_score": game_state.max_score,
                    "is_game_running": game_state.is_game_running,
                    "is_game_ended": game_state.is_game_ended,
                    "player_1_id": game_state.player_1_id,
                    "player_2_id": game_state.player_2_id,
                    "player_1_name": game_state.player_1_name,
                    "player_2_name": game_state.player_2_name,
                    "player_1_score": game_state.player_1_score,
                    "player_2_score": game_state.player_2_score,
                    "player_1_position": game_state.player_1_position,
                    "player_2_position": game_state.player_2_position,
                    "ball_x_position": game_state.ball_x_position,
                    "ball_y_position": game_state.ball_y_position,
                    "ball_x_direction": game_state.ball_x_direction,
                    "ball_y_direction": game_state.ball_y_direction,
                    "game_height": game_state.game_height,
                    "game_width": game_state.game_width,
                    "paddle_height": game_state.paddle_height,
                    "paddle_width": game_state.paddle_width,
                }
                logger.debug(f"Game state: {game_state_data}")

                await self.send(
                    text_data=json.dumps(
                        {"type": "game_state_update", "state": game_state_data}
                    )
                )
                await asyncio.sleep(1 / 60)
        except asyncio.CancelledError:
            logger.info("Periodic task cancelled")

    def update_game_state(self):
        game_state = self.get_game_state()

        if game_state.is_game_running:
            try:
                game_state = self.get_game_state()
                engine = PongGameEngine(game_state)
                engine.update_game_state()
                logger.debug("game updated on engine")
                self.save_game_state(game_state)
                logger.debug("game saved")
                return {
                    "x": game_state.ball_x_position,
                    "y": game_state.ball_y_position,
                }
            except GameState.DoesNotExist:
                return {"error": "Game not found"}
        else:
            logger.debug("update_game_state: game not running")
            RuntimeError("Game not running")

    def get_game_state(self):
        game_state = GameState.from_cache(self.game_id)
        if not game_state:
            raise GameState.DoesNotExist("Game not found in Redis.")
        return game_state

    def save_game_state(self, game_state):
        if settings.USE_REDIS:
            cache_key = f"game_state_{self.game_id}"
            game_state_data = {
                "id": game_state.id,
                "max_score": game_state.max_score,
                "is_game_running": game_state.is_game_running,
                "is_game_ended": game_state.is_game_ended,
                "player_1_id": game_state.player_1_id,
                "player_2_id": game_state.player_2_id,
                "player_1_name": game_state.player_1_name,
                "player_2_name": game_state.player_2_name,
                "player_1_position": game_state.player_1_position,
                "player_2_position": game_state.player_2_position,
                "player_1_score": game_state.player_1_score,
                "player_2_score": game_state.player_2_score,
                "ball_x_position": game_state.ball_x_position,
                "ball_y_position": game_state.ball_y_position,
                "ball_x_direction": game_state.ball_x_direction,
                "ball_y_direction": game_state.ball_y_direction,
                "game_height": game_state.game_height,
                "game_width": game_state.game_width,
                "paddle_height": game_state.paddle_height,
                "paddle_width": game_state.paddle_width,
            }
            cache.set(cache_key, json.dumps(game_state_data), timeout=None)
            logger.debug("game saved in Redis")
        else:
            game_state.save()
            logger.debug("game saved in database")

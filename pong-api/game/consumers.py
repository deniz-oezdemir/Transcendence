import json
import logging
import asyncio
import aiohttp
from django.utils import timezone
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
        self.game_start_time = timezone.now()  # Store start time

        await self.channel_layer.group_add(self.game_group_name, self.channel_name)
        self.game_state = await database_sync_to_async(self.get_game_state)()
        await self.accept()
        logger.debug(
            f"WebSocket connected: {self.channel_name}, game_state: {self.game_state}"
        )
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
        self.game_state = self.get_game_state()
        if self.game_state.is_game_running:
            try:
                engine = PongGameEngine(self.game_state)
                engine.move_player(player_id, direction)
                logger.debug(f"Player {player_id} moved to direction {direction}")
                self.save_game_state(self.game_state)
            except Exception as e:
                logger.error(f"Unexpected error occurred while moving player: {e}")
        else:
            logger.debug("Move player exception, game not running")
            raise RuntimeError("move_player: Game not running")

    async def send_periodic_updates(self):
        try:
            while True:
                if not self.game_state.is_game_running:
                    continue
                if self.game_state.is_game_ended:
                    logger.debug(
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
                await asyncio.sleep(1 / 15)
        except asyncio.CancelledError:
            logger.debug("Periodic task cancelled")

        # Check if game ended and send results
        if self.game_state and self.game_state.is_game_ended:
            winner_id = (
                self.game_state.player_1_id
                if self.game_state.player_1_score > self.game_state.player_2_score
                else self.game_state.player_2_id
            )
            logger.debug(
                f"Game ended. Winner: {winner_id}, Score: {self.game_state.player_1_score}-{self.game_state.player_2_score}"
            )
            asyncio.create_task(
                self.send_game_result_to_matchmaking(
                    winner_id=winner_id,
                    player1_score=self.game_state.player_1_score,
                    player2_score=self.game_state.player_2_score,
                )
            )
            logger.debug("Created task to send game results to matchmaking service")

    def update_game_state(self):
        logger.debug(f"consumers update_game_state init with state: {self.game_state}")

        if self.game_state.is_game_running:
            try:
                game_state = self.get_game_state()
                engine = PongGameEngine(game_state)
                engine.update_game_state()
                logger.debug("game updated on engine")
                self.save_game_state(game_state)
                logger.debug("game saved")

            except GameState.DoesNotExist:
                return {"error": "Game not found"}
        else:
            logger.debug("update_game_state: game not running")
            RuntimeError("Game not running")

    async def send_game_result_to_matchmaking(
        self, winner_id, player1_score, player2_score
    ):
        """Sends game result to matchmaking service when game ends"""
        logger.debug(f"Preparing to send game result for game {self.game_id}")
        matchmaking_url = f"http://matchmaking:8000/api/match/{self.game_id}/result/"
        logger.debug(f"Matchmaking URL: {matchmaking_url}")

        game_result = {
            "winner_id": winner_id,
            "player1_score": player1_score,
            "player2_score": player2_score,
            "start_time": self.game_start_time.isoformat(),
            "end_time": timezone.now().isoformat(),
        }
        logger.debug(f"Game result data: {game_result}")

        try:
            logger.debug("Initiating HTTP request to matchmaking service")
            async with aiohttp.ClientSession() as session:
                async with session.post(matchmaking_url, json=game_result) as response:
                    response_text = await response.text()
                    logger.debug(f"Matchmaking response: {response_text}")
                    if response.status == 200:
                        logger.debug(
                            f"Game {self.game_id} result successfully sent to matchmaking. Response: {response_text}"
                        )
                    else:
                        logger.error(
                            f"Failed to send game result. Status: {response.status}, Error: {response_text}"
                        )
        except Exception as e:
            logger.error(
                f"Error sending game result to matchmaking: {str(e)}", exc_info=True
            )

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

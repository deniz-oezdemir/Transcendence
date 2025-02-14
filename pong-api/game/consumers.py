import json
import logging
import asyncio
from asyncio import Lock
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
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.lock = Lock()
        self.last_move_time = None
        self.move_debounce_interval = 0.05  # 50 milliseconds debounce interval

    async def connect(self):
        self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
        self.game_group_name = f"game_{self.game_id}"
        self.game_start_time = timezone.now()  # Store start time

        await self.channel_layer.group_add(self.game_group_name, self.channel_name)
        logger.info(
            f"Connection added to group: {self.game_group_name} and channel: {self.channel_name}"
        )
        self.game_state = self.get_game_state()
        await self.accept()
        logger.info(
            f"WebSocket connected: {self.channel_name}, game_state: {self.game_state}"
        )

        # Increment the connected clients counter
        connected_clients = cache.get(f"{self.game_id}_connected_clients", 0) + 1
        cache.set(f"{self.game_id}_connected_clients", connected_clients)
        logger.info(f"Connected clients for game {self.game_id}: {connected_clients}")

        # Start the periodic task only if not already running
        if not cache.get(f"{self.game_id}_periodic_task_running"):
            self.periodic_task = asyncio.create_task(self.send_periodic_updates())
            cache.set(f"{self.game_id}_periodic_task_running", True)
            logger.info("Started periodic task for game updates")

        self.send_updates = (
            self.game_state.is_game_running
        )  # set to False after first is_game_running False or
        # is_game_ended True

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.game_group_name, self.channel_name)
        logger.debug(f"WebSocket disconnected: {self.channel_name}")

        # Decrement the connected clients counter
        connected_clients = cache.get(f"{self.game_id}_connected_clients", 0) - 1
        cache.set(f"{self.game_id}_connected_clients", connected_clients)
        logger.info(f"Connected clients for game {self.game_id}: {connected_clients}")

        # Cancel the periodic task if this instance is running it and connected clients are less than 1
        if connected_clients == 0 and cache.get(f"{self.game_id}_periodic_task_running"):
            if hasattr(self, 'periodic_task'):
                self.periodic_task.cancel()
                cache.set(f"{self.game_id}_periodic_task_running", False)
                logger.info("Cancelled periodic task for game updates")

    async def receive(self, text_data):
        logger.debug(f"Message received: {text_data}")
        text_data_json = json.loads(text_data)
        action = text_data_json["action"]

        if action == "move":
            player_id = text_data_json["player_id"]
            direction = text_data_json["direction"]
            logger.debug(
                f"Move action received: player_id={player_id}, direction={direction}"
            )
            await self.move_player(player_id, direction)

        if action == "toggle":
            await self.toggle_game()

    async def game_state_update(self, event):
        logger.debug(f"game_state_update: event: {event}")
        game_state_data = event["state"]
        for key, value in game_state_data.items():
            setattr(self.game_state, key, value)

        await self.send(
            text_data=json.dumps(
                {"type": "game_state_update", "state": game_state_data}
            ),
        )

    async def move_player(self, player_id, direction):
        async with self.lock:
            current_time = asyncio.get_event_loop().time()
            if self.last_move_time is None or (current_time - self.last_move_time) >= self.move_debounce_interval:
                self.last_move_time = current_time
                try:
                    logger.debug("move player is game running ok")
                    engine = PongGameEngine(self.game_state)
                    self.game_state = engine.move_player(player_id, direction)
                    logger.debug(f"Player {player_id} moved to direction {direction}")

                    if not self.game_state.is_game_ended:
                        logger.debug("move_player: game saved")
                        await self.send_game_state()  # Ensure immediate feedback
                        logger.debug(f"move_player: game sent: {self.game_state}")
                except Exception as e:
                    logger.error(f"Unexpected error occurred while moving player: {e}")

    async def toggle_game(self):
        try:
            # self.game_state = self.get_game_state()
            self.game_state.is_game_running = not self.game_state.is_game_running
            await self.save_game_state()
            logger.info(
                f"Toggled game state for game_id {self.game_id}. New state: {self.game_state.is_game_running}"
            )
            await self.send_game_state()
            logger.debug("toggle_game: game sent")
        except Exception as e:
            logger.error(f"Unexpected error occurred while toggling game: {e}")

    async def send_periodic_updates(self):
        # self.game_state = self.get_game_state()
        try:
            while True:
                if self.game_state.is_game_ended:
                    logger.debug(
                        f"Disconnect because is_game_running is: {self.game_state.is_game_running}, is_game_ended is: {self.game_state.is_game_ended}"
                    )
                    self.game_state.is_game_running = False
                    self.send_updates = False
                    await self.close()
                    break

                await self.update_game_state()
                async with self.lock:
                    await self.send_game_state()
                    logger.debug("send_periodic_updates: game sent")
                await asyncio.sleep(1 / 20)
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

    # Update AND save game_state
    async def update_game_state(self):
        logger.debug(f"consumers update_game_state init with state: {self.game_state}")

        if self.game_state.is_game_running:
            try:
                engine = PongGameEngine(self.game_state)
                self.game_state = engine.update_game_state()
                logger.debug("game updated on engine")

                # TODO: check save only if game ended if there is lag
                # await self.save_game_state()
import msgpack
import json
from django.db import models
from django.conf import settings
from django.core.cache import cache
from .managers import GameStateManager
import logging

logger = logging.getLogger(__name__)

class GameState(models.Model):
    # Game configuration
    max_score = models.PositiveIntegerField(default=3)
    is_game_running = models.BooleanField(default=False)
    is_game_ended = models.BooleanField(default=False)
    game_height = models.IntegerField(default=400)
    game_width = models.IntegerField(default=600)
    paddle_height = models.IntegerField(default=80)
    paddle_width = models.IntegerField(default=15)
    paddle_offset = models.IntegerField(default=20)
    move_step = models.IntegerField(default=10)

    # Players
    player_1_id = models.IntegerField(null=True, blank=True)
    player_2_id = models.IntegerField(null=True, blank=True)
    player_1_name = models.CharField(max_length=100, default="Player 1")
    player_2_name = models.CharField(max_length=100, default="Player 2")
    player_1_score = models.IntegerField(default=0)
    player_2_score = models.IntegerField(default=0)
    player_1_position = models.FloatField(default=160)
    player_2_position = models.FloatField(default=160)

    # Ball state
    ball_radius = models.IntegerField(default=10)
    ball_x_position = models.FloatField(default=290)
    ball_y_position = models.FloatField(default=190)
    ball_x_direction = models.FloatField(default=3)
    ball_y_direction = models.FloatField(default=3)
    ball_speed = models.FloatField(default=12)

    objects = GameStateManager()

    def save(self, *args, **kwargs):
        if not self.id:
            logger.warning("Attempting to save model with no id!")
        cache_key = f"{self.id}"
        game_state_data = {
            "id": self.id,
            "max_score": self.max_score,
            "is_game_running": self.is_game_running,
            "is_game_ended": self.is_game_ended,
            "player_1_id": self.player_1_id,
            "player_2_id": self.player_2_id,
            "player_1_name": self.player_1_name,
            "player_2_name": self.player_2_name,
            "player_1_score": self.player_1_score,
            "player_2_score": self.player_2_score,
            "player_1_position": self.player_1_position,
            "player_2_position": self.player_2_position,
            "ball_x_position": self.ball_x_position,
            "ball_y_position": self.ball_y_position,
            "ball_speed": self.ball_speed,
            "ball_x_direction": self.ball_x_direction,
            "ball_y_direction": self.ball_y_direction,
            "ball_radius": self.ball_radius,
            "game_height": self.game_height,
            "game_width": self.game_width,
            "paddle_height": self.paddle_height,
            "paddle_width": self.paddle_width,
            "paddle_offset": self.paddle_offset,
            "move_step": self.move_step,
        }
        packed_data = msgpack.packb(game_state_data)
        cache.set(cache_key, packed_data, timeout=None)
        logger.info(f"Saved game state to cache with key {cache_key}")

    def delete(self, *args, **kwargs):
        if settings.USE_REDIS:
            cache_key = f"{self.id}"
            cache.delete(cache_key)
            logger.info(f"Deleted game state from cache with key {cache_key}")

    @classmethod
    def from_cache(cls, game_id):
        cache_key = f"{game_id}"
        packed_data = cache.get(cache_key)
        if packed_data:
            game_state_data = msgpack.unpackb(packed_data, raw=False)
            return cls(**game_state_data)
        return None

    def __str__(self) -> str:
        return (
            "game_state_data = {\n"
            f'    "id": {self.id},\n'
            f'    "max_score": {self.max_score},\n'
            f'    "is_game_running": {self.is_game_running},\n'
            f'    "is_game_ended": {self.is_game_ended},\n'
            f'    "player_1_id": {self.player_1_id},\n'
            f'    "player_2_id": {self.player_2_id},\n'
            f'    "player_1_name": {self.player_1_name},\n'
            f'    "player_2_name": {self.player_2_name},\n'
            f'    "player_1_score": {self.player_1_score},\n'
            f'    "player_2_score": {self.player_2_score},\n'
            f'    "player_1_position": {self.player_1_position},\n'
            f'    "player_2_position": {self.player_2_position},\n'
            f'    "ball_x_position": {self.ball_x_position},\n'
            f'    "ball_y_position": {self.ball_y_position},\n'
            f'    "ball_speed": {self.ball_speed},\n'
            f'    "ball_x_direction": {self.ball_x_direction},\n'
            f'    "ball_y_direction": {self.ball_y_direction},\n'
            f'    "ball_radius": {self.ball_radius},\n'
            f'    "game_height": {self.game_height},\n'
            f'    "game_width": {self.game_width},\n'
            f'    "paddle_height": {self.paddle_height},\n'
            f'    "paddle_width": {self.paddle_width},\n'
            f'    "paddle_offset": {self.paddle_offset},\n'
            "}"
        )
import json
from django.db import models
from django.conf import settings
from django.core.cache import cache
from .managers import GameStateManager
import logging

logger = logging.getLogger(__name__)

class GameState(models.Model):
    # Game configuration
    max_score = models.PositiveIntegerField(default=3)
    is_game_running = models.BooleanField(default=False)
    is_game_ended = models.BooleanField(default=False)
    game_height = models.IntegerField(default=400)
    game_width = models.IntegerField(default=600)
    paddle_height = models.IntegerField(default=80)
    paddle_width = models.IntegerField(default=15)
    paddle_offset = models.IntegerField(default=20)
    move_step = models.IntegerField(default=10)

    # Players
    player_1_id = models.IntegerField(null=True, blank=True)
    player_2_id = models.IntegerField(null=True, blank=True)
    player_1_name = models.CharField(max_length=100, default="Player 1")
    player_2_name = models.CharField(max_length=100, default="Player 2")
    player_1_score = models.IntegerField(default=0)
    player_2_score = models.IntegerField(default=0)
    player_1_position = models.FloatField(default=160)
    player_2_position = models.FloatField(default=160)

    # Ball state
    ball_radius = models.IntegerField(default=10)
    ball_x_position = models.FloatField(default=290)
    ball_y_position = models.FloatField(default=190)
    ball_x_direction = models.FloatField(default=3)
    ball_y_direction = models.FloatField(default=3)
    ball_speed = models.FloatField(default=12)

    objects = GameStateManager()

    def save(self, *args, **kwargs):
        if not self.id:
            logger.warning("Attempting to save model with no id!")
        cache_key = f"{self.id}"
        game_state_data = {
            "id": self.id,
            "max_score": self.max_score,
            "is_game_running": self.is_game_running,
            "is_game_ended": self.is_game_ended,
            "player_1_id": self.player_1_id,
            "player_2_id": self.player_2_id,
            "player_1_name": self.player_1_name,
            "player_2_name": self.player_2_name,
            "player_1_score": self.player_1_score,
            "player_2_score": self.player_2_score,
            "player_1_position": self.player_1_position,
            "player_2_position": self.player_2_position,
            "ball_x_position": self.ball_x_position,
            "ball_y_position": self.ball_y_position,
            "ball_speed": self.ball_speed,
            "ball_x_direction": self.ball_x_direction,
            "ball_y_direction": self.ball_y_direction,
            "ball_radius": self.ball_radius,
            "game_height": self.game_height,
            "game_width": self.game_width,
            "paddle_height": self.paddle_height,
            "paddle_width": self.paddle_width,
            "paddle_offset": self.paddle_offset,
            "move_step": self.move_step,
        }
        packed_data = msgpack.packb(game_state_data)
        cache.set(cache_key, packed_data, timeout=None)
        logger.info(f"Saved game state to cache with key {cache_key}")

    def delete(self, *args, **kwargs):
        if settings.USE_REDIS:
            cache_key = f"{self.id}"
            cache.delete(cache_key)
            logger.info(f"Deleted game state from cache with key {cache_key}")

    @classmethod
    def from_cache(cls, game_id):
        cache_key = f"{game_id}"
        packed_data = cache.get(cache_key)
        if packed_data:
            game_state_data = msgpack.unpackb(packed_data, raw=False)
            return cls(**game_state_data)
        return None

    def __str__(self) -> str:
        return (
            "game_state_data = {\n"
            f'    "id": {self.id},\n'
            f'    "max_score": {self.max_score},\n'
            f'    "is_game_running": {self.is_game_running},\n'
            f'    "is_game_ended": {self.is_game_ended},\n'
            f'    "player_1_id": {self.player_1_id},\n'
            f'    "player_2_id": {self.player_2_id},\n'
            f'    "player_1_name": {self.player_1_name},\n'
            f'    "player_2_name": {self.player_2_name},\n'
            f'    "player_1_score": {self.player_1_score},\n'
            f'    "player_2_score": {self.player_2_score},\n'
            f'    "player_1_position": {self.player_1_position},\n'
            f'    "player_2_position": {self.player_2_position},\n'
            f'    "ball_x_position": {self.ball_x_position},\n'
            f'    "ball_y_position": {self.ball_y_position},\n'
            f'    "ball_speed": {self.ball_speed},\n'
            f'    "ball_x_direction": {self.ball_x_direction},\n'
            f'    "ball_y_direction": {self.ball_y_direction},\n'
            f'    "ball_radius": {self.ball_radius},\n'
            f'    "game_height": {self.game_height},\n'
            f'    "game_width": {self.game_width},\n'
            f'    "paddle_height": {self.paddle_height},\n'
            f'    "paddle_width": {self.paddle_width},\n'
            f'    "paddle_offset": {self.paddle_offset},\n'
            "}"
        )

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
            "player_1_score": player1_score,
            "player_2_score": player2_score,
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
                        try:
                            self.game_state.delete()
                            logger.info(
                                "Game succesfully deleted from REDIS after ended"
                            )
                        except Exception as e:
                            logger.warning(
                                f"Game could not be deleted after finished: {str(e)}"
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

    async def save_game_state(self):
        cache_key = f"{self.game_id}"
        game_state_data = {
            key: value
            for key, value in self.game_state.__dict__.items()
            if not key.startswith("_")
        }
        cache.set(cache_key, json.dumps(game_state_data), timeout=None)
        logger.debug(f"Game state saved: {game_state_data}")

    async def send_game_state(self):
        logger.debug(f"Sending game state: {self.game_state}")

        if self.send_updates:
            game_state_data = {
                key: value
                for key, value in self.game_state.__dict__.items()
                if not key.startswith("_")
            }
            await self.channel_layer.group_send(
                self.game_group_name,
                {"type": "game_state_update", "state": game_state_data},
            )
        self.send_updates = self.game_state.is_game_running
        if self.game_state.is_game_ended:
            self.send_updates = False  # Stop sending after game ended

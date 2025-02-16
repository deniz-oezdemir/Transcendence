import asyncio
import json
import base64
import zlib
import logging
from django.core.cache import cache
from .models import GameState
from .engine.pong_game_engine import PongGameEngine

logger = logging.getLogger(__name__)


class GameStateManager:
    _instances = {}

    def __new__(cls, game_id):
        if game_id not in cls._instances:
            instance = super(GameStateManager, cls).__new__(cls)
            instance.__init__(game_id)
            cls._instances[game_id] = instance
            logger.info(f"Created new GameStateManager instance for game_id: {game_id}")
        return cls._instances[game_id]

    def __init__(self, game_id):
        if hasattr(self, "initialized"):
            return
        self.game_id = game_id
        self.game_state = self.get_game_state()
        self.lock = asyncio.Lock()
        self.periodic_task = None
        self.initialized = True
        logger.info(f"Initialized GameStateManager for game_id: {game_id}")

    def get_game_state(self):
        game_state = GameState.from_cache(self.game_id)
        if not game_state:
            raise GameState.DoesNotExist("Game not found in Redis.")
        logger.info(f"Retrieved game state for game_id: {self.game_id}")
        return game_state

    async def save_game_state(self):
        self.game_state.save()
        logger.debug(f"Saved game state for game_id: {self.game_id}")

    async def move_player(self, player_id, direction):
        async with self.lock:
            if self.game_state.is_game_running:
                engine = PongGameEngine(self.game_state)

                self.game_state = engine.move_player(player_id, direction)
                logger.debug(f"Moved player {player_id} for game_id: {self.game_id}")

    async def update_game_state(self):
        async with self.lock:
            if self.game_state.is_game_running:
                engine = PongGameEngine(self.game_state)
                self.game_state = engine.update_game_state()
                await self.save_game_state()
                logger.debug(f"Updated game state for game_id: {self.game_id}")

    async def send_game_state(self, channel_layer, game_group_name):
        async with self.lock:
            game_state_data = {
                key: value
                for key, value in self.game_state.__dict__.items()
                if not key.startswith("_")
            }
            compressed_data = zlib.compress(json.dumps(game_state_data).encode())
            encoded_data = base64.b64encode(compressed_data).decode()

            await channel_layer.group_send(
                game_group_name,
                {"type": "game_state_update", "state": encoded_data},
            )
            logger.debug(
                f"Sent game state to group: {game_group_name} for game_id: {self.game_id}"
            )

    async def start_periodic_updates(self, channel_layer, game_group_name):
        if self.periodic_task is None:
            self.periodic_task = asyncio.create_task(
                self._periodic_updates(channel_layer, game_group_name)
            )
            logger.info(f"Started periodic updates for game_id: {self.game_id}")

    async def _periodic_updates(self, channel_layer, game_group_name):
        try:
            while True:
                await self.update_game_state()
                await self.send_game_state(channel_layer, game_group_name)
                await asyncio.sleep(1 / 20)
        except asyncio.CancelledError:
            pass
        logger.info(f"Stopped periodic updates for game_id: {self.game_id}")

    async def stop_periodic_updates(self):
        if self.periodic_task is not None:
            self.periodic_task.cancel()
            self.periodic_task = None
            logger.info(f"Stopped periodic updates for game_id: {self.game_id}")

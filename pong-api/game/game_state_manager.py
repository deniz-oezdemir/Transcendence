import asyncio
import copy
import json
import aiohttp
from django.utils import timezone
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
            logger.debug(
                f"Created new GameStateManager instance for game_id: {game_id}"
            )
        return cls._instances[game_id]

    def __init__(self, game_id):
        if hasattr(self, "initialized"):
            return
        self.game_id = game_id
        self.game_state = self.get_game_state()
        self.previous_game_state = copy.deepcopy(self.game_state)
        self.lock = asyncio.Lock()
        self.periodic_task = None
        self.initialized = True
        self.match_result_sent = False
        self.game_start_time = timezone.now()  # Store start time
        logger.debug(f"Initialized GameStateManager for game_id: {game_id}")

    def get_game_state(self):
        game_state = GameState.from_cache(self.game_id)
        if not game_state:
            raise GameState.DoesNotExist("Game not found in Redis.")
        logger.debug(f"Retrieved game state for game_id: {self.game_id}")
        return game_state

    async def save_game_state(self):
        self.game_state.save()
        logger.debug(f"Saved game state for game_id: {self.game_id}")

    async def toggle_game(self):
        async with self.lock:
            self.game_state.is_game_running = not self.game_state.is_game_running
            logger.debug(f"Toggled game_id: {self.game_id}")

    async def move_player(self, player_id, direction):
        async with self.lock:
            if self.game_state.is_game_running:
                engine = PongGameEngine(self.game_state)

                self.game_state = engine.move_player(player_id, direction)
                logger.debug(f"Moved player {player_id} for game_id: {self.game_id}")

    async def update_game_state(self, channel_layer, game_group_name):
        try:
            async with self.lock:
                if self.game_state.is_game_running:
                    engine = PongGameEngine(self.game_state)
                    self.game_state = engine.update_game_state()
                    logger.debug(f"Updated game state for game_id: {self.game_id}")
                if self.game_state.is_game_ended:
                    logger.debug(f"Ending game state for game_id: {self.game_id}")
                    await self.send_game_result_to_matchmaking()
                    await self.send_connection_close(channel_layer, game_group_name)
        except Exception as e:
            logger.error(
                f"Error updating game state: {str(e)}", exc_info=True
            )

    def calculate_diffs(self, current_state, previous_state):
        diffs = {}
        for key, value in current_state.__dict__.items():
            if not key.startswith("_"):
                prev_value = getattr(previous_state, key, None)
                if prev_value != value:
                    diffs[key] = value
                    logger.debug(f"Detected change in {key}: {prev_value} -> {value}")
        return diffs

    async def send_full_game_state(self, channel_layer, game_group_name):
        try:
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
                    f"Sent full game state to group: {game_group_name} for game_id: {self.game_id}"
                )
        except Exception as e:
            logger.error(
                f"Error sending full game state to clients: {str(e)}", exc_info=True
            )

    async def send_partial_game_state(self, channel_layer, game_group_name):
        try:
            async with self.lock:
                if self.previous_game_state is None:
                    self.previous_game_state = copy.deepcopy(
                        self.game_state
                    )  # Initialize previous state if None

                diffs = self.calculate_diffs(self.game_state, self.previous_game_state)
                if diffs:
                    compressed_data = zlib.compress(json.dumps(diffs).encode())
                    encoded_data = base64.b64encode(compressed_data).decode()

                    await channel_layer.group_send(
                        game_group_name,
                        {"type": "game_state_update", "state": encoded_data},
                    )
                    logger.debug(
                        f"Sent game state diffs to group: {game_group_name} for game_id: {self.game_id}"
                    )
                self.previous_game_state = copy.deepcopy(
                    self.game_state
                )  # Update previous state
        except Exception as e:
            logger.error(
                f"Error sending partial game state to clients: {str(e)}", exc_info=True
            )

    async def start_periodic_updates(self, channel_layer, game_group_name):
        if self.periodic_task is None:
            self.periodic_task = asyncio.create_task(
                self._periodic_updates(channel_layer, game_group_name)
            )
            logger.debug(f"Started periodic updates for game_id: {self.game_id}")

    async def send_connection_close(self, channel_layer, game_group_name):
        try:
            await channel_layer.group_send(
                game_group_name,
                {"type": "connection_closed"},
            )
            logger.debug(
                f"Sent full game state to group: {game_group_name} for game_id: {self.game_id}"
            )
        except Exception as e:
            logger.error(
                f"Error sending connection closed message to clients: {str(e)}", exc_info=True
            )

    async def _periodic_updates(self, channel_layer, game_group_name):
        try:
            while True:
                await self.update_game_state(channel_layer, game_group_name)
                logger.debug("Game updated now send")
                await self.send_partial_game_state(channel_layer, game_group_name)
                await asyncio.sleep(1 / 20)
        except asyncio.CancelledError:
            pass
        logger.debug(f"Stopped periodic updates for game_id: {self.game_id}")

    async def stop_periodic_updates(self):
        if self.periodic_task is not None:
            self.periodic_task.cancel()
            self.periodic_task = None
            logger.debug(f"Stopped periodic updates for game_id: {self.game_id}")

    async def send_game_result_to_matchmaking(self):
        """Sends game result to matchmaking service when game ends"""
        if not self.match_result_sent:
            self.match_result_sent = True
            logger.debug(f"Preparing to send game result for game {self.game_id}")
            matchmaking_url = (
                f"http://nginx:8000/api/matchmaking/api/match/{self.game_id}/result/"
            )
            logger.debug(f"Matchmaking URL: {matchmaking_url}")

            # Determine the winner based on the player with the most goals
            if self.game_state.player_1_score > self.game_state.player_2_score:
                winner_id = self.game_state.player_1_id
            elif self.game_state.player_2_score > self.game_state.player_1_score:
                winner_id = self.game_state.player_2_id
            else:
                winner_id = None  # It's a tie

            game_result = {
                "winner_id": winner_id,
                "player_1_score": self.game_state.player_1_score,
                "player_2_score": self.game_state.player_2_score,
                "start_time": self.game_start_time.isoformat(),
                "end_time": timezone.now().isoformat(),
            }
            logger.debug(f"Game result data: {game_result}")

            try:
                logger.debug("Initiating HTTP request to matchmaking service")
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        matchmaking_url, json=game_result
                    ) as response:
                        response_text = await response.text()
                        logger.debug(f"Matchmaking response: {response_text}")
                        if response.status == 200:
                            logger.debug(
                                f"Game {self.game_id} result successfully sent to matchmaking. Response: {response_text}"
                            )
                            try:
                                self.game_state.delete()
                                logger.debug(
                                    "Game successfully deleted from REDIS after ended"
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
                self.match_result_sent = False
                logger.error(
                    f"Error sending game result to matchmaking: {str(e)}", exc_info=True
                )

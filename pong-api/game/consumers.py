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
        logger.info(
            f"Connection added to group: {self.game_group_name} and channel: {self.channel_name}"
        )
        self.game_state = self.get_game_state()
        await self.accept()
        logger.info(
            f"WebSocket connected: {self.channel_name}, game_state: {self.game_state}"
        )
        self.periodic_task = asyncio.create_task(self.send_periodic_updates())
        self.send_updates = (
            self.game_state.is_game_running
        )  # set to False after first is_game_running False or
        # is_game_ended True

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
            logger.info(
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
        try:
            self.game_state = self.get_game_state()
            logger.info("move player is game running ok")
            engine = PongGameEngine(self.game_state)
            self.game_state = engine.move_player(player_id, direction)
            logger.info(f"Player {player_id} moved to direction {direction}")

            if not self.game_state.is_game_ended:
                await self.save_game_state()
                logger.info("move_player: game saved")
                await self.send_game_state()
                logger.info(f"move_player: game sent: {self.game_state}")
        except Exception as e:
            logger.error(f"Unexpected error occurred while moving player: {e}")

    async def toggle_game(self):
        self.game_state = self.get_game_state()
        self.game_state.is_game_running = not self.game_state.is_game_running
        await self.save_game_state()
        logger.info(
            f"Toggled game state for game_id {self.game_id}. New state: {self.game_state.is_game_running}"
        )
        await self.send_game_state()
        logger.debug("toggle_game: game sent")

    async def send_periodic_updates(self):
        self.game_state = self.get_game_state()
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
                await self.save_game_state()
                logger.debug("update_game_state: game saved")

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

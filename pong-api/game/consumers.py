import json
import logging
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
from .models import GameState, GamePlayer, Player
from .engine.pong_game_engine import PongGameEngine

logger = logging.getLogger(__name__)


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
        self.game_group_name = f"game_{self.game_id}"

        # Join game group
        await self.channel_layer.group_add(self.game_group_name, self.channel_name)

        await self.accept()
        logger.debug(f"WebSocket connected: {self.channel_name}")

        # Start periodic task
        self.periodic_task = asyncio.create_task(self.send_periodic_updates())

    async def disconnect(self, close_code):
        # Leave game group
        await self.channel_layer.group_discard(self.game_group_name, self.channel_name)
        logger.debug(f"WebSocket disconnected: {self.channel_name}")

        # Cancel periodic task
        self.periodic_task.cancel()

    # Receive message from WebSocket
    async def receive(self, text_data):
        logger.debug(f"Message received: {text_data}")
        text_data_json = json.loads(text_data)
        action = text_data_json["action"]

        if action == "move":
            player_id = text_data_json["player_id"]
            direction = text_data_json["direction"]
            await self.move_player(player_id, direction)

        # Send message to game group
        await self.channel_layer.group_send(
            self.game_group_name, {"type": "game_update", "message": text_data_json}
        )

    # Receive message from game group
    async def game_update(self, event):
        message = event["message"]
        logger.debug(f"Game update: {message}")

        # Send message to WebSocket
        await self.send(text_data=json.dumps(message))

    # Handle game state update
    async def game_state_update(self, event):
        state = event["state"]
        logger.debug(f"Game state update: {state}")

        # Send game state update to WebSocket
        await self.send(
            text_data=json.dumps({"type": "game_state_update", "state": state})
        )

    @database_sync_to_async
    def move_player(self, player_id, direction):
        try:
            game_state = GameState.objects.get(id=self.game_id)
            engine = PongGameEngine(game_state)
            engine.move_player(player_id, direction)
            logger.debug(f"Player {player_id} moved to direction {direction}")
        except Player.DoesNotExist:
            logger.error(f"Player with id {player_id} does not exist")
        except GamePlayer.DoesNotExist:
            logger.error(f"GamePlayer for player id {player_id} does not exist")
        except Exception as e:
            logger.error(f"Unexpected error occurred while moving player: {e}")

    async def send_periodic_updates(self):
        while True:
            # Update game state
            print("while loop")
            ball_position = await database_sync_to_async(self.update_game_state)()
            print(f"ball position: {ball_position}")

            # Send updated ball position to WebSocket
            await self.send(
                text_data=json.dumps({"type": "ball_update", "position": ball_position})
            )
            await asyncio.sleep(1)  # TODO: update ball position 60 times per second

    def update_game_state(self):
        try:
            game_state = cache.get(f"game_{self.game_id}")
            if not game_state:
                raise {"error": "Game not found"}
            engine = PongGameEngine(game_state)
            engine.update_game_state()
            print("game updated on engine")
            self.save_game_state(game_state)
            print("game saved")
            return {"x": game_state.ball_x_position, "y": game_state.ball_y_position}
        except GameState.DoesNotExist:
            return {"error": "Game not found"}

    def get_game_state(self):
        game_state = cache.get(f"game_{self.game_id}")
        if not game_state:
            game_state = GameState.objects.get(id=self.game_id)
            cache.set(f"game_{self.game_id}", game_state, timeout=None)
        return game_state

    def save_game_state(self, game_state):
        cache.set(f"game_{self.game_id}", game_state, timeout=None)

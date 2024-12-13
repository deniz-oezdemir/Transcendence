import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import GameState, GamePlayer, Player

logger = logging.getLogger(__name__)


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
        self.game_group_name = f"game_{self.game_id}"

        # Join game group
        await self.channel_layer.group_add(self.game_group_name, self.channel_name)

        await self.accept()
        logger.debug(f"WebSocket connected: {self.channel_name}")

    async def disconnect(self, close_code):
        # Leave game group
        await self.channel_layer.group_discard(self.game_group_name, self.channel_name)
        logger.debug(f"WebSocket disconnected: {self.channel_name}")

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
            player = Player.objects.get(id=player_id)
            game_player = GamePlayer.objects.get(player=player)
            # Validate direction here if necessary
            game_player.player_direction = direction
            game_player.save()
            logger.debug(f"Player {player_id} moved to direction {direction}")
        except Player.DoesNotExist:
            logger.error(f"Player with id {player_id} does not exist")
        except GamePlayer.DoesNotExist:
            logger.error(f"GamePlayer for player id {player_id} does not exist")
        except Exception as e:
            logger.error(f"Unexpected error occurred while moving player: {e}")

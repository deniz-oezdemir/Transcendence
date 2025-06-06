import json
import datetime
import aiohttp
from django.utils import timezone
import zlib
import base64
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache
from .game_state_manager import GameStateManager
from .engine.pong_game_engine import PongGameEngine

logger = logging.getLogger(__name__)


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
        self.game_group_name = f"game_{self.game_id}"
        self.game_state_manager = GameStateManager(self.game_id)

        await self.channel_layer.group_add(self.game_group_name, self.channel_name)
        await self.accept()

        connected_clients = cache.get(f"{self.game_id}_connected_clients", 0) + 1
        cache.set(f"{self.game_id}_connected_clients", connected_clients)
        logger.debug(
            f"Client connected: {self.channel_name}, Total connected clients: {connected_clients}, For game: {self.game_id}"
        )
        await self.game_state_manager.send_full_game_state(
            self.channel_layer, self.game_group_name
        )

        if connected_clients == 1:
            await self.game_state_manager.start_periodic_updates(
                self.channel_layer, self.game_group_name
            )
            logger.debug(f"Started periodic updates for game: {self.game_id}")

    async def disconnect(self, close_code):
        try:
            await self.channel_layer.group_discard(
                self.game_group_name, self.channel_name
            )

            connected_clients = cache.get(f"{self.game_id}_connected_clients", 0) - 1
            cache.set(f"{self.game_id}_connected_clients", connected_clients)
            logger.debug(
                f"Client disconnected: {self.channel_name}, Total connected clients: {connected_clients}"
            )

            if connected_clients == 0:
                await self.game_state_manager.stop_periodic_updates()
                logger.debug(f"Stopped periodic updates for game: {self.game_id}")

            # Notify all clients that the connection has ended
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    "type": "connection_closed",
                    "message": "Connection closed by server.",
                },
            )
        except Exception as e:
            logger.error(
                f"disconnect exception: {e}",
                exc_info=True,
            )

    async def connection_closed(self, event):
        try:
            # Handle the connection closed event
            logger.debug(f"connection_closed message received for game {self.game_id}")
            await self.send(text_data=json.dumps({"type": "connection_closed"}))
            await self.close_all_connections()
            await self.close()
        except Exception as e:
            logger.error(
                f"connection_closed handler exception: {e}",
                exc_info=True,
            )

    async def close_all_connections(self):
        try:
            # Notify all clients that the connection has ended
            logger.debug(f"Closing all connections for game {self.game_id}")
            self.game_state_manager.game_state.delete()
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    "type": "connection_closed",
                },
            )
            await self.disconnect(0)
            await self.close()
        except Exception as e:
            logger.error(
                f"close_all_connections exception: {e}",
                exc_info=True,
            )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json["action"]
        logger.debug(f"Received action: {action}")

        if action == "move":
            player_id = text_data_json["player_id"]
            direction = text_data_json["direction"]

            logger.debug(
                f"{datetime.datetime.now()} - Move action received: player_id={player_id}, direction={direction}"
            )

            await self.game_state_manager.move_player(player_id, direction)
            logger.debug(
                f"Game state updated and sent for move action: player_id={player_id}, direction={direction}"
            )

        if action == "toggle":
            logger.debug("Toggle action received")
            await self.game_state_manager.toggle_game()
            logger.debug(
                f"Game running state toggled to: {self.game_state_manager.game_state.is_game_running}"
            )

    async def game_state_update(self, event):
        try:
            encoded_data = event["state"]
            compressed_data = base64.b64decode(encoded_data)
            game_state_data = json.loads(zlib.decompress(compressed_data).decode())
            for key, value in game_state_data.items():
                setattr(self.game_state_manager.game_state, key, value)

            await self.send(
                text_data=json.dumps(
                    {"type": "game_state_update", "state": encoded_data}
                )
            )
            logger.debug(f"Game state update sent to client: {self.channel_name}")
            try:
                if self.game_state_manager.game_state.is_game_ended:
                    await self.close_all_connections()
            except Exception as e:
                logger.error(
                    f"Error disconnecting and sending game to matchmaking: {str(e)}",
                    exc_info=True,
                )
        except Exception as e:
            logger.error(
                f"game_state_update exception: {e}",
                exc_info=True,
            )

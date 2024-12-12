from channels.generic.websocket import AsyncWebsocketConsumer
import json
from channels.db import database_sync_to_async
from game.models import GamePlayer


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
        self.game_group_name = f"game_{self.game_id}"

        # Join game group
        await self.channel_layer.group_add(self.game_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        # Leave game group
        await self.channel_layer.group_discard(self.game_group_name, self.channel_name)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)

        if "message" in text_data_json:
            message = text_data_json["message"]

            # Send message to game group
            await self.channel_layer.group_send(
                self.game_group_name, {"type": "game_message", "message": message}
            )
        elif "type" in text_data_json and text_data_json["type"] == "game_state_update":
            state = text_data_json["state"]

            # Send state update to game group
            await self.channel_layer.group_send(
                self.game_group_name, {"type": "game_state_update", "state": state}
            )
        elif "type" in text_data_json and text_data_json["type"] == "player_move":
            player_id = text_data_json["player_id"]
            new_position = text_data_json["new_position"]

            # Update the player's position in the database
            await self.update_player_position(player_id, new_position)

            # Send the updated position to the game group
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    "type": "player_move_update",
                    "player_id": player_id,
                    "new_position": new_position,
                },
            )

    async def game_message(self, event):
        message = event["message"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({"message": message}))

    async def game_state_update(self, event):
        state = event["state"]

        # Send state update to WebSocket
        await self.send(text_data=json.dumps({"state": state}))

    async def player_move_update(self, event):
        player_id = event["player_id"]
        new_position = event["new_position"]

        # Send the updated position to WebSocket
        await self.send(
            text_data=json.dumps(
                {
                    "type": "player_move_update",
                    "player_id": player_id,
                    "new_position": new_position,
                }
            )
        )

    @database_sync_to_async
    def update_player_position(self, player_id, new_position):
        player = GamePlayer.objects.get(player_id=player_id)
        player.player_position = new_position
        player.save()

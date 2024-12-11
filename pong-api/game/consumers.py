from channels.generic.websocket import AsyncWebsocketConsumer
import json


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

    async def game_message(self, event):
        message = event["message"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({"message": message}))

    async def game_state_update(self, event):
        state = event["state"]

        # Send state update to WebSocket
        await self.send(text_data=json.dumps({"state": state}))

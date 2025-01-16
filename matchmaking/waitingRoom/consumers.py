import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Match

class WaitingRoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("waiting_room", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("waiting_room", self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'create_match':
            match = await self.create_match(data['player_1_id'])

            await self.channel_layer.group_send(
                "waiting_room",
                {
                    "type": "match_created",
                    "match_id": match.match_id,
                    "player_1_id": match.player_1_id,
                }
            )

    async def match_created(self, event):
        await self.send(text_data=json.dumps({
            "type": "match_created",
            "match_id": event["match_id"],
            "player_1_id": event["player_1_id"],
        }))

    @database_sync_to_async
    def create_match(self, player_1_id):
        return Match.objects.create(
            match_id=Match.objects.count() + 1,
            player_1_id=player_1_id
        )

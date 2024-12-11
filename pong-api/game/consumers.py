import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import GameState
from .engine.pong_game_engine import PongGameEngine


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
        data = json.loads(text_data)
        player_id = data["player_id"]
        direction = data["direction"]

        game_state = await self.get_game_state(self.game_id)
        game_engine = PongGameEngine(game_state)
        await database_sync_to_async(game_engine.move_player)(player_id, direction)
        await database_sync_to_async(game_engine.update_game_state)()
        await self.save_game_state(game_state)

        # Send updated game state to group
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                "type": "game_state_update",
                "game_state": self.serialize_game_state(game_state),
            },
        )

    async def game_state_update(self, event):
        game_state = event["game_state"]

        # Send game state to WebSocket
        await self.send(text_data=json.dumps(game_state))

    @database_sync_to_async
    def get_game_state(self, game_id):
        return GameState.objects.get(pk=game_id)

    @database_sync_to_async
    def save_game_state(self, game_state):
        game_state.save()

    @database_sync_to_async
    def serialize_game_state(self, game_state):
        return {
            "ball_x_position": game_state.ball_x_position,
            "ball_y_position": game_state.ball_y_position,
            "players": [
                {
                    "id": player.player.id,
                    "position": player.player_position,
                    "score": player.player_score,
                }
                for player in game_state.players.all()
            ],
        }

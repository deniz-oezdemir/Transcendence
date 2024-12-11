import json
from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
from channels.db import database_sync_to_async
from django.test import TransactionTestCase
from game.consumers import GameConsumer
from game.models import GameState, GamePlayer, Player
from game.routing import application
from asgiref.sync import async_to_sync


class GameConsumerTest(TransactionTestCase):
    def setUp(self):
        # Call the asynchronous setup method
        async_to_sync(self.asyncSetUp)()

    async def asyncSetUp(self):
        self.game_state = await database_sync_to_async(GameState.objects.create)(
            ball_x_position=0, ball_y_position=0
        )
        self.player1 = await database_sync_to_async(Player.objects.create)(
            username="player1", player_name="Player 1", player_id=1
        )
        self.player2 = await database_sync_to_async(Player.objects.create)(
            username="player2", player_name="Player 2", player_id=2
        )
        self.game_player1 = await database_sync_to_async(GamePlayer.objects.create)(
            player=self.player1, player_position=0, player_score=0
        )
        self.game_player2 = await database_sync_to_async(GamePlayer.objects.create)(
            player=self.player2, player_position=0, player_score=0
        )
        await database_sync_to_async(self.game_state.players.add)(self.game_player1)
        await database_sync_to_async(self.game_state.players.add)(self.game_player2)

    async def test_game_consumer(self):
        # Create a WebSocket communicator
        communicator = WebsocketCommunicator(
            application, f"/ws/game/{self.game_state.id}/"
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)

        # Test sending a message to move a player
        message = {"player_id": self.player1.id, "direction": "up"}
        await communicator.send_json_to(message)

        # Receive the game state update
        response = await communicator.receive_json_from()
        self.assertIn("ball_x_position", response)
        self.assertIn("ball_y_position", response)
        self.assertIn("players", response)

        # Check if the player's position was updated
        updated_game_player1 = await database_sync_to_async(GamePlayer.objects.get)(
            id=self.game_player1.id
        )
        self.assertNotEqual(
            updated_game_player1.player_position, self.game_player1.player_position
        )

        # Disconnect the communicator
        await communicator.disconnect()

    async def test_game_state_update(self):
        # Create a WebSocket communicator
        communicator = WebsocketCommunicator(
            application, f"/ws/game/{self.game_state.id}/"
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)

        # Simulate a game state update event
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f"game_{self.game_state.id}",
            {
                "type": "game_state_update",
                "game_state": {
                    "ball_x_position": 10,
                    "ball_y_position": 20,
                    "players": [
                        {"id": self.game_player1.id, "position": 5, "score": 1},
                        {"id": self.game_player2.id, "position": 10, "score": 2},
                    ],
                },
            },
        )

        # Receive the game state update
        response = await communicator.receive_json_from()
        self.assertEqual(response["ball_x_position"], 10)
        self.assertEqual(response["ball_y_position"], 20)
        self.assertEqual(len(response["players"]), 2)

        # Disconnect the communicator
        await communicator.disconnect()

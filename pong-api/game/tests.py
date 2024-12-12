from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
from channels.db import database_sync_to_async
from django.test import TransactionTestCase
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

    async def test_player_move(self):
        communicator = WebsocketCommunicator(application, "/ws/game/1/")
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)

        # Test sending a player move input
        await communicator.send_json_to(
            {
                "type": "player_move",
                "player_id": self.player1.player_id,
                "new_position": 10,
            }
        )
        response = await communicator.receive_json_from()
        self.assertEqual(response["player_id"], self.player1.player_id)
        self.assertEqual(response["new_position"], 10)

        # Verify the player's position in the database
        updated_game_player1 = await database_sync_to_async(GamePlayer.objects.get)(
            player=self.player1
        )
        self.assertEqual(updated_game_player1.player_position, 10)

        # Close the connection
        await communicator.disconnect()

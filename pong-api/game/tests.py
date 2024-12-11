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

    async def test_game_consumer(self):
        communicator = WebsocketCommunicator(application, "/ws/game/1/")
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)

        # Test sending a message
        await communicator.send_json_to({"message": "hello"})
        response = await communicator.receive_json_from()
        self.assertEqual(response["message"], "hello")

        # Close the connection
        await communicator.disconnect()

    async def test_game_state_update(self):
        communicator = WebsocketCommunicator(application, "/ws/game/1/")
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)

        # Test sending a game state update
        await communicator.send_json_to(
            {"type": "game_state_update", "state": "new_state"}
        )
        response = await communicator.receive_json_from()
        self.assertEqual(response["state"], "new_state")

        # Close the connection
        await communicator.disconnect()

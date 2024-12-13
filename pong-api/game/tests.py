from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
from channels.db import database_sync_to_async
from django.test import TransactionTestCase
from game.models import GameState, GamePlayer, Player
from game.routing import application
from asgiref.sync import async_to_sync
import logging
import asyncio

logger = logging.getLogger(__name__)


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
        communicator = WebsocketCommunicator(
            application, f"/ws/game/{self.game_state.id}/"
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)

        # Send a move action
        await communicator.send_json_to(
            {"action": "move", "player_id": self.player1.id, "direction": 1}
        )

        # Increase the timeout to give more time for the response
        try:
            response = await communicator.receive_json_from(timeout=10)
            self.assertEqual(response["action"], "move")
            self.assertEqual(response["player_id"], self.player1.id)
            self.assertEqual(response["direction"], 1)
        except asyncio.TimeoutError:
            logger.error("TimeoutError: Did not receive response in time")
            self.fail("TimeoutError: Did not receive response in time")

        await communicator.disconnect()

    async def test_game_state_updates(self):
        communicator1 = WebsocketCommunicator(
            application, f"/ws/game/{self.game_state.id}/"
        )
        communicator2 = WebsocketCommunicator(
            application, f"/ws/game/{self.game_state.id}/"
        )
        connected1, subprotocol1 = await communicator1.connect()
        connected2, subprotocol2 = await communicator2.connect()
        self.assertTrue(connected1)
        self.assertTrue(connected2)

        # Simulate game state update
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f"game_{self.game_state.id}",
            {
                "type": "game_state_update",
                "state": {"ball_x_position": 100, "ball_y_position": 100},
            },
        )

        # Increase the timeout to give more time for the response
        try:
            response1 = await communicator1.receive_json_from(timeout=10)
            response2 = await communicator2.receive_json_from(timeout=10)

            self.assertEqual(response1["state"]["ball_x_position"], 100)
            self.assertEqual(response1["state"]["ball_y_position"], 100)
            self.assertEqual(response2["state"]["ball_x_position"], 100)
            self.assertEqual(response2["state"]["ball_y_position"], 100)
        except asyncio.TimeoutError:
            logger.error("TimeoutError: Did not receive response in time")
            self.fail("TimeoutError: Did not receive response in time")

        # Close the connections
        await communicator1.disconnect()
        await communicator2.disconnect()

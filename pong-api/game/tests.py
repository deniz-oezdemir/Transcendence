from rest_framework.test import APITestCase
from rest_framework import status
from game.models import GameState


class GameAPITest(APITestCase):
    game_id = 22

    def setUp(self):
        # Create a game that will be used in all tests
        self.create_url = "/game/create_game/"
        self.game_data = {
            "id": self.game_id,
            "max_score": 3,
            "player_1_id": 1,
            "player_1_name": "Player 1",
            "player_2_id": 2,
            "player_2_name": "Player 2",
        }
        self.client.post(self.create_url, self.game_data, format="json")

    def test_create_game(self):
        # Attempt to create a game with the same ID should fail
        response = self.client.post(self.create_url, self.game_data, format="json")
        if response.status_code != status.HTTP_201_CREATED:
            print("Response data:", response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(GameState.objects.count(), 1)

    def test_toggle_game(self):
        # Toggle the game
        toggle_url = f"/game/toggle_game/{self.game_id}/"
        response = self.client.put(toggle_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        game_state = GameState.objects.get(id=1)
        self.assertTrue(game_state.is_game_running)

    def test_get_game_state(self):
        # Get the game state
        get_url = f"/game/get_game_state/{self.game_id}/"
        response = self.client.get(get_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], 1)

    def test_delete_game(self):
        # Delete the game
        delete_url = f"/game/delete_game/{self.game_id}/"
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(GameState.objects.count(), 0)

        # Attempt to delete the same game again should fail
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


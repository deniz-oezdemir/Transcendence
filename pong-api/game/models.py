from django.db import models
from shared.models.player import Player

# TODO: remove magic numbers


class GameState(models.Model):
    """
    Represents the state of a Pong game.

    Attributes:
        player_1: The first player in the game.
        player_1_position (int): The vertical position of player 1's paddle.
        player_1_direction (int): The direction of player 1's paddle movement.
        player_2: The second player in the game.
        player_2_position (int): The vertical position of player 2's paddle.
        player_2_direction (int): The direction of player 2's paddle movement.
        ball_x_position (int): The horizontal position of the ball.
        ball_y_position (int): The vertical position of the ball.
        ball_x_velocity (int): The horizontal velocity of the ball.
        ball_y_velocity (int): The vertical velocity of the ball.
    """

    max_score = 3
    is_game_running = models.BooleanField(default=False)
    is_game_ended = models.BooleanField(default=False)

    player_1 = models.ForeignKey(
        Player,
        related_name="player_1_games",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    player_1_id = models.IntegerField(default=150)
    player_1_position = models.IntegerField(default=150)
    player_1_direction = models.IntegerField(default=150)
    player_1_score = models.IntegerField(default=0)

    player_2 = models.ForeignKey(
        Player,
        related_name="player_2_games",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    player_2_id = models.IntegerField(default=150)
    player_2_position = models.IntegerField(default=150)
    player_2_direction = models.IntegerField(default=150)
    player_2_score = models.IntegerField(default=0)

    ball_x_position = models.IntegerField(default=400)
    ball_y_position = models.IntegerField(default=200)
    ball_x_velocity = models.IntegerField(default=30)
    ball_y_velocity = models.IntegerField(default=30)

    def __str__(self) -> str:
        return (
            f"Ball at position:\n"
            f"  x: {self.ball_x_position}\n"
            f"  y: {self.ball_y_position}\n"
            f"With velocity:\n"
            f"  x: {self.ball_x_velocity}\n"
            f"  y: {self.ball_y_velocity}\n"
            f"Player 1 at position:\n"
            f"  {self.player_1_position}\n"
            f"  with direction: {self.player_1_direction}\n"
            f"Player 2 at position:\n"
            f"  {self.player_2_position}\n"
            f"  with direction: {self.player_2_direction}"
        )

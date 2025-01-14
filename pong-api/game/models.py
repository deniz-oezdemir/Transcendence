from django.db import models
from django.contrib.auth.models import AbstractUser

# TODO: remove magic numbers


class Player(AbstractUser):
    player_name = models.CharField(max_length=100)
    player_id = models.IntegerField(default=150)
    player_position = models.IntegerField(default=150)
    player_direction = models.IntegerField(default=150)
    player_score = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Player {self.player.player_id} - Name: {self.player.player_name} - Position: {self.player_position}, Direction: {self.player_direction}, Score: {self.player_score}"


class GameState(models.Model):
    """
    Represents the state of a Pong game.
    """

    # Game configuration
    max_score = models.PositiveIntegerField(default=3)
    is_game_running = models.BooleanField(default=False)
    is_game_ended = models.BooleanField(default=False)

    # Players
    player_1 = models.ForeignKey(Player, on_delete=models.CASCADE)
    player_2 = models.ForeignKey(
        Player, on_delete=models.CASCADE
    )  # TODO: check if CASCADE is ok

    # Ball state
    ball_x_position = models.IntegerField(default=400)
    ball_y_position = models.IntegerField(default=200)
    ball_x_velocity = models.IntegerField(default=10)
    ball_y_velocity = models.IntegerField(default=10)

    def __str__(self) -> str:
        return (
            f"Ball at position:\n"
            f"  x: {self.ball_x_position}\n"
            f"  y: {self.ball_y_position}\n"
            f"With velocity:\n"
            f"  x: {self.ball_x_velocity}\n"
            f"  y: {self.ball_y_velocity}\n"
            f"Player 1 at position: {self.player_1.player_position} with direction: {self.player_1.player_direction}\n"
            f"Player 2 at position: {self.player_2.player_position} with direction: {self.player_2.player_direction}"
        )

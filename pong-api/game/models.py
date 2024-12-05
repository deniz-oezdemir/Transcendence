from django.db import models
from shared.models.player import Player

# TODO: remove magic numbers


class GamePlayer(models.Model):
    """
    Through model between GameState and Player
    """

    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        null=True,
    )
    player_position = models.IntegerField(default=150)
    player_direction = models.IntegerField(default=150)
    player_score = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Player {self.player.id} - Position: {self.player_position}, Direction: {self.player_direction}, Score: {self.player_score}"


class GameState(models.Model):
    """
    Represents the state of a Pong game.
    """

    # Game configuration
    max_score = models.PositiveIntegerField(default=3)
    is_game_running = models.BooleanField(default=False)
    is_game_ended = models.BooleanField(default=False)

    # Players
    players = models.ManyToManyField(GamePlayer, related_name="game_states")

    # Ball state
    ball_x_position = models.IntegerField(default=400)
    ball_y_position = models.IntegerField(default=200)
    ball_x_velocity = models.IntegerField(default=30)
    ball_y_velocity = models.IntegerField(default=30)

    def __str__(self) -> str:
        players_str = "\n".join(
            [
                f"Player {i+1} at position: {player.player_position} with direction: {player.player_direction}"
                for i, player in enumerate(self.players.all())
            ]
        )
        return (
            f"Ball at position:\n"
            f"  x: {self.ball_x_position}\n"
            f"  y: {self.ball_y_position}\n"
            f"With velocity:\n"
            f"  x: {self.ball_x_velocity}\n"
            f"  y: {self.ball_y_velocity}\n"
            f"{players_str}"
        )

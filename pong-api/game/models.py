import json
from django.db import models
from django.conf import settings
from django.core.cache import cache
from .managers import GameStateManager
import logging

logger = logging.getLogger(__name__)


class GameState(models.Model):
    # Game configuration
    max_score = models.PositiveIntegerField(default=3)
    is_game_running = models.BooleanField(default=False)
    is_game_ended = models.BooleanField(default=False)

    # Players
    player_1_id = models.IntegerField(null=True, blank=True)
    player_2_id = models.IntegerField(null=True, blank=True)
    player_1_name = models.CharField(max_length=100, default="Player 1")
    player_2_name = models.CharField(max_length=100, default="Player 2")
    player_1_position = models.IntegerField(default=50)  # Default middle position
    player_2_position = models.IntegerField(default=50)  # Default middle position

    # Ball state
    ball_x_position = models.IntegerField(default=400)
    ball_y_position = models.IntegerField(default=200)
    ball_x_velocity = models.IntegerField(default=10)
    ball_y_velocity = models.IntegerField(default=10)

    objects = GameStateManager()

    def save(self, *args, **kwargs):
        if settings.USE_REDIS:
            cache_key = f"game_state_{self.id}"
            game_state_data = {
                "id": self.id,
                "max_score": self.max_score,
                "is_game_running": self.is_game_running,
                "is_game_ended": self.is_game_ended,
                "player_1_id": self.player_1_id,
                "player_2_id": self.player_2_id,
                "player_1_name": self.player_1_name,
                "player_2_name": self.player_2_name,
                "player_1_position": self.player_1_position,
                "player_2_position": self.player_2_position,
                "ball_x_position": self.ball_x_position,
                "ball_y_position": self.ball_y_position,
                "ball_x_velocity": self.ball_x_velocity,
                "ball_y_velocity": self.ball_y_velocity,
            }
            cache.set(cache_key, json.dumps(game_state_data), timeout=None)
            logger.info(f"Saved game state to cache with key {cache_key}")
        else:
            super().save(*args, **kwargs)
            logger.info(f"Saved game state to database with id {self.id}")

    @classmethod
    def from_cache(cls, game_id):
        cache_key = f"game_state_{game_id}"
        game_state_data = cache.get(cache_key)
        if game_state_data:
            if isinstance(game_state_data, str):
                game_state_dict = json.loads(game_state_data)
            else:
                game_state_dict = {
                    k: v
                    for k, v in game_state_data.__dict__.items()
                    if not k.startswith("_")
                }
            return cls(**game_state_dict)
        return None

    def __str__(self) -> str:
        return (
            f"Ball at position:\n"
            f"  x: {self.ball_x_position}\n"
            f"  y: {self.ball_y_position}\n"
            f"With velocity:\n"
            f"  x: {self.ball_x_velocity}\n"
            f"  y: {self.ball_y_velocity}\n"
            f"Player 1 at position: {self.player_1_name} (ID: {self.player_1_id}, Position: {self.player_1_position})\n"
            f"Player 2 at position: {self.player_2_name} (ID: {self.player_2_id}, Position: {self.player_2_position})"
        )

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
    game_height = models.IntegerField(default=1200)
    game_width= models.IntegerField(default=1600)
    paddle_height = models.IntegerField(default=10)
    paddle_width= models.IntegerField(default=20)

    # Players
    player_1_id = models.IntegerField(null=True, blank=True)
    player_2_id = models.IntegerField(null=True, blank=True)
    player_1_name = models.CharField(max_length=100, default="Player 1")
    player_2_name = models.CharField(max_length=100, default="Player 2")
    player_1_score = models.IntegerField(default=0)
    player_2_score = models.IntegerField(default=0)
    player_1_position = models.IntegerField(default=160)
    player_2_position = models.IntegerField(default=160)

    # Ball state
    ball_x_position = models.IntegerField(default=290)
    ball_y_position = models.IntegerField(default=190)
    ball_x_direction = models.IntegerField(default=3)
    ball_y_direction = models.IntegerField(default=3)

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
                "player_1_score": self.player_1_score,
                "player_2_score": self.player_2_score,
                "player_1_position": self.player_1_position,
                "player_2_position": self.player_2_position,
                "ball_x_position": self.ball_x_position,
                "ball_y_position": self.ball_y_position,
                "ball_x_direction": self.ball_x_direction,
                "ball_y_direction": self.ball_y_direction,
                "game_height": self.game_height,
                "game_width": self.game_width,
                "paddle_height": self.paddle_height,
                "paddle_width": self.paddle_width,
            }
            cache.set(cache_key, json.dumps(game_state_data), timeout=None)
            logger.info(f"Saved game state to cache with key {cache_key}")
        else:
            super().save(*args, **kwargs)
            logger.info(f"Saved game state to database with id {self.id}")

    def delete(self, *args, **kwargs):
        if settings.USE_REDIS:
            cache_key = f"game_state_{self.id}"
            cache.delete(cache_key)
            logger.info(f"Deleted game state from cache with key {cache_key}")
        super().delete(*args, **kwargs)

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
            f"With direction:\n"
            f"  x: {self.ball_x_direction}\n"
            f"  y: {self.ball_y_direction}\n"
            f"Player 1 at position: {self.player_1_name} (ID: {self.player_1_id}, Position: {self.player_1_position}, Score: {self.player_1_score})\n"
            f"Player 2 at position: {self.player_2_name} (ID: {self.player_2_id}, Position: {self.player_2_position}, Score: {self.player_2_score})"
        )

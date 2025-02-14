import msgpack
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
    game_height = models.IntegerField(default=400)
    game_width = models.IntegerField(default=600)
    paddle_height = models.IntegerField(default=80)
    paddle_width = models.IntegerField(default=15)
    paddle_offset = models.IntegerField(default=20)
    move_step = models.IntegerField(default=10)

    # Players
    player_1_id = models.IntegerField(null=True, blank=True)
    player_2_id = models.IntegerField(null=True, blank=True)
    player_1_name = models.CharField(max_length=100, default="Player 1")
    player_2_name = models.CharField(max_length=100, default="Player 2")
    player_1_score = models.IntegerField(default=0)
    player_2_score = models.IntegerField(default=0)
    player_1_position = models.FloatField(default=160)
    player_2_position = models.FloatField(default=160)

    # Ball state
    ball_radius = models.IntegerField(default=10)
    ball_x_position = models.FloatField(default=290)
    ball_y_position = models.FloatField(default=190)
    ball_x_direction = models.FloatField(default=3)
    ball_y_direction = models.FloatField(default=3)
    ball_speed = models.FloatField(default=12)

    objects = GameStateManager()

    def save(self, *args, **kwargs):
        if not self.id:
            logger.warning("Attempting to save model with no id!")
        cache_key = f"{self.id}"
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
            "ball_speed": self.ball_speed,
            "ball_x_direction": self.ball_x_direction,
            "ball_y_direction": self.ball_y_direction,
            "ball_radius": self.ball_radius,
            "game_height": self.game_height,
            "game_width": self.game_width,
            "paddle_height": self.paddle_height,
            "paddle_width": self.paddle_width,
            "paddle_offset": self.paddle_offset,
            "move_step": self.move_step,
        }
        packed_data = msgpack.packb(game_state_data)
        cache.set(cache_key, packed_data, timeout=None)
        logger.info(f"Saved game state to cache with key {cache_key}")

    def delete(self, *args, **kwargs):
        if settings.USE_REDIS:
            cache_key = f"{self.id}"
            cache.delete(cache_key)
            logger.info(f"Deleted game state from cache with key {cache_key}")

    @classmethod
    def from_cache(cls, game_id):
        cache_key = f"{game_id}"
        packed_data = cache.get(cache_key)
        if packed_data:
            game_state_data = msgpack.unpackb(packed_data, raw=False)
            return cls(**game_state_data)
        return None

    def __str__(self) -> str:
        return (
            "game_state_data = {\n"
            f'    "id": {self.id},\n'
            f'    "max_score": {self.max_score},\n'
            f'    "is_game_running": {self.is_game_running},\n'
            f'    "is_game_ended": {self.is_game_ended},\n'
            f'    "player_1_id": {self.player_1_id},\n'
            f'    "player_2_id": {self.player_2_id},\n'
            f'    "player_1_name": {self.player_1_name},\n'
            f'    "player_2_name": {self.player_2_name},\n'
            f'    "player_1_score": {self.player_1_score},\n'
            f'    "player_2_score": {self.player_2_score},\n'
            f'    "player_1_position": {self.player_1_position},\n'
            f'    "player_2_position": {self.player_2_position},\n'
            f'    "ball_x_position": {self.ball_x_position},\n'
            f'    "ball_y_position": {self.ball_y_position},\n'
            f'    "ball_speed": {self.ball_speed},\n'
            f'    "ball_x_direction": {self.ball_x_direction},\n'
            f'    "ball_y_direction": {self.ball_y_direction},\n'
            f'    "ball_radius": {self.ball_radius},\n'
            f'    "game_height": {self.game_height},\n'
            f'    "game_width": {self.game_width},\n'
            f'    "paddle_height": {self.paddle_height},\n'
            f'    "paddle_width": {self.paddle_width},\n'
            f'    "paddle_offset": {self.paddle_offset},\n'
            "}"
        )

from rest_framework import serializers
from .models import GameState, GamePlayer


class GamePlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = GamePlayer
        fields = (
            "player",
            "player_position",
            "player_direction",
            "player_score",
        )


class GameStateSerializer(serializers.ModelSerializer):
    players = GamePlayerSerializer(many=True, read_only=True)

    class Meta:
        model = GameState
        fields = (
            "id",
            "max_score",
            "is_game_running",
            "is_game_ended",
            "players",
            "ball_x_position",
            "ball_y_position",
            "ball_x_velocity",
            "ball_y_velocity",
        )

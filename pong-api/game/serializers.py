from rest_framework import serializers

from .models import GameState


class GameStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameState
        fields = (
            "id",
            "player_1_position",
            "player_1_direction",
            "player_2_position",
            "player_2_direction",
            "ball_x_position",
            "ball_y_position",
            "ball_x_velocity",
            "ball_y_velocity",
        )

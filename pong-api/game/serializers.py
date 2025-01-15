from rest_framework import serializers
from .models import GameState


class GameStateSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=True)

    class Meta:
        model = GameState
        fields = (
            "id",
            "max_score",
            "is_game_running",
            "is_game_ended",
            "player_1_id",
            "player_2_id",
            "player_1_name",
            "player_2_name",
            "ball_x_position",
            "ball_y_position",
            "ball_x_velocity",
            "ball_y_velocity",
        )

    def validate(self, data):
        if "player_1_id" not in data or "player_2_id" not in data:
            raise serializers.ValidationError(
                "Both player_1_id and player_2_id are required."
            )
        if "player_1_name" not in data or "player_2_name" not in data:
            raise serializers.ValidationError(
                "Both player_1_name and player_2_name are required."
            )
        return data

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
            "player_1_position",
            "player_2_position",
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

    def create(self, validated_data):
        validated_data.setdefault("ball_x_position", 400)
        validated_data.setdefault("ball_y_position", 200)
        validated_data.setdefault("ball_x_velocity", 10)
        validated_data.setdefault("ball_y_velocity", 10)
        validated_data.setdefault("player_1_position", 50)  # Default middle position
        validated_data.setdefault("player_2_position", 50)  # Default middle position
        return super().create(validated_data)

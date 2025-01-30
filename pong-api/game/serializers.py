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
            "player_1_score",
            "player_2_score",
            "player_1_position",
            "player_2_position",
            "ball_x_position",
            "ball_y_position",
            "ball_x_direction",
            "ball_y_direction",
            "ball_speed",
            "ball_radius",
            "game_height",
            "game_width",
            "paddle_height",
            "paddle_width",
            "paddle_offset",
            "move_step",
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
        validated_data.setdefault(
            "ball_x_position", GameState._meta.get_field("ball_x_position").default
        )
        validated_data.setdefault(
            "ball_y_position", GameState._meta.get_field("ball_y_position").default
        )
        validated_data.setdefault(
            "ball_speed", GameState._meta.get_field("ball_speed").default
        )
        validated_data.setdefault(
            "ball_radius", GameState._meta.get_field("ball_radius").default
        )
        validated_data.setdefault(
            "ball_x_direction", GameState._meta.get_field("ball_x_direction").default
        )
        validated_data.setdefault(
            "ball_y_direction", GameState._meta.get_field("ball_y_direction").default
        )
        validated_data.setdefault(
            "player_1_position", GameState._meta.get_field("player_1_position").default
        )
        validated_data.setdefault(
            "player_2_position", GameState._meta.get_field("player_2_position").default
        )
        validated_data.setdefault(
            "player_1_score", GameState._meta.get_field("player_1_score").default
        )
        validated_data.setdefault(
            "player_2_score", GameState._meta.get_field("player_2_score").default
        )
        validated_data.setdefault(
            "game_height", GameState._meta.get_field("game_height").default
        )
        validated_data.setdefault(
            "game_width", GameState._meta.get_field("game_width").default
        )
        validated_data.setdefault(
            "paddle_height", GameState._meta.get_field("paddle_height").default
        )
        validated_data.setdefault(
            "paddle_width", GameState._meta.get_field("paddle_width").default
        )
        validated_data.setdefault(
            "paddle_offset", GameState._meta.get_field("paddle_offset").default
        )
        validated_data.setdefault(
            "move_step", GameState._meta.get_field("move_step").default
        )
        return super().create(validated_data)

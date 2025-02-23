from rest_framework import serializers
from django.db import models
from .models import Player, FinishedGame


class PlayerSerializer(serializers.ModelSerializer):
    win_ratio = serializers.SerializerMethodField()
    games_played = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = [
            "player_id",
            "games_won",
            "games_lost",
            "points_scored",
            "points_conceded",
            "total_time_played",
            "win_ratio",
            "games_played",
        ]

    def get_win_ratio(self, obj):
        total_games = obj.games_won + obj.games_lost
        return obj.games_won / total_games if total_games > 0 else 0

    def get_games_played(self, obj):
        games = FinishedGame.objects.filter(
            models.Q(player_1_id=obj.player_id) | models.Q(player_2_id=obj.player_id)
        )
        return FinishedGameSerializer(games, many=True).data


class FinishedGameSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinishedGame
        fields = "__all__"

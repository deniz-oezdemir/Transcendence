from rest_framework import serializers
from .models import Player, FinishedGame


class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = "__all__"


class FinishedGameSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinishedGame
        fields = "__all__"

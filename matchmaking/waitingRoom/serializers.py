from rest_framework import serializers
from .models import Match

class GameResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ['winner_id', 'player_1_score', 'player_2_score', 'start_time', 'end_time']

    def validate(self, data):
        if 'winner_id' not in data:
            raise serializers.ValidationError("winner_id is required")
        return data

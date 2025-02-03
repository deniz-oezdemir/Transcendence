from rest_framework import serializers
from .models import Match

class GameResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ['winner_id']

    def validate(self, data):
        if 'winner_id' not in data:
            raise serializers.ValidationError("winner_id is required")
        return data

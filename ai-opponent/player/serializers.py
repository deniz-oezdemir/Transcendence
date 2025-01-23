from rest_framework import serializers
from .models import AIPlayer


class AIPlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIPlayer
        fields = ("ai_player_id", "target_game_id")

        def validated_data(self):
            pass

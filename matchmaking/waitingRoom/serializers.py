from rest_framework import serializers
from .models import Match

class GameResultSerializer(serializers.ModelSerializer):
	class Meta:
		model = Match
		fields = [
			'winner_id',
			'player1_score',
			'player2_score',
			'start_time',
			'end_time'
		]

	def validate(self, data):
		required_fields = [
			'winner_id',
			'player1_score',
			'player2_score',
			'start_time',
			'end_time'
		]
		for field in required_fields:
			if field not in data:
				raise serializers.ValidationError(f"{field} is required")
		return data

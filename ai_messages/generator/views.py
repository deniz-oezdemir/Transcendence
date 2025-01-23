from django.shortcuts import render

# Create your views here.

from rest_framework.views import APIView
from rest_framework.response import Response
from .services import AIMessageGenerator

class GenerateMessage(APIView):
    def __init__(self):
        self.generator = AIMessageGenerator()
        super().__init__()

    def post(self, request):
        game_context = request.data.get('game_context', '')
        message_type = request.data.get('type', 'game_start')

        prompts = {
            'game_start': f"AI player starting game: {game_context}",
            'score': f"AI player reacting to score: {game_context}",
            'game_end': f"AI player after game: {game_context}"
        }

        message = self.generator.generate_message(prompts[message_type])
        return Response({'message': message})

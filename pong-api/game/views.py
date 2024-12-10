from rest_framework import generics
from .serializers import GameStateSerializer
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import GameState
from .engine.pong_game_engine import PongGameEngine


class CreateGame(generics.CreateAPIView):
    queryset = GameState.objects.all()
    serializer_class = GameStateSerializer

    def perform_create(self, serializer):
        # Initialize the game state with default values
        serializer.save()


class GetGameState(generics.RetrieveAPIView):
    queryset = GameState.objects.all()
    serializer_class = GameStateSerializer

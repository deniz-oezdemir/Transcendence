from rest_framework import generics
from .serializers import GameStateSerializer
from .models import GameState


class CreateGame(generics.CreateAPIView):
    queryset = GameState.objects.all()
    serializer_class = GameStateSerializer

    def perform_create(self, serializer):
        # Initialize the game state with default values
        serializer.save()


class GetGameState(generics.RetrieveAPIView):
    queryset = GameState.objects.all()
    serializer_class = GameStateSerializer
    lookup_field = "id"

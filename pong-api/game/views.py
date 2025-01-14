from rest_framework import generics, status
from rest_framework.response import Response
from django.core.cache import cache
from .serializers import GameStateSerializer
from .models import GameState


class CreateGame(generics.CreateAPIView):
    queryset = GameState.objects.all()
    serializer_class = GameStateSerializer

    def perform_create(self, serializer):
        # Initialize the game state with default values
        serializer.save()  # TODO: remove save to sqlite db

        # Validate the data without saving to the database
        validated_data = serializer.validated_data

        game_state = GameState(
            **validated_data
        )  # TODO: check GameState class for constructors

        cache_key = f"game_state_{game_state.id}"
        cache.set(
            cache_key, game_state, timeout=3600
        )  # TODO: check cache duration. 1 hour for now


class ToggleGame(generics.UpdateAPIView):
    queryset = GameState.objects.all()
    serializer_class = GameStateSerializer
    lookup_field = "id"

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_game_running = not instance.is_game_running
        instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GetGameState(generics.RetrieveAPIView):
    queryset = GameState.objects.all()
    serializer_class = GameStateSerializer
    lookup_field = "id"

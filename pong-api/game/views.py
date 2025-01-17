import json
from rest_framework import generics, serializers
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from django.conf import settings
from .serializers import GameStateSerializer
from .models import GameState
import logging

logger = logging.getLogger(__name__)


class CreateGame(generics.CreateAPIView):
    serializer_class = GameStateSerializer

    def perform_create(self, serializer):
        game_id = serializer.validated_data.get("id")
        if GameState.from_cache(game_id):
            raise serializers.ValidationError("Game with this ID already exists.")
        game_state = serializer.save()
        return game_state

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        game_state = self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            GameStateSerializer(game_state).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )


class ToggleGame(generics.UpdateAPIView):
    serializer_class = GameStateSerializer
    lookup_field = "id"

    def update(self, request, *args, **kwargs):
        game_id = kwargs["id"]
        game_state = GameState.from_cache(game_id)

        if not game_state:
            # If not found in cache, try to get it from the database
            game_state = get_object_or_404(GameState, id=game_id)

        game_state.is_game_running = not game_state.is_game_running
        game_state.save()
        logger.info(
            f"Toggled game state for game_id {game_id}. New state: {game_state.is_game_running}"
        )
        return Response(
            {"is_game_running": game_state.is_game_running}, status=status.HTTP_200_OK
        )


class DeleteGame(generics.DestroyAPIView):
    queryset = GameState.objects.all()
    lookup_field = "id"

    def perform_destroy(self, instance):
        cache.delete(f"game_state:{instance.id}")
        logger.info(f"Deleted game state for game_id {instance.id} from cache.")
        # Delete from the database
        # super().perform_destroy(instance)

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class GetGameState(generics.RetrieveAPIView):
    serializer_class = GameStateSerializer
    lookup_field = "id"

    def perform_create(self, serializer):
        game_id = serializer.validated_data.get("id")
        if not GameState.from_cache(game_id):
            raise serializers.ValidationError("Game with this ID does not exist.")
        game_state = serializer.save()
        return game_state

    def get_object(self):
        if settings.USE_REDIS:
            cache_key = f"game_state_{self.kwargs[self.lookup_field]}"
            game_state = cache.get(cache_key)
            if game_state is None:
                raise serializers.ValidationError("Game state not found in Redis.")
            if isinstance(game_state, str):
                game_state = json.loads(game_state)
            return GameState(**game_state)
        else:
            return super().get_object()

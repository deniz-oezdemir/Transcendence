from .models import AIPlayer
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics, serializers
from django.core.cache import cache
from .serializers import AIPlayerSerializer
import logging
from .consumers import WebSocketClient

logger = logging.getLogger("AIOpponent")


class CreateAIPlayer(generics.CreateAPIView):
    serializer_class = AIPlayerSerializer

    def perform_create(self, serializer):
        ai_player_id = serializer.validated_data.get("ai_player_id")
        target_game_id = serializer.validated_data.get("target_game_id")
        cache_key = f"ai_player_{ai_player_id}"

        # Check if the player exists in Redis
        if cache.get(cache_key):
            raise serializers.ValidationError(
                f"Player with ai_player_id {ai_player_id} already exists in cache."
            )
        ai_player = serializer.save()

        # Connect to the WebSocket server
        # try:
        #     ws_client = WebSocketClient(
        #         f"ws://localhost:8001/ws/game/{target_game_id}/", ai_player
        #     )  # TODO: chech the uri
        #     ws_client.start()
        #     logger.info(
        #         f"Successfully connected to WebSocket for game {target_game_id}"
        #     )
        # except Exception as e:
        #     logger.error(
        #         f"Failed to connect to WebSocket for game {target_game_id}: {e}"
        #     )

        return ai_player

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ai_player = self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        return Response(
            AIPlayerSerializer(ai_player).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )


class DeleteAIPlayer(generics.DestroyAPIView):
    def delete(self, request, player_id):
        try:
            logger.info(f"Attempting to delete AI Player with id {player_id}")
            ai_player = AIPlayer.from_cache(player_id)
            if not ai_player:
                ai_player = AIPlayer.objects.get(ai_player_id=player_id)
            ai_player.delete()
            logger.info(f"Successfully deleted AI Player with id {player_id}")
            return Response({"detail": "AI Player deleted."}, status=status.HTTP_200_OK)
        except AIPlayer.DoesNotExist:
            logger.warning(f"No AI player matches the given query for id {player_id}")
            return Response(
                {"detail": "No AI player matches the given query."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(f"Error deleting AI Player with id {player_id}: {e}")
            return Response(
                {
                    "detail": "An error occurred while attempting to delete the AI Player."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

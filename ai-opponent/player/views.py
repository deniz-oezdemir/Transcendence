from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import AIPlayer
from .serializers import AIPlayerSerializer
from .consumers import SocketIOClient


class CreateAIPlayer(APIView):
    def post(self, request):
        serializer = AIPlayerSerializer(data=request.data)
        if serializer.is_valid():
            ai_player = serializer.save()
            client = SocketIOClient(
                uri=f"ws://pong-api:8000/ws/game/{ai_player.target_game_id}/",
                ai_player=ai_player,
            )
            connection_error = client.start()
            if connection_error:
                return Response(
                    {"error": "Failed to connect to WebSocket"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteAIPlayer(APIView):
    def delete(self, request, player_id):
        try:
            ai_player = AIPlayer.objects.get(ai_player_id=player_id)
            ai_player.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except AIPlayer.DoesNotExist:
            return Response(
                {"error": "AI Player not found"}, status=status.HTTP_404_NOT_FOUND
            )


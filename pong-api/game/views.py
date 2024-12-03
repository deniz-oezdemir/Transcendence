from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response


from .serializers import GameStateSerializer
from .engine.game_logic import PongGameEngine
from .models import GameState


class GetGameState(generics.RetrieveAPIView):
    queryset = GameState.objects.all()
    serializer_class = GameInstanceSerializer


class PostGameState(APIView):
    def post(self, request, *args, **kwargs):
        game_state = GameState.objects.get(pk=kwargs["pk"])
        player_id = request.data.get("player_id")
        direction = request.data.get("direction")

        if player_id is None or direction is None:
            return Response(
                {"error": "player_id and direction are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        game_engine = PongGameEngine(game_state)
        game_engine.move_player(player_id, direction)
        game_engine.update_game_state()
        game_state.save()

        serializer = GameStateSerializer(game_state)
        return Response(serializer.data, status=status.HTTP_200_OK)

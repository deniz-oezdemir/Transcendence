from rest_framework import generics
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import FinishedGame, Player
from .serializers import FinishedGameSerializer, PlayerSerializer


class FinishedGameCreateView(generics.CreateAPIView):
    queryset = FinishedGame.objects.all()
    serializer_class = FinishedGameSerializer


class FinishedGameDetailView(generics.RetrieveAPIView):
    queryset = FinishedGame.objects.all()
    serializer_class = FinishedGameSerializer


@api_view(["GET"])
def get_games_by_player(request, player_id):
    player = Player.objects.get(player_id=player_id)
    serializer = PlayerSerializer(player)
    return Response(serializer.data)


@api_view(["GET"])
def top_ten_winners(request):
    players = Player.objects.all().order_by("-win_ratio")[:10]
    serializer = PlayerSerializer(players, many=True)
    return Response(serializer.data)

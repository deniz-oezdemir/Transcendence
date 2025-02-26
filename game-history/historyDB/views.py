import logging
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from .models import FinishedGame, Player
from .serializers import FinishedGameSerializer, PlayerSerializer

logger = logging.getLogger(__name__)


class FinishedGameCreateView(generics.CreateAPIView):
    queryset = FinishedGame.objects.all()
    serializer_class = FinishedGameSerializer

    def create(self, request, *args, **kwargs):
        logger.debug("Creating a new finished game")
        response = super().create(request, *args, **kwargs)
        logger.info("Finished game created successfully")
        return response

class FinishedGameDetailView(generics.RetrieveAPIView):
    queryset = FinishedGame.objects.all()
    serializer_class = FinishedGameSerializer
    lookup_field = 'game_id'

    def get_object(self):
        game_id = self.kwargs.get('pk')
        logger.debug(f"Looking up finished game with game_id: {game_id}")
        return get_object_or_404(FinishedGame, game_id=game_id)

    def retrieve(self, request, *args, **kwargs):
        try:
            response = super().retrieve(request, *args, **kwargs)
            logger.info(f"Successfully retrieved game with game_id: {kwargs.get('pk')}")
            return response
        except Exception as e:
            logger.error(f"Error retrieving game: {str(e)}")
            raise


@api_view(["GET"])
def get_games_by_player(request, player_id):
    logger.debug(f"Fetching games for player with id: {player_id}")
    player = get_object_or_404(Player, player_id=player_id)
    serializer = PlayerSerializer(player)
    logger.info(f"Games for player {player_id} fetched successfully")
    return Response(serializer.data)


@api_view(["GET"])
def top_ten_winners(request):
    logger.debug("Fetching top ten players by win ratio")
    players = Player.objects.all().order_by("-win_ratio")[:10]
    serializer = PlayerSerializer(players, many=True)
    logger.info("Top ten players fetched successfully")
    return Response(serializer.data)

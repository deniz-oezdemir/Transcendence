from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Match
from .serializers import GameResultSerializer
import logging


@api_view(["POST"])
def update_game_result(request, match_id):
    logger = logging.getLogger(__name__)
    match = get_object_or_404(Match, match_id=match_id)

    if match.status == Match.FINISHED:
        return Response(
            {"error": "Match already finished"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Validate winner_id is one of the players
    winner_id = request.data.get("winner_id")
    if winner_id not in [match.player_1_id, match.player_2_id]:
        return Response(
            {"error": "Winner must be one of the players in the match"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = GameResultSerializer(match, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save(status=Match.FINISHED)
        return Response(
            {"message": f"Match {match_id} result updated successfully"},
            status=status.HTTP_200_OK,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

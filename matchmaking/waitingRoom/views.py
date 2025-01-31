from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Match, Tournament
from .serializers import GameResultSerializer


@api_view(["POST"])
def update_game_result(request, match_id):
    match = get_object_or_404(Match, match_id=match_id)

    if match.status == Match.FINISHED:
        return Response(
            {"error": "Match already finished"}, status=status.HTTP_400_BAD_REQUEST
        )

    winner_id = request.data.get("winner_id")
    if winner_id not in [match.player_1_id, match.player_2_id]:
        return Response(
            {"error": "Winner must be one of the players"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # If this is a tournament match, handle tournament progression
    if match.tournament_id:
        tournament = Tournament.objects.get(tournament_id=match.tournament_id)
        current_round = match.round

        # Update the current match
        serializer = GameResultSerializer(match, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(status=Match.FINISHED)

        # Check if all matches in current round are finished
        round_matches = Match.objects.filter(
            tournament_id=tournament.tournament_id, round=current_round
        )
        if all(m.status == Match.FINISHED for m in round_matches):
            # Create next round matches
            winners = [m.winner_id for m in round_matches]

            if current_round < len(tournament.matches):
                # Create matches for next round
                new_matches = []
                for i in range(0, len(winners), 2):
                    if i + 1 < len(winners):
                        new_match = Match.objects.create(
                            tournament_id=tournament.tournament_id,
                            player_1_id=winners[i],
                            player_2_id=winners[i + 1],
                            round=current_round + 1,
                            status=Match.ACTIVE,
                        )
                        new_matches.append(new_match.match_id)

                # Update tournament matches structure
                tournament.matches[current_round]["matches"] = new_matches
                tournament.save()

            # If this was the final round, update tournament
            if current_round == len(tournament.matches):
                tournament.status = Tournament.FINISHED
                tournament.winner_id = winner_id
                tournament.save()

        return Response({"message": "Match result updated"}, status=status.HTTP_200_OK)

    # For non-tournament matches, just update the result
    serializer = GameResultSerializer(match, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save(status=Match.FINISHED)
        return Response({"message": "Match result updated"}, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

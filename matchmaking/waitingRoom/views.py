import logging
import aiohttp
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from asgiref.sync import async_to_sync
from .models import Match, Tournament
from .serializers import GameResultSerializer

logger = logging.getLogger(__name__)

async def create_game_in_pong_api(match):
    """Creates a game in the pong-api service"""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                'http://pong-api:8000/game/create_game/',
                json={
                    "id": match.match_id,
                    "max_score": 1,  # Configure as needed
                    "player_1_id": match.player_1_id,
                    "player_1_name": f"Player {match.player_1_id}",
                    "player_2_id": match.player_2_id,
                    "player_2_name": f"Player {match.player_2_id}"
                }
            ) as response:
                if response.status != 201:
                    logger.error(f"Failed to create game in pong-api: {await response.text()}")
                    return False
                return True
        except Exception as e:
            logger.error(f"Error creating game in pong-api: {e}")
            return False

@api_view(["POST"])
def update_game_result(request, match_id):
    logger.info(f"Received request to update game result for match_id: {match_id}")
    match = get_object_or_404(Match, match_id=match_id)

    if match.status == Match.FINISHED:
        logger.warning(f"Match {match_id} already finished")
        return Response(
            {"error": "Match already finished"}, status=status.HTTP_400_BAD_REQUEST
        )

    winner_id = request.data.get("winner_id")
    if winner_id not in [match.player_1_id, match.player_2_id]:
        logger.error(f"Invalid winner_id: {winner_id} for match {match_id}")
        return Response(
            {"error": "Winner must be one of the players"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # If this is a tournament match, handle tournament progression
    if match.tournament_id:
        logger.info(f"Handling tournament progression for match {match_id}")
        tournament = Tournament.objects.get(tournament_id=match.tournament_id)
        current_round = match.round

        # Update the current match
        serializer = GameResultSerializer(match, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(status=Match.FINISHED)
            logger.info(f"Match {match_id} updated successfully")

        # Check if all matches in current round are finished
        round_matches = Match.objects.filter(
            tournament_id=tournament.tournament_id, round=current_round
        )
        if all(m.status == Match.FINISHED for m in round_matches):
            logger.info(f"All matches in round {current_round} are finished")
            # Create next round matches
            winners = [m.winner_id for m in round_matches]

            if current_round < len(tournament.matches):
                logger.info(f"Creating matches for next round {current_round + 1}")
                # Create matches for next round
                new_matches = []
                for i in range(0, len(winners), 2):
                    if i + 1 < len(winners):
                        logger.info(f"Creating new match between winner {winners[i]} and winner {winners[i + 1]}")
                        new_match = Match.objects.create(
                            tournament_id=tournament.tournament_id,
                            player_1_id=winners[i],
                            player_2_id=winners[i + 1],
                            round=current_round + 1,
                            status=Match.ACTIVE,
                        )
                        new_matches.append(new_match.match_id)
                        logger.info(f"Created new match {new_match.match_id} for round {current_round + 1}")

                        # Create game in pong-api for the new match
                        success = async_to_sync(create_game_in_pong_api)(new_match)
                        if not success:
                            logger.error(f"Failed to create game in pong-api for match {new_match.match_id}")

                # Update tournament matches structure
                tournament.matches[current_round]["matches"] = new_matches
                tournament.save()
                logger.info(f"Tournament {tournament.tournament_id} updated with new matches for round {current_round + 1}")

            # If this was the final round, update tournament
            if current_round == len(tournament.matches):
                tournament.status = Tournament.FINISHED
                tournament.winner_id = winner_id
                tournament.save()
                logger.info(f"Tournament {tournament.tournament_id} finished with winner {winner_id}")

        return Response({"message": "Match result updated"}, status=status.HTTP_200_OK)

    # For non-tournament matches, just update the result
    serializer = GameResultSerializer(match, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save(status=Match.FINISHED)
        logger.info(f"Non-tournament match {match_id} updated successfully")
        return Response({"message": "Match result updated"}, status=status.HTTP_200_OK)

    logger.error(f"Failed to update match {match_id}: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

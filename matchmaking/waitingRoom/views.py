import logging
import aiohttp
import asyncio
import datetime
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from asgiref.sync import async_to_sync
from .models import Match, Tournament
from .serializers import GameResultSerializer
from django.utils.dateparse import parse_datetime
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)


async def delay_half_second():
    await asyncio.sleep(0)  # 500ms delay


async def create_game_in_pong_api(match):
    """Creates a game in the pong-api service"""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                "http://pong-api:8000/game/create_game/",
                json={
                    "id": match.match_id,
                    "max_score": 2,
                    "player_1_id": match.player_1_id,
                    "player_1_name": f"Player {match.player_1_name}",
                    "player_2_id": match.player_2_id,
                    "player_2_name": f"Player {match.player_2_name}",
                },
            ) as response:
                if response.status != 201:
                    logger.error(
                        f"Failed to create game in pong-api: {await response.text()}"
                    )
                    return False
                logger.info(f"Successfully created game {match.match_id} in pong-api")
                return True
        except Exception as e:
            logger.error(f"Error creating game in pong-api: {e}")
            return False


async def send_match_to_history(match):
    """Sends finished match data to the game history service"""
    logger.info(f"Attempting to send match {match.match_id} to history service")
    logger.debug(
        f"Match data: player1={match.player_1_id}, player2={match.player_2_id}, "
        f"score={match.player_1_score}-{match.player_2_score}, winner={match.winner_id}"
    )

    async with aiohttp.ClientSession() as session:
        try:
            # Log initial timestamp data
            logger.debug(
                f"Raw timestamps: start={match.start_time} ({type(match.start_time)}), "
                f"end={match.end_time} ({type(match.end_time)})"
            )

            # Convert string dates to datetime if needed
            start_time = match.start_time
            end_time = match.end_time

            if isinstance(start_time, str):
                start_time = parse_datetime(start_time)
                logger.debug(f"Parsed start_time from string to: {start_time}")
            if isinstance(end_time, str):
                end_time = parse_datetime(end_time)
                logger.debug(f"Parsed end_time from string to: {end_time}")

            payload = {
                "game_id": match.match_id,
                "player_1_id": match.player_1_id,
                "player_2_id": match.player_2_id,
                "player_1_score": match.player_1_score,
                "player_2_score": match.player_2_score,
                "winner_id": match.winner_id,
                "start_time": start_time.isoformat() if start_time else None,
                "end_time": end_time.isoformat() if end_time else None,
            }
            logger.debug(f"Sending payload to history service: {payload}")

            async with session.post(
                "http://game-history:8000/api/finished-game/", json=payload
            ) as response:
                response_text = await response.text()
                logger.debug(
                    f"History service response: status={response.status}, body={response_text}"
                )

                if response.status != 201:
                    logger.error(
                        f"Failed to send match to history. Status: {response.status}"
                    )
                    return False

                logger.info(
                    f"Successfully sent match {match.match_id} to history service"
                )
                return True

        except aiohttp.ClientError as e:
            logger.error(f"Network error sending match to history: {str(e)}")
            return False
        except Exception as e:
            logger.error(
                f"Unexpected error sending match to history: {str(e)}", exc_info=True
            )
            return False


@api_view(["POST"])
def update_game_result(request, match_id):
    # Get channel layer for WebSocket broadcasting
    channel_layer = get_channel_layer()

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

    # Update match with scores and times for both tournament and non-tournament matches
    serializer = GameResultSerializer(match, data=request.data, partial=True)
    if not serializer.is_valid():
        logger.error(f"Failed to update match {match_id}: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save(
        status=Match.FINISHED,
        winner_id=winner_id,
        player_1_score=request.data.get("player_1_score"),
        player_2_score=request.data.get("player_2_score"),
        start_time=request.data.get("start_time"),
        end_time=request.data.get("end_time"),
    )
    logger.info(f"Match {match_id} updated with scores and times")

    # Send match data to history service
    success = async_to_sync(send_match_to_history)(match)
    if not success:
        logger.warning(f"Failed to send match {match_id} to history service")

    serializer.save(
        status=Match.FINISHED,
        winner_id=winner_id,
        player_1_score=request.data.get("player_1_score"),
        player_2_score=request.data.get("player_2_score"),
        start_time=request.data.get("start_time"),
        end_time=request.data.get("end_time"),
    )

    # Broadcast match result to all connected clients
    logger.info(f"Broadcasting match result for match {match.match_id}")
    logger.debug(
        f"Match details - Winner: {winner_id}, "
        f"Score: {match.player_1_score}-{match.player_2_score}, "
        f"Tournament: {match.tournament_id}"
    )

    # Add 1 second delay
    logger.info(
        "[%s] Delaying for 1s before broadcasting match result",
        datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"),
    )
    async_to_sync(asyncio.sleep)(0)
    logger.info(
        "[%s] Delay complete, broadcasting match result",
        datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"),
    )

    async_to_sync(channel_layer.group_send)(
        "waiting_room",
        {
            "type": "match_finished",
            "match_id": match.match_id,
            "winner_id": winner_id,
            "player_1_score": match.player_1_score,
            "player_2_score": match.player_2_score,
            "tournament_id": match.tournament_id,
        },
    )
    logger.info(f"Successfully broadcast match result for match {match.match_id}")

    # Handle tournament progression
    new_matches = []  # Initialize new_matches list
    if match.tournament_id:
        tournament = Tournament.objects.get(tournament_id=match.tournament_id)
        current_round = match.round

        # Get all matches for current round in this tournament
        current_round_matches = Match.objects.filter(
            tournament_id=tournament.tournament_id, round=current_round
        )

        if all(m.status == Match.FINISHED for m in current_round_matches):
            winners = [m.winner_id for m in current_round_matches]

            if len(winners) >= 2:
                new_matches = create_next_round_matches(
                    tournament, winners, current_round + 1
                )

                if new_matches:
                    tournament.matches[current_round]["matches"] = [
                        m["match_id"] for m in new_matches
                    ]
                    tournament.save()

                    # Get non-tournament matches
                    matches = list(
                        Match.objects.filter(
                            status=Match.ACTIVE,
                            tournament_id__isnull=True,  # Only get non-tournament matches
                        ).values(
                            "match_id",
                            "player_1_id",
                            "player_1_name",
                            "player_2_id",
                            "player_2_name",
                            "status",
                        )
                    )

                    # Get tournaments with their matches
                    tournaments = []
                    for t in Tournament.objects.filter(
                        status__in=[Tournament.PENDING, Tournament.ACTIVE]
                    ):
                        tournament_data = {
                            "tournament_id": t.tournament_id,
                            "creator_id": t.creator_id,
                            "creator_name": t.creator_name,
                            "players": t.players,
                            "player_names": t.player_names,
                            "max_players": t.max_players,
                            "status": t.status,
                            "matches": list(
                                Match.objects.filter(
                                    tournament_id=t.tournament_id,
                                    status__in=[Match.PENDING, Match.ACTIVE],
                                ).values(
                                    "match_id",
                                    "player_1_id",
                                    "player_1_name",
                                    "player_2_id",
                                    "player_2_name",
                                    "status",
                                )
                            ),
                        }
                        tournaments.append(tournament_data)
                        # logger.info("[%s] Delaying for 500ms before broadcasting new tournament round",
                        #           datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"))
                        # asyncio.run(delay_half_second())  # 500ms delay
                        # logger.info("[%s] Delay complete, broadcasting new tournament round",
                        #           datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"))

                    logger.info(
                        "[%s] Delaying for 5s before broadcasting new tournament round",
                        datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"),
                    )
                    async_to_sync(delay_half_second)()  # 5s delay
                    logger.info(
                        "[%s] Delay complete, broadcasting new tournament round",
                        datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"),
                    )

                    logger.info(
                        f"Broadcasting new tournament round for tournament {tournament.tournament_id}"
                    )
                    logger.debug(f"New matches: {new_matches}")
                    logger.debug(
                        f"Current round: {current_round}, Next round: {current_round + 1}"
                    )
                    async_to_sync(channel_layer.group_send)(
                        "waiting_room",
                        {
                            "type": "tournament_round_started",
                            "tournament_id": tournament.tournament_id,
                            "round": current_round + 1,
                            "matches": new_matches,
                            "available_games": {
                                "matches": matches,  # Only non-tournament matches
                                "tournaments": tournaments,  # Tournaments with their matches
                            },
                        },
                    )
                    logger.info(
                        f"Successfully broadcast new tournament round for tournament {tournament.tournament_id}"
                    )
            else:
                # Tournament is finished - similar update needed here
                tournament.status = Tournament.FINISHED
                tournament.winner_id = winner_id
                tournament.save()

                # Get non-tournament matches
                matches = list(
                    Match.objects.filter(
                        status=Match.ACTIVE, tournament_id__isnull=True
                    ).values(
                        "match_id",
                        "player_1_id",
                        "player_1_name",
                        "player_2_id",
                        "player_2_name",
                        "status",
                    )
                )

                # Get tournaments with their matches
                tournaments = []
                for t in Tournament.objects.filter(
                    status__in=[Tournament.PENDING, Tournament.ACTIVE]
                ):
                    tournament_data = {
                        "tournament_id": t.tournament_id,
                        "creator_id": t.creator_id,
                        "creator_name": t.creator_name,
                        "players": t.players,
                        "player_names": t.player_names,
                        "max_players": t.max_players,
                        "status": t.status,
                        "matches": list(
                            Match.objects.filter(
                                tournament_id=t.tournament_id,
                                status__in=[Match.PENDING, Match.ACTIVE],
                            ).values(
                                "match_id",
                                "player_1_id",
                                "player_1_name",
                                "player_2_id",
                                "player_2_name",
                                "status",
                            )
                        ),
                    }
                    tournaments.append(tournament_data)

                winner_name = tournament.player_names.get(str(winner_id))
                async_to_sync(channel_layer.group_send)(
                    "waiting_room",
                    {
                        "type": "tournament_finished",
                        "tournament_id": tournament.tournament_id,
                        "winner_id": winner_id,
                        "winner_name": winner_name,
                        "available_games": {
                            "matches": matches,  # Only non-tournament matches
                            "tournaments": tournaments,  # Tournaments with their matches
                        },
                    },
                )

    return Response({"message": "Match result updated"}, status=status.HTTP_200_OK)


def create_next_round_matches(tournament, winners, next_round):
    """Create matches for the next tournament round"""
    new_matches = []

    # Create matches pairing winners
    for i in range(0, len(winners), 2):
        if i + 1 < len(winners):
            # Get player names from tournament data
            player1_name = tournament.player_names.get(str(winners[i]))
            player2_name = tournament.player_names.get(str(winners[i + 1]))

            match = Match.objects.create(
                tournament_id=tournament.tournament_id,
                round=next_round,
                player_1_id=winners[i],
                player_1_name=player1_name,  # Use name from tournament
                player_2_id=winners[i + 1],
                player_2_name=player2_name,  # Use name from tournament
                status=Match.ACTIVE,
            )

            # Create game in pong API
            success = async_to_sync(create_game_in_pong_api)(match)
            if not success:
                logger.error(
                    f"Failed to create game in pong-api for match {match.match_id}"
                )
                match.delete()  # Delete match if pong API creation fails
                continue

            # Convert Match object to serializable dict
            new_matches.append(
                {
                    "match_id": match.match_id,
                    "player_1_id": match.player_1_id,
                    "player_1_name": player1_name,
                    "player_2_id": match.player_2_id,
                    "player_2_name": player2_name,
                    "round": match.round,
                    "status": match.status,
                }
            )

    return new_matches


@api_view(["POST"])
def delete_all_games(request):
    channel_layer = get_channel_layer()

    # Delete all matches and tournaments
    Match.objects.all().delete()
    Tournament.objects.all().delete()

    # Get fresh empty game state
    matches = list(
        Match.objects.filter(status=Match.ACTIVE).values(
            "match_id",
            "player_1_id",
            "player_1_name",
            "player_2_id",
            "player_2_name",
            "status",
        )
    )
    tournaments = list(
        Tournament.objects.filter(
            status__in=[Tournament.PENDING, Tournament.ACTIVE]
        ).values()
    )

    # Send success message and updated game state
    async_to_sync(channel_layer.group_send)(
        "waiting_room",
        {
            "type": "games_deleted",
            "message": "All games successfully deleted",
            "available_games": {"matches": matches, "tournaments": tournaments},
        },
    )

    return Response({"message": "All games deleted"}, status=status.HTTP_200_OK)

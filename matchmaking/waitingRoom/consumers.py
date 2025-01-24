from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.db import models
from .models import Match
import logging
import json
import aiohttp

logger = logging.getLogger(__name__)


class WaitingRoomConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("waiting_room", self.channel_name)
        await self.accept()
        # Send current matches on connection
        matches = await self.get_all_matches()
        await self.send_json({"type": "match_created", "all_matches": matches})

    # Called when WebSocket disconnects. Removes connection from waiting_room group
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("waiting_room", self.channel_name)

    # Handles incoming WebSocket messages. Processes create_match and join_match requests
    # Validates player status and broadcasts updates to all connections
    async def receive(self, text_data):
        data = json.loads(text_data)

        # Create match
        if data["type"] == "create_match":
            if await self.is_player_in_match(data["player_1_id"]):
                await self.send(
                    text_data=json.dumps(
                        {"type": "error", "message": "Player already in a match"}
                    )
                )
                return

            match = await self.create_match(data["player_1_id"])
            matches = await self.get_all_matches()

            await self.channel_layer.group_send(
                "waiting_room",
                {
                    "type": "match_created",
                    "match_id": match.match_id,
                    "player_1_id": match.player_1_id,
                    "all_matches": matches,
                },
            )

        # Join match
        elif data["type"] == "join_match":
            if await self.is_player_in_match(data["player_2_id"]):
                await self.send(
                    text_data=json.dumps(
                        {"type": "error", "message": "Player already in a match"}
                    )
                )
                return

            match = await self.join_match(data["match_id"], data["player_2_id"])
            if not match:
                await self.send(
                    text_data=json.dumps(
                        {"type": "error", "message": "Match not found or already full"}
                    )
                )
                return

            # Create game in pong-api after match becomes active
            await self.create_pong_game(match)

            matches = await self.get_all_matches()
            await self.channel_layer.group_send(
                "waiting_room",
                {
                    "type": "match_updated",
                    "match_id": match.match_id,
                    "player_1_id": match.player_1_id,
                    "player_2_id": match.player_2_id,
                    "all_matches": matches,
                },
            )

        # Delete all matches - For testing with test_websocket.html
        elif data["type"] == "delete_all_matches":
            await self.delete_all_matches()
            await self.channel_layer.group_send(
                "waiting_room", {"type": "matches_deleted", "all_matches": []}
            )

    # Broadcasts match creation event to all connections in waiting_room group
    # Includes match details and current list of all matches
    async def match_created(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "match_created",
                    "match_id": event["match_id"],
                    "player_1_id": event["player_1_id"],
                    "all_matches": event["all_matches"],
                }
            )
        )

    # Broadcasts match update event when a player joins a match
    # Includes updated match details and current list of all matches
    async def match_updated(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "match_updated",
                    "match_id": event["match_id"],
                    "player_1_id": event["player_1_id"],
                    "player_2_id": event["player_2_id"],
                    "all_matches": event["all_matches"],
                }
            )
        )

    # Broadcasts match deletion event to all connections in waiting_room group
    # Sends empty match list to indicate all matches were deleted
    async def matches_deleted(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "all matches deleted",
                    "all_matches": event["all_matches"],
                }
            )
        )

    # Checks if a player is already in any match (as player 1 or 2)
    # Args: player_id (int)
    # Returns: bool indicating if player is in a match
    @database_sync_to_async
    def is_player_in_match(self, player_id):
        return Match.objects.filter(
            models.Q(player_1_id=player_id) | models.Q(player_2_id=player_id)
        ).exists()

    # Creates a new match with the given player as player 1
    # Args: player_1_id (int)
    # Returns: newly created Match object with PENDING status
    @database_sync_to_async
    def create_match(self, player_1_id):
        return Match.objects.create(
            match_id=Match.objects.count() + 1,
            player_1_id=player_1_id,
            status=Match.PENDING,
        )

    # Adds player 2 to an existing match if available
    # Args: match_id (int), player_2_id (int)
    # Returns: updated Match object or None if match not found/unavailable
    @database_sync_to_async
    def join_match(self, match_id, player_2_id):
        try:
            match = Match.objects.get(
                match_id=match_id, player_2_id__isnull=True, status=Match.PENDING
            )
            match.player_2_id = player_2_id
            match.status = Match.ACTIVE
            match.save()
            return match
        except Match.DoesNotExist:
            return None

    # Creates new Pong game via API when match becomes active
    # Args: match (Match) - the active match to create a game for
    # Posts game data to pong-api and logs result
    async def create_pong_game(self, match):
        """Creates a new game in pong-api when a match becomes active"""
        pong_api_base_url = "http://pong-api:8000/game"

        # 1. Create game
        game_data = {
            "id": match.match_id,
            "max_score": 1,
            "player_1_id": match.player_1_id,
            "player_1_name": f"Player {match.player_1_id}",
            "player_2_id": match.player_2_id,
            "player_2_name": f"Player {match.player_2_id}",
        }

        try:
            async with aiohttp.ClientSession() as session:
                # Create game
                async with session.post(
                    f"{pong_api_base_url}/create_game/", json=game_data
                ) as response:
                    if response.status == 201:
                        logger.info(
                            f"Game created in pong-api for match {match.match_id}"
                        )

                        # 2. Start game by toggling it on - TODO: to be deleted as only for testing, to be done by frontend
                        async with session.put(
                            f"{pong_api_base_url}/toggle_game/{match.match_id}/"
                        ) as toggle_response:
                            if toggle_response.status == 200:
                                logger.info(
                                    f"Game {match.match_id} started successfully"
                                )
                            else:
                                error_text = await toggle_response.text()
                                logger.error(f"Failed to start game: {error_text}")
                    else:
                        error_text = await response.text()
                        logger.error(f"Failed to create game in pong-api: {error_text}")
        except Exception as e:
            logger.error(f"Error creating/starting game in pong-api: {str(e)}")

    # Retrieves all matches from database with their current state
    # Returns: list of dicts containing match details
    @database_sync_to_async
    def get_all_matches(self):
        matches = Match.objects.all()
        return [
            {
                "match_id": m.match_id,
                "player_1_id": m.player_1_id,
                "player_2_id": m.player_2_id,
                "status": m.status,
            }
            for m in matches
        ]

    # Deletes all matches from database
    # Used for testing/cleanup purposes
    @database_sync_to_async
    def delete_all_matches(self):
        Match.objects.all().delete()

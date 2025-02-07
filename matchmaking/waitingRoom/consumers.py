import json
import aiohttp
import logging
from django.conf import settings
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Match, Tournament

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

class WaitingRoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("waiting_room", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("waiting_room", self.channel_name)

    async def create_game_in_pong_api(self, match):
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
                        print(f"Failed to create game in pong-api: {await response.text()}")
                        return False
                    return True
            except Exception as e:
                print(f"Error creating game in pong-api: {e}")
                return False

    async def create_ai_player(self, match):
        """Creates an AI player in the ai-opponent service"""
        async with aiohttp.ClientSession() as session:
            try:
                logger.debug(f"Creating AI player for match {match.match_id} with AI ID {match.player_2_id}")
                async with session.post(
                    'http://ai-opponent:8000/ai_player/create_ai_player/',
                    json={
                        "ai_player_id": match.player_2_id,
                        "target_game_id": match.match_id
                    }
                ) as response:
                    if response.status != 201:
                        logger.error(f"Failed to create AI player: {await response.text()}")
                        return False
                    logger.debug(f"Successfully created AI player for match {match.match_id}")
                    return True
            except Exception as e:
                logger.error(f"Error creating AI player: {e}")
                return False

    async def receive(self, text_data):
        """
        Called with a decoded WebSocket frame.
        """
        if text_data is None:
            return
        data = json.loads(text_data)

        if data["type"] == "get_games":
            games = await self.get_available_games()
            await self.send(json.dumps({"type": "initial_games", "games": games}))
            return

        # TODO: delete at the end
        elif data["type"] == "delete_all_games":
            await self.delete_all_games()
            available_games = await self.get_available_games()
            await self.channel_layer.group_send(
                "waiting_room",
                {
                    "type": "games_deleted",
                    "available_games": available_games,
                },
            )

        elif data["type"] == "create_match":
            if await self.is_player_in_game(data["player_id"]):
                await self.send_error("Player already in a game")
                return

            match = await self.create_match(data["player_id"])
            available_games = await self.get_available_games()

            await self.channel_layer.group_send(
                "waiting_room",
                {
                    "type": "match_created",
                    "id": match.match_id,
                    "creator_id": match.player_1_id,
                    "available_games": available_games,
                },
            )

        # Join match
        elif data["type"] == "join_match":
            if await self.is_player_in_game(data["player_id"]):
                await self.send_error("Player already in a game")
                return

            match = await self.join_match(data["match_id"], data["player_id"])
            if not match:
                await self.send_error("Match not found or already full")
                return

            # Create game in pong-api after match is joined
            success = await self.create_game_in_pong_api(match)
            if not success:
                await self.send_error("Failed to create game in pong-api")
                return

            available_games = await self.get_available_games()
            await self.channel_layer.group_send(
                "waiting_room",
                {
                    "type": "player_joined",
                    "game_type": "match",
                    "game_id": match.match_id,
                    "player_id": data["player_id"],
                    "available_games": available_games,
                },
            )

        elif data["type"] == "create_tournament":
            if await self.is_player_in_game(data["player_id"]):
                await self.send_error("Player already in a game")
                return

            tournament = await self.create_tournament(
                data["player_id"], data["max_players"]
            )
            available_games = await self.get_available_games()

            await self.channel_layer.group_send(
                "waiting_room",
                {
                    "type": "tournament_created",
                    "id": tournament.tournament_id,
                    "creator_id": tournament.creator_id,
                    "available_games": available_games,
                },
            )

        elif data["type"] == "join_tournament":
            if await self.is_player_in_game(data["player_id"]):
                await self.send_error("Player already in a game")
                logger.debug(f"Player {data['player_id']} already in a game")
                return

            success = await self.join_tournament(data["tournament_id"], data["player_id"])
            if not success:
                await self.send_error("Tournament not found or already full")
                logger.debug(f"Tournament {data['tournament_id']} not found or already full")
                return

            available_games = await self.get_available_games()
            tournament = await self.get_tournament(data["tournament_id"])

            if len(tournament.players) == tournament.max_players:
                matches, created_matches = await self.create_tournament_matches(tournament)
                logger.debug(f"Tournament {tournament.tournament_id} is full. Matches created: {matches}")
                # Create games in pong-api
                await self.create_tournament_matches_in_pong_api(created_matches)
                await self.channel_layer.group_send(
                    "waiting_room",
                    {
                    "type": "tournament_started",
                    "tournament_id": tournament.tournament_id,
                    "matches": matches,
                    "available_games": available_games,
                    },
                )
            else:
                logger.debug(f"Player {data['player_id']} joined tournament {tournament.tournament_id}")
                await self.channel_layer.group_send(
                    "waiting_room",
                    {
                    "type": "player_joined",
                    "game_type": "tournament",
                    "game_id": tournament.tournament_id,
                    "player_id": data["player_id"],
                    "available_games": available_games,
                    },
                )

        elif data["type"] == "create_AI_match":
            if await self.is_player_in_game(data["player_id"]):
                logger.debug(f"Player {data['player_id']} already in a game")
                await self.send_error("Player already in a game")
                return

            match = await self.create_match(data["player_id"], is_ai_opponent=True)
            logger.debug(f"Created AI match {match.match_id} for player {data['player_id']}")

            # Create AI player in ai-opponent service
            logger.debug(f"Creating AI player for match {match.match_id}")
            ai_success = await self.create_ai_player(match)
            logger.debug(f"AI player creation {'succeeded' if ai_success else 'failed'} for match {match.match_id}")
            if not ai_success:
                logger.error(f"Failed to create AI player for match {match.match_id}")
                await self.send_error("Failed to create AI player")
                return

            # Create game in pong-api after AI player is created
            logger.debug(f"Creating game in pong-api for AI match {match.match_id}")
            success = await self.create_game_in_pong_api(match)
            logger.debug(f"Game creation in pong-api {'succeeded' if success else 'failed'} for AI match {match.match_id}")
            if not success:
                logger.error(f"Failed to create AI game in pong-api for match {match.match_id}")
                await self.send_error("Failed to create AI game in pong-api")
                return

            logger.debug(f"Broadcasting AI match creation: match_id={match.match_id}, player={match.player_1_id}, ai={match.player_2_id}")
            available_games = await self.get_available_games()
            await self.channel_layer.group_send(
                "waiting_room",
                {
                    "type": "match_created",
                    "id": match.match_id,
                    "creator_id": match.player_1_id,
                    "is_ai_match": True,
                    "ai_id": match.player_2_id,
                    "available_games": available_games,
                },
            )

    async def games_deleted(self, event):
        await self.send(text_data=json.dumps(event))

    async def match_created(self, event):
        await self.send(text_data=json.dumps(event))

    async def player_joined(self, event):
        await self.send(text_data=json.dumps(event))

    async def tournament_created(self, event):
        await self.send(text_data=json.dumps(event))

    async def tournament_started(self, event):
        await self.send(text_data=json.dumps(event))

    async def send_error(self, message):
        await self.send(text_data=json.dumps({"type": "error", "message": message}))

    @database_sync_to_async
    def create_match(self, player_id, is_ai_opponent=False):
        """Creates a match, optionally against an AI opponent"""
        if is_ai_opponent:
            # Get the next available negative AI ID
            latest_ai_match = Match.objects.filter(player_2_id__lt=0).order_by('player_2_id').first()
            ai_id = -1 if not latest_ai_match else latest_ai_match.player_2_id - 1

            match = Match.objects.create(
                player_1_id=player_id,
                player_2_id=ai_id,
                status=Match.ACTIVE  # AI matches are immediately active
            )
        else:
            match = Match.objects.create(
                player_1_id=player_id,
                status=Match.PENDING
            )
        return match

    @database_sync_to_async
    def join_match(self, match_id, player_id):
        try:
            match = Match.objects.get(match_id=match_id, player_2_id__isnull=True)
            match.player_2_id = player_id
            match.status = Match.ACTIVE
            match.save()
            return match
        except Match.DoesNotExist:
            return False

    @database_sync_to_async
    def create_tournament(self, creator_id, max_players):
        return Tournament.objects.create(
            creator_id=creator_id,
            max_players=max_players,
            players=[creator_id],
            status=Tournament.PENDING,
        )

    @database_sync_to_async
    def join_tournament(self, tournament_id, player_id):
        try:
            tournament = Tournament.objects.get(
                tournament_id=tournament_id, status=Tournament.PENDING
            )
            if len(tournament.players) < tournament.max_players:
                tournament.players.append(player_id)
                tournament.save()
                return tournament
            return None
        except Tournament.DoesNotExist:
            return None

    @database_sync_to_async
    def get_tournament(self, tournament_id):
        return Tournament.objects.get(tournament_id=tournament_id)

    @database_sync_to_async
    def create_tournament_matches(self, tournament):
        matches = []
        players = tournament.players
        created_matches = []

        if tournament.max_players == 4:
            # Create 2 semi-final matches
            semi1 = Match.objects.create(
                player_1_id=players[0],
                player_2_id=players[1],
                tournament_id=tournament.tournament_id,
                round=1,
                status=Match.ACTIVE,
            )
            semi2 = Match.objects.create(
                player_1_id=players[2],
                player_2_id=players[3],
                tournament_id=tournament.tournament_id,
                round=1,
                status=Match.ACTIVE,
            )
            created_matches.extend([semi1, semi2])
            matches = [
                {"round": 1, "matches": [semi1.match_id, semi2.match_id]},
                {"round": 2, "matches": ["final"]},
            ]

        elif tournament.max_players == 8:
            quarters = []
            created_quarter_matches = []  # Store Match objects
            for i in range(0, 8, 2):
                match = Match.objects.create(
                    player_1_id=players[i],
                    player_2_id=players[i + 1],
                    tournament_id=tournament.tournament_id,
                    round=1,
                    status=Match.ACTIVE,
                )
                quarters.append(match.match_id)
                created_quarter_matches.append(match)  # Store the Match object

            created_matches.extend(created_quarter_matches)  # Add all quarter matches to created_matches

            matches = [
                {"round": 1, "matches": quarters},
                {"round": 2, "matches": ["semi1", "semi2"]},  # Two semi-finals
                {"round": 3, "matches": ["final"]},
            ]

        tournament.status = Tournament.ACTIVE
        tournament.matches = matches
        tournament.save()
        return matches, created_matches

    @database_sync_to_async
    def is_player_in_game(self, player_id):
        # Check if player is in a match (either pending or active)
        in_match = (
            Match.objects.filter(status__in=[Match.PENDING, Match.ACTIVE])
            .filter(player_1_id=player_id)
            .exists()
            or Match.objects.filter(status__in=[Match.PENDING, Match.ACTIVE])
            .filter(player_2_id=player_id)
            .exists()
        )

        # Check if player is in a tournament (either pending or active)
        in_tournament = (
            Tournament.objects.filter(
                status__in=[Tournament.PENDING, Tournament.ACTIVE]
            )
            .filter(players__contains=[player_id])
            .exists()
        )

        return in_match or in_tournament

    @database_sync_to_async
    def get_available_games(self):
        matches = list(
            Match.objects.filter(status__in=[Match.PENDING, Match.ACTIVE]).values()
        )

        tournaments = list(
            Tournament.objects.filter(
                status__in=[Tournament.PENDING, Tournament.ACTIVE]
            ).values()
        )
        return {"matches": matches, "tournaments": tournaments}

    @database_sync_to_async
    def delete_all_games(self):
        """Deletes all matches and tournaments"""
        Match.objects.all().delete()
        Tournament.objects.all().delete()

    @database_sync_to_async
    def get_full_game_data(self):
        """Gets all matches and tournaments with complete data"""
        matches = list(Match.objects.all().values())
        tournaments = list(Tournament.objects.all().values())
        return {
            "matches": matches,
            "tournaments": tournaments,
            "available_games": {
                "matches": list(
                    Match.objects.filter(player_2_id__isnull=True).values()
                ),
                "tournaments": list(
                    Tournament.objects.filter(status=Tournament.PENDING).values()
                ),
            },
        }

    async def create_tournament_matches_in_pong_api(self, created_matches):
        """Creates all tournament matches in pong-api"""
        for match in created_matches:
            try:
                # Ensure we have a Match object, not just an ID
                if isinstance(match, str):
                    match = await database_sync_to_async(Match.objects.get)(match_id=match)

                success = await self.create_game_in_pong_api(match)
                if not success:
                    logger.error(f"Failed to create game in pong-api for match {match.match_id}")
            except Exception as e:
                logger.error(f"Error creating game in pong-api: {str(e)}")

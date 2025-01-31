import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Match, Tournament


class WaitingRoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("waiting_room", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("waiting_room", self.channel_name)

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

        elif data["type"] == "join_match":
            if await self.is_player_in_game(data["player_id"]):
                await self.send_error("Player already in a game")
                return

            success = await self.join_match(data["match_id"], data["player_id"])
            if not success:
                await self.send_error("Match not found or already full")
                return

            available_games = await self.get_available_games()
            await self.channel_layer.group_send(
                "waiting_room",
                {
                    "type": "player_joined",
                    "game_type": "match",
                    "game_id": data["match_id"],
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
                return

            success = await self.join_tournament(
                data["tournament_id"], data["player_id"]
            )
            if not success:
                await self.send_error("Tournament not found or already full")
                return

            available_games = await self.get_available_games()
            tournament = await self.get_tournament(data["tournament_id"])

            if len(tournament.players) == tournament.max_players:
                matches = await self.create_tournament_matches(tournament)
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
    def create_match(self, player_id):
        match = Match.objects.create(
            player_1_id=player_id,
        )
        return match

    @database_sync_to_async
    def join_match(self, match_id, player_id):
        try:
            match = Match.objects.get(match_id=match_id, player_2_id__isnull=True)
            match.player_2_id = player_id
            match.status = Match.ACTIVE
            match.save()
            return True
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
            matches = [
                {"round": 1, "matches": [semi1.match_id, semi2.match_id]},
                {"round": 2, "matches": ["final"]},
            ]

        elif tournament.max_players == 6:
            quarters = []
            for i in range(0, 6, 2):
                match = Match.objects.create(
                    player_1_id=players[i],
                    player_2_id=players[i + 1],
                    tournament_id=tournament.tournament_id,
                    round=1,
                    status=Match.ACTIVE,
                )
                quarters.append(match.match_id)

            matches = [
                {"round": 1, "matches": quarters},
                {"round": 2, "matches": ["semi"]},
                {"round": 3, "matches": ["final"]},
            ]

        tournament.status = Tournament.ACTIVE
        tournament.matches = matches
        tournament.save()
        return matches

    @database_sync_to_async
    def is_player_in_game(self, player_id):
        # Check if player is in a match
        in_match = (
            Match.objects.filter(status=Match.PENDING)
            .filter(player_1_id=player_id)
            .exists()
            or Match.objects.filter(status=Match.PENDING)
            .filter(player_2_id=player_id)
            .exists()
        )

        # Check if player is in a tournament
        in_tournament = (
            Tournament.objects.filter(status=Tournament.PENDING)
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

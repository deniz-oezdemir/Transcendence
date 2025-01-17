import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Match

class WaitingRoomConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		await self.channel_layer.group_add("waiting_room", self.channel_name)
		await self.accept()
		# Delete all matches for testing only
		await self.delete_all_matches()

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard("waiting_room", self.channel_name)

	async def receive(self, text_data):
		data = json.loads(text_data)
		if data['type'] == 'create_match':
			# If player is already in a match do not let him create a new match
			if await self.is_player_in_match(data['player_1_id']):
				await self.send(text_data=json.dumps({
					"type": "error",
					"message": "Player already in match"
				}))
				return

			match = await self.create_match(data['player_1_id'])
			matches = await self.get_all_matches()


		await self.channel_layer.group_send(
			"waiting_room",
			{
				"type": "match_created",
				"match_id": match.match_id,
				"player_1_id": match.player_1_id,
				"all_matches": matches
			}
		)

	async def match_created(self, event):
		await self.send(text_data=json.dumps({
			"type": "match_created",
			"match_id": event["match_id"],
			"player_1_id": event["player_1_id"],
			"all_matches": event["all_matches"]
		}))

	@database_sync_to_async
	def is_player_in_match(self, player_id):
		return Match.objects.filter(player_1_id=player_id).exists()

	@database_sync_to_async
	def create_match(self, player_1_id):
		return Match.objects.create(
			match_id=Match.objects.count() + 1,
			player_1_id=player_1_id
		)

	@database_sync_to_async
	def get_all_matches(self):
		matches = Match.objects.all()
		return [{"match_id": m.match_id, "player_1_id": m.player_1_id} for m in matches]

	# Helper function for testing
	@database_sync_to_async
	def delete_all_matches(self):
		Match.objects.all().delete()

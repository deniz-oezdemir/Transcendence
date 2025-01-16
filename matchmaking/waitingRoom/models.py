from django.db import models
import uuid

# Create your models here.

# TODO: check whether match and player ids should be changed to UUID
class Match(models.Model):
	match_id = models.IntegerField(primary_key=True, editable=False)
	player_1_id = models.IntegerField()
	player_2_id = models.IntegerField(null=True)
	created_at = models.DateTimeField(auto_now_add=True)
	def __str__(self):
		return f"Match {self.match_id}: {self.player_1_id} vs {self.player_2_id or 'Waiting'}"

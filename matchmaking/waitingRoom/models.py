from django.db import models

# Create your models here.

# TODO: check whether match and player ids should be changed to UUID
class Match(models.Model):
	PENDING = 'pending'
	ACTIVE = 'active'
	FINISHED = 'finished'

	STATUS_CHOICES = [
		(PENDING, 'Pending'),
		(ACTIVE, 'Active'),
		(FINISHED, 'Finished'),
	]

	match_id = models.BigIntegerField(primary_key=True, editable=False)
	player_1_id = models.BigIntegerField()
	player_2_id = models.BigIntegerField(null=True, blank=True)
	status = models.CharField(
		max_length=10,
		choices=STATUS_CHOICES,
		default=PENDING,
		db_index=True  # Added index for better performance
	)

	winner_id = models.BigIntegerField(null=True, blank=True)
	player1_score = models.IntegerField(default=0)
	player2_score = models.IntegerField(default=0)
	start_time = models.DateTimeField(null=True, blank=True)
	end_time = models.DateTimeField(null=True, blank=True)

	# Defines database indexes for better query performance in Postgres, useful for e.g. is_player_in_match()
	class Meta:
		indexes = [
			models.Index(fields=['player_1_id', 'player_2_id']),
			models.Index(fields=['status'])
		]

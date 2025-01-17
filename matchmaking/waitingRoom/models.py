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

	match_id = models.IntegerField(primary_key=True, editable=False)
	player_1_id = models.IntegerField()
	player_2_id = models.IntegerField(null=True, blank=True)
	status = models.CharField(
		max_length=10,
		choices=STATUS_CHOICES,
		default=PENDING
	)

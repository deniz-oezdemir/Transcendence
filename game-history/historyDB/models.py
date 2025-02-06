from django.db import models


class FinishedGame(models.Model):
    player_1_id = models.IntegerField(null=True, blank=True)
    player_2_id = models.IntegerField(null=True, blank=True)
    player_1_name = models.CharField(max_length=100)
    player_2_name = models.CharField(max_length=100)
    player_1_score = models.IntegerField(default=0)
    player_2_score = models.IntegerField(default=0)

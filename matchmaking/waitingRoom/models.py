from django.db import models


class Match(models.Model):
    PENDING = "pending"
    ACTIVE = "active"
    FINISHED = "finished"

    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (ACTIVE, "Active"),
        (FINISHED, "Finished"),
    ]

    match_id = models.BigAutoField(primary_key=True)  # Changed to AutoField
    player_1_id = models.BigIntegerField()
    player_2_id = models.BigIntegerField(null=True, blank=True)
    tournament_id = models.BigIntegerField(null=True, blank=True)
    round = models.IntegerField(null=True, blank=True)
    winner_id = models.BigIntegerField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)

    class Meta:
        db_table = "waitingRoom_match"


class Tournament(models.Model):
    PENDING = "pending"
    ACTIVE = "active"
    FINISHED = "finished"

    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (ACTIVE, "Active"),
        (FINISHED, "Finished"),
    ]

    tournament_id = models.BigAutoField(primary_key=True)  # Changed to AutoField
    creator_id = models.BigIntegerField()
    max_players = models.IntegerField(choices=[(4, "4 Players"), (6, "6 Players")])
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
    players = models.JSONField(default=list)
    matches = models.JSONField(default=list)
    winner_id = models.BigIntegerField(null=True, blank=True)

    class Meta:
        db_table = "waitingRoom_tournament"

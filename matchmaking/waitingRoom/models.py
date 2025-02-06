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

    match_id = models.BigAutoField(primary_key=True)
    player_1_id = models.BigIntegerField()
    player_2_id = models.BigIntegerField(null=True, blank=True)
    winner_id = models.BigIntegerField(null=True, blank=True)
    player_1_score = models.IntegerField(null=True, blank=True, default=0)
    player_2_score = models.IntegerField(null=True, blank=True, default=0)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    tournament_id = models.BigIntegerField(null=True, blank=True)
    round = models.IntegerField(null=True, blank=True)
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

    tournament_id = models.BigAutoField(primary_key=True)
    creator_id = models.BigIntegerField()
    max_players = models.IntegerField(choices=[(4, "4 Players"), (8, "8 Players")]) #TODO: rename to nbrOfParticipants
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
    players = models.JSONField(default=list)
    matches = models.JSONField(default=list)
    winner_id = models.BigIntegerField(null=True, blank=True)

    class Meta:
        db_table = "waitingRoom_tournament"

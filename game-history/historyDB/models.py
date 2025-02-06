from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class Player(models.Model):
    player_id = models.IntegerField(primary_key=True)
    games_won = models.IntegerField(default=0)
    games_lost = models.IntegerField(default=0)
    points_scored = models.IntegerField(default=0)
    points_conceded = models.IntegerField(default=0)
    total_time_played = models.FloatField(default=0.0)

    @property
    def win_ratio(self):
        total_games = self.games_won + self.games_lost
        return self.games_won / total_games if total_games > 0 else 0


class FinishedGame(models.Model):
    player_1_id = models.IntegerField()
    player_2_id = models.IntegerField()
    player_1_score = models.IntegerField()
    player_2_score = models.IntegerField()
    winner_id = models.IntegerField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    def get_duration(self):
        return (self.end_time - self.start_time).total_seconds()


@receiver(post_save, sender=FinishedGame)
def update_player_stats(sender, instance, **kwargs):
    player_1, created = Player.objects.get_or_create(player_id=instance.player_1_id)
    player_2, created = Player.objects.get_or_create(player_id=instance.player_2_id)

    player_1.points_scored += instance.player_1_score
    player_1.points_conceded += instance.player_2_score
    player_1.total_time_played += instance.get_duration()

    player_2.points_scored += instance.player_2_score
    player_2.points_conceded += instance.player_1_score
    player_2.total_time_played += instance.get_duration()

    if instance.winner_id == instance.player_1_id:
        player_1.games_won += 1
        player_2.games_lost += 1
    else:
        player_1.games_lost += 1
        player_2.games_won += 1

    player_1.save()
    player_2.save()

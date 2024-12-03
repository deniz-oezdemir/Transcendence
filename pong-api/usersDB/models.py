from django.db import models


class Player(models.Model):
    def __str__(self) -> str:
        return str(self.player_name)

    player_name = models.CharField(max_length=100)
    player_score = models.IntegerField()

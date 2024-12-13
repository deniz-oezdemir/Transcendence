from django.db import models
from django.contrib.auth.models import AbstractUser


class Player(AbstractUser):
    def __str__(self) -> str:
        return str(self.player_name)

    player_name = models.CharField(max_length=100)
    player_id = models.IntegerField(default=150)

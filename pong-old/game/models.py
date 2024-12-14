from django.db import models

class GameState(models.Model):
    player1_y = models.IntegerField(default=150)
    player2_y = models.IntegerField(default=150)
    ball_x = models.IntegerField(default=400)
    ball_y = models.IntegerField(default=200)
    ball_dx = models.IntegerField(default=30)
    ball_dy = models.IntegerField(default=30)

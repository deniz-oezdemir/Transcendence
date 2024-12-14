from django.db.models.signals import post_migrate
from django.dispatch import receiver
from .models import GameState

@receiver(post_migrate)
def reset_game_state(sender, **kwargs):
    if sender.name == 'game':
        GameState.objects.all().delete()
        GameState.objects.create(
            player1_y=150,
            player2_y=150,
            ball_x=400,
            ball_y=200,
            ball_dx=30,
            ball_dy=30
        )

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
import json
from .models import GameState


def index(request):
    return render(request, "game/index.html")


@csrf_exempt
def update_game(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            game_state = GameState.objects.first()
            game_state.player1_y = max(
                0, min(300, data.get("player1_y", game_state.player1_y))
            )
            game_state.player2_y = max(
                0, min(300, data.get("player2_y", game_state.player2_y))
            )
            game_state.save()
            return JsonResponse({"status": "ok"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        try:
            game_state = GameState.objects.first()
            # Update ball position
            game_state.ball_x += game_state.ball_dx
            game_state.ball_y += game_state.ball_dy

            # Ball collision with top and bottom walls
            if game_state.ball_y <= 0 or game_state.ball_y >= 400:
                game_state.ball_dy *= -1

            # Ball collision with paddles
            if (
                game_state.ball_x <= 20
                and game_state.player1_y
                <= game_state.ball_y
                <= game_state.player1_y + 100
            ) or (
                game_state.ball_x >= 780
                and game_state.player2_y
                <= game_state.ball_y
                <= game_state.player2_y + 100
            ):
                game_state.ball_dx *= -1

            # Ball out of bounds (reset position)
            if game_state.ball_x <= 0 or game_state.ball_x >= 800:
                game_state.ball_x = 400
                game_state.ball_y = 200
                game_state.ball_dx *= -1

            game_state.save()
            return JsonResponse(
                {
                    "player1_y": game_state.player1_y,
                    "player2_y": game_state.player2_y,
                    "ball_x": game_state.ball_x,
                    "ball_y": game_state.ball_y,
                    "ball_dx": game_state.ball_dx,
                    "ball_dy": game_state.ball_dy,
                }
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

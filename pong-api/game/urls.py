from django.urls import path
from . import views

urlpatterns = [
    path("create_game/", views.CreateGame.as_view(), name="create_game"),
    path(
        "get_game_state/<int:pk>/", views.GetGameState.as_view(), name="get_game_state"
    ),
]
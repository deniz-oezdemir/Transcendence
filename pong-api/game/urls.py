from django.urls import path
from . import views

urlpatterns = [
    path("create_game/", views.CreateGame.as_view(), name="create_game"),
    path("toggle_game/<int:id>/", views.ToggleGame.as_view(), name="toggle_game"),
    path(
        "get_game_state/<int:id>/", views.GetGameState.as_view(), name="get_game_state"
    ),
]

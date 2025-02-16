from django.contrib import admin
from django.urls import path
from historyDB.views import (
    FinishedGameCreateView,
    FinishedGameDetailView,
    get_games_by_player,
    top_ten_winners,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "api/finished-game/",
        FinishedGameCreateView.as_view(),
        name="create-finished-game",
    ),
    path(
        "api/finished-game/<int:pk>/",
        FinishedGameDetailView.as_view(),
        name="detail-finished-game",
    ),
    path("api/player/<int:player_id>/", get_games_by_player, name="games-by-player"),
    path("api/top-ten-winners/", top_ten_winners, name="top-ten-winners"),
]


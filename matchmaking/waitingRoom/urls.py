from django.urls import path
from . import views

urlpatterns = [
    path(
        "api/match/<int:match_id>/result/",
        views.update_game_result,
        name="update_game_result",
    ),
]

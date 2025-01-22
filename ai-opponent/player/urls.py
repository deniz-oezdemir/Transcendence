from django.urls import path
from . import views

urlpatterns = [
    path("create_ai_player/", views.CreateAIPlayer.as_view(), name="create_ai_player"),
    path(
        "delete_ai_player/<int:player_id>/",
        views.DeleteAIPlayer.as_view(),
        name="delete_ai_player",
    ),
]

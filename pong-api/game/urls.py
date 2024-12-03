from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns
from .views import GetGameState, PostGameState

urlpatterns = [
    path("game-state/<int:pk>/", GetGameState.as_view(), name="get-game-state"),
    path("game-state/<int:pk>/move/", PostGameState.as_view(), name="post-game-state"),
]

urlpatterns = format_suffix_patterns(urlpatterns)

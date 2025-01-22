from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("ai_player/", include("player.urls")),  # Include the game app's URLs
]

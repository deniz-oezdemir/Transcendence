from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path("ws/waiting-room/", consumers.WaitingRoomConsumer.as_asgi()),
]

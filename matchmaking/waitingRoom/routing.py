from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/waiting-room/$", consumers.WaitingRoomConsumer.as_asgi()),
]

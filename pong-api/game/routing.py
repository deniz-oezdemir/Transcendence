from django.urls import path
from . import consumers
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

websocket_urlpatterns = [
    path("ws/game/<int:game_id>/", consumers.GameConsumer.as_asgi()),
]

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
    }
)

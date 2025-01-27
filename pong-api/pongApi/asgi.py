import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pongApi.settings")
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from game.routing import websocket_urlpatterns
from django.core.asgi import get_asgi_application

# WARNING:
"""
Proper loading order must be followed otherwise start fails:

  1 from django.core.asgi import get_asgi_application
  2 os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mysite.settings")
  3 django_asgi_app = get_asgi_application()
  4 from chat.routing import websocket_urlpatterns

Source: https://forum.djangoproject.com/t/i-get-the-error-apps-arent-loaded-yet-when-publishing-with-daphne/30320/16
"""

# sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django_asgi_app = get_asgi_application()

print("Loading ASGI application...")

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
    }
)
print("ASGI application loaded.")

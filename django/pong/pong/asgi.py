"""
ASGI config for pong project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/asgi/
"""

import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from django.urls import re_path
from game.consumers import GameConsumer
from notifs.consumers import NotifsConsumer
from tournaments.consumers import TournamentConsumer


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pong.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": URLRouter([
        re_path(r'^game/*', GameConsumer.as_asgi()),
        re_path(r'^notifs/*', NotifsConsumer.as_asgi()),
        re_path(r'^tournament/*', TournamentConsumer.as_asgi())
    ]),
})

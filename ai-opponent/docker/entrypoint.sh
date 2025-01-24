#!/bin/bash
set -e

redis-server --daemonize yes

# Wait for Redis to be ready
while ! redis-cli ping; do
  sleep 1
done

python manage.py migrate

export DJANGO_SETTINGS_MODULE=AIOpponent.settings
exec daphne -b 0.0.0.0 -p 8000 AIOpponent.asgi:application


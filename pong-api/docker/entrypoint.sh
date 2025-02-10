#!/bin/bash
set -e

# Start Redis server in background
redis-server --daemonize yes

# Flush all Redis data
redis-cli FLUSHALL

# Wait for Redis to be ready
while ! redis-cli ping; do
  sleep 1
done

python manage.py makemigrations
# Apply database migrations
python manage.py migrate

# Start Daphne with Django settings
export DJANGO_SETTINGS_MODULE=pongApi.settings
exec daphne -b 0.0.0.0 -p 8000 pongApi.asgi:application

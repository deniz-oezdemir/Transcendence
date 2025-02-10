#!/bin/bash
set -e

# Start Redis server in background
redis-server --daemonize yes


# Wait for Redis to be ready
while ! redis-cli ping; do
  sleep 1
done

# Flush all Redis data
redis-cli FLUSHALL

# Confirm FLUSHALL worked
if [ "$(redis-cli dbsize)" -eq 0 ]; then
  echo "Redis FLUSHALL successful"
else
  echo "Redis FLUSHALL failed"
  exit 1
fi

python manage.py makemigrations
# Apply database migrations
python manage.py migrate

# Start Daphne with Django settings
export DJANGO_SETTINGS_MODULE=pongApi.settings
exec daphne -b 0.0.0.0 -p 8000 pongApi.asgi:application

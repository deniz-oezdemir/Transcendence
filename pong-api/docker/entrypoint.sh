#!/bin/bash
set -e

# Start Redis server in background
redis-server --daemonize yes

# Wait for Redis to be ready
while ! redis-cli ping; do
  sleep 1
done

# Configure Redis settings
redis-cli CONFIG SET maxclients 10
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli CONFIG SET save ""
redis-cli CONFIG SET appendonly no

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

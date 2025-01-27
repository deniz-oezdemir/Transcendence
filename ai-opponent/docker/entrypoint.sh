#!/bin/bash
set -e

echo "Starting Redis server..."
redis-server --daemonize yes

# Wait for Redis with timeout
MAX_RETRIES=30
RETRIES=0

echo "Waiting for Redis to be ready..."
while ! redis-cli ping > /dev/null 2>&1; do
    RETRIES=$((RETRIES+1))
    if [ $RETRIES -eq $MAX_RETRIES ]; then
        echo "Redis failed to start after $MAX_RETRIES attempts"
        exit 1
    fi
    echo "Waiting for Redis... attempt $RETRIES/$MAX_RETRIES"
    sleep 1
done

echo "Redis is ready!"
echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate

echo "Starting Daphne server..."
export DJANGO_SETTINGS_MODULE=AIOpponent.settings
exec daphne -b 0.0.0.0 -p 8000 AIOpponent.asgi:application

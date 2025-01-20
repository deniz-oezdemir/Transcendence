#!/bin/bash

# Wait for PostgreSQL
until nc -z postgres 5432
do
  echo "Waiting for PostgreSQL..."
  sleep 1
done
echo "PostgreSQL is up and running!"

# Wait for Redis
until nc -z redis 6379
do
  echo "Waiting for Redis..."
  sleep 1
done
echo "Redis is up and running!"

# Make migrations and migrate
echo "Creating database migrations..."
python manage.py makemigrations waitingRoom

echo "Applying database migrations..."
python manage.py migrate

# Start server
echo "Starting Daphne server..."
exec daphne -b 0.0.0.0 -p 8000 matchmaking.asgi:application

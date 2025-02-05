#!/bin/bash

# Wait for PostgreSQL
until nc -z matchmaking-postgres 5432
do
  echo "Waiting for PostgreSQL..."
  sleep 1
done
echo "PostgreSQL is up and running!"

# Wait for Redis
until nc -z matchmaking-redis 6379
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

echo "Creating superuser..."
python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin')
END

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

# Start server
echo "Starting Daphne server..."
exec daphne -b 0.0.0.0 -p 8000 matchmaking.asgi:application

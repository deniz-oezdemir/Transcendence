#!/bin/sh

while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
  echo "Waiting for the PostgreSQL database..."
  sleep 2
done
echo "PostgreSQL is up and running!"

python manage.py makemigrations
python manage.py migrate

python manage.py runserver 0.0.0.0:8000

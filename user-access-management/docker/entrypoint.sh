#!/bin/bash

set -e

python manage.py makemigrations --noinput
python manage.py migrate --noinput

exec python manage.py runserver 0.0.0.0:8000
# exec "gunicorn", "--bind", "0.0.0.0:8000", "django_project.wsgi:application"
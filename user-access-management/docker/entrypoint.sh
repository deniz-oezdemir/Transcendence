#!/bin/bash

set -e  # Para detener la ejecución si hay errores

python manage.py makemigrations --noinput
python manage.py migrate --noinput

exec python manage.py runserver 0.0.0.0:8000
FROM python:3.10-slim

WORKDIR /app

COPY docker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
# CMD ["python", "manage.py", "migrate", "python", "manage.py", "runserver", "0.0.0.0:8000"]

FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY docker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# RUN mkdir -p /app/media/avatars
# RUN curl -o /app/media/avatars/default.png "https://kawaii-avatar.now.sh/api/avatar"

COPY . .
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
# CMD ["python", "manage.py", "migrate", "python", "manage.py", "runserver", "0.0.0.0:8000"]

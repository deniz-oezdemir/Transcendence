FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY docker/requirements.txt .
COPY docker/.env user-access-management/docker/.env
RUN pip install --no-cache-dir -r requirements.txt

VOLUME /usr/share/nginx/images

COPY . .
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh


ENTRYPOINT ["/entrypoint.sh"]

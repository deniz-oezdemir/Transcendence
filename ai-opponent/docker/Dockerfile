FROM python:3.10-slim
WORKDIR /app

RUN apt-get update && apt-get install -y \
    redis-server \
    redis-tools \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY docker/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY . .

EXPOSE 8004

ENTRYPOINT ["/entrypoint.sh"]


FROM python:3.10-slim

WORKDIR /app

# Install Redis
RUN apt-get update && apt-get install -y redis-server

# Copy requirements first for better caching
COPY docker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy entrypoint script and make it executable
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy the application code
COPY . .

EXPOSE 8000
ENV DJANGO_SETTINGS_MODULE=pongApi.settings

ENTRYPOINT ["/entrypoint.sh"]

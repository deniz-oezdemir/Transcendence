FROM python:3.10-slim

# Install PostgreSQL client and required dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY docker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy entrypoint script first and make it executable
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy the rest of the application
COPY . .

# Expose port for Django/Daphne
EXPOSE 8000

# Collect static files
RUN python manage.py collectstatic --noinput

# Use entrypoint script
ENTRYPOINT ["/entrypoint.sh"]

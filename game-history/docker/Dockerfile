FROM python:3.10-slim

RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    netcat-openbsd

WORKDIR /app

COPY docker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY . .

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]

FROM --platform=linux/amd64 python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
	gcc libpq-dev && \
	rm -rf /var/lib/apt/lists/* && \
	pip install --upgrade pip setuptools wheel


COPY docker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ENV MODEL_NAME=distilgpt2

RUN python -c "from transformers import AutoTokenizer, AutoModelForCausalLM; \
	AutoTokenizer.from_pretrained('$MODEL_NAME', local_files_only=False); \
	AutoModelForCausalLM.from_pretrained('$MODEL_NAME', local_files_only=False)"

COPY . .

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

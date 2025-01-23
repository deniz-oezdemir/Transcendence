FROM python:3.10-slim

WORKDIR /app
COPY docker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Cache model during build so it only needs to be downloaded during first build
RUN python -c "from transformers import AutoTokenizer, AutoModelForCausalLM; \
    tokenizer = AutoTokenizer.from_pretrained('distilgpt2', local_files_only=False); \
    model = AutoModelForCausalLM.from_pretrained('distilgpt2', local_files_only=False)"

COPY . .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

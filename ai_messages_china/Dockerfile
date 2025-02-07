FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install huggingface_hub for model download
RUN pip install --no-cache-dir huggingface_hub

# Create models directory and download model files
RUN python -c "from huggingface_hub import snapshot_download; \
    snapshot_download( \
        repo_id='deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B', \
        local_dir='/app/models/DeepSeek-R1-Distill-Qwen-1.5B', \
        ignore_patterns=['*.md', '*.txt'] \
    )"

# Copy application files
COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY docker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install huggingface_hub for model downloads
RUN pip install --no-cache-dir "huggingface_hub>=0.17.0" "tqdm>=4.65.0"

# Create models directory
RUN mkdir -p /app/models

# Download model files using repository pattern
RUN python -c "from huggingface_hub import snapshot_download; \
    snapshot_download( \
        repo_id='deepseek-ai/deepseek-coder-1.3b-instruct', \
        local_dir='/app/models/DeepSeek-R1-Distill-Qwen-1.5B', \
        ignore_patterns=['*.md', '*.txt'], \
        local_files_only=False \
    )"

# Copy application files
COPY . .

# Set proper permissions
RUN chown -R nobody:nogroup /app/models

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

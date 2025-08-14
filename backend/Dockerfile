FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install gdown for Google Drive downloads
RUN pip install gdown

# Copy application code
COPY . .

# Download model checkpoint from Google Drive using gdown
RUN if [ ! -f "checkpoint-best.pth" ]; then \
    echo "Downloading model checkpoint from Google Drive using gdown..." && \
    gdown --id 1nzFM77OrlKLLP7uuURtwCMYb34DYGrkw --output checkpoint-best.pth && \
    echo "Model checkpoint downloaded successfully"; \
    fi

# Create directories
RUN mkdir -p /app/diabetic_retinopathy_dataset

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
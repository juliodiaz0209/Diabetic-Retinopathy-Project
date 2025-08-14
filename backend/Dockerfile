FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Download model checkpoint if not exists
RUN if [ ! -f "checkpoint-best.pth" ]; then \
    echo "Downloading model checkpoint..." && \
    curl -L -o checkpoint-best.pth "https://your-model-storage-url/checkpoint-best.pth"; \
    fi

# Create directories
RUN mkdir -p /app/diabetic_retinopathy_dataset

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
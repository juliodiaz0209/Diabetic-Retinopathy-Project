FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Download model checkpoint from Google Drive
RUN echo "Downloading model checkpoint from Google Drive..." && \
    curl -L -o checkpoint-best.pth "https://drive.google.com/uc?export=download&id=1nzFM77OrlKLLP7uuURtwCMYb34DYGrkw" && \
    echo "Model checkpoint downloaded successfully"

# Create directories
RUN mkdir -p /app/diabetic_retinopathy_dataset

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
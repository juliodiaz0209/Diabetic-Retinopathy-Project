#!/bin/bash

# RetinaScan AI - Startup Script
echo "🏥 Starting RetinaScan AI Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/diabetic_retinopathy_dataset

# Build and start services
echo "🐳 Building and starting services..."
if command -v docker-compose &> /dev/null; then
    docker-compose up --build -d
else
    docker compose up --build -d
fi

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
if curl -f http://localhost:8000/health &> /dev/null; then
    echo "✅ Backend is running on http://localhost:8000"
else
    echo "⚠️  Backend might still be starting..."
fi

if curl -f http://localhost &> /dev/null; then
    echo "✅ Frontend is running on http://localhost"
else
    echo "⚠️  Frontend might still be starting..."
fi

echo ""
echo "🎉 RetinaScan AI is starting up!"
echo "📊 Access the API documentation: http://localhost:8000/docs"
echo "🖥️  Access the application: http://localhost"
echo ""
echo "📝 To stop the services, run: docker-compose down"
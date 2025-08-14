@echo off
REM RetinaScan AI - Startup Script for Windows
echo 🏥 Starting RetinaScan AI Platform...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating directories...
if not exist "backend\diabetic_retinopathy_dataset" mkdir "backend\diabetic_retinopathy_dataset"

REM Build and start services
echo 🐳 Building and starting services...
docker-compose up --build -d

REM Wait for services to start
echo ⏳ Waiting for services to start...
timeout /t 15 /nobreak >nul

echo.
echo 🎉 RetinaScan AI is starting up!
echo 📊 Access the API documentation: http://localhost:8000/docs
echo 🖥️  Access the application: http://localhost
echo.
echo 📝 To stop the services, run: docker-compose down
echo.
pause
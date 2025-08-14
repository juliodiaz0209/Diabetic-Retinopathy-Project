# 🏥 RetinaScan AI - Diabetic Retinopathy Screening Platform

![RetinaScan AI](https://img.shields.io/badge/RetinaScan-AI%20Powered-blue?style=for-the-badge&logo=eye)

**Advanced AI-Powered Diabetic Retinopathy Screening Platform** with FastAPI backend and React frontend.

## 🌟 Features

- **🤖 AI-Powered Analysis**: Deep learning models for accurate DR detection
- **🔐 Secure Authentication**: JWT-based authentication system
- **👥 Patient Management**: Comprehensive patient data handling
- **📊 Clinical Reports**: PDF report generation for clinical records
- **🎨 Modern UI**: Beautiful React frontend with shadcn/ui components
- **🏥 HIPAA Compliant**: Secure data handling and storage
- **📱 Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with Python 3.11
- **Database**: SQLite with SQLAlchemy
- **Authentication**: JWT tokens with bcrypt password hashing
- **ML Model**: TensorFlow/Keras for image classification
- **File Handling**: Secure image upload and processing

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Library**: shadcn/ui components with Tailwind CSS
- **State Management**: React Context + TanStack Query
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (optional)

### 🐳 Docker Deployment (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Diabetic-Retinopathy-Project
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Access the applications**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### 🛠️ Local Development

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the server**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
Diabetic-Retinopathy-Project/
├── backend/                    # FastAPI backend
│   ├── main.py                # Main FastAPI application
│   ├── auth.py                # Authentication utilities
│   ├── model.py               # ML model utilities
│   ├── recommendations.json   # Clinical recommendations data
│   ├── model-folder/          # ML model files
│   │   └── diabetic-retino-model.h5
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile            # Backend Docker configuration
│   └── ...
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── lib/            # Utility functions
│   │   └── ...
│   ├── package.json         # Node.js dependencies
│   ├── Dockerfile          # Frontend Docker configuration
│   └── ...
├── docker-compose.yml     # Docker Compose configuration
├── start.bat             # Windows startup script
└── README.md             # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Patients
- `POST /patients` - Create patient profile
- `GET /patients/me` - Get user's patient data

### Predictions
- `POST /predict` - Upload image for DR analysis
- `POST /predictions` - Save prediction result
- `GET /predictions` - Get user's predictions
- `GET /predictions/report` - Download PDF report

## 🎯 Usage Guide

### 1. **Create Account**
   - Visit the application
   - Click "Create Account"
   - Fill in your professional details

### 2. **Login**
   - Use your credentials to sign in
   - Access the dashboard

### 3. **Upload Image**
   - Click the upload area
   - Select a retinal fundus image
   - Click "Start AI Analysis"

### 4. **View Results**
   - See confidence scores and diagnosis
   - Review detailed analysis
   - Download clinical reports

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Configured for frontend domains
- **Input Validation**: Pydantic models for request validation
- **File Upload Security**: Image type validation and size limits

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📊 Performance

- **Model Inference**: ~2-3 seconds per image
- **Image Processing**: Optimized for 224x224 input
- **Database**: SQLite for development, PostgreSQL recommended for production
- **Caching**: React Query for efficient data fetching

## 🔄 Migration from Streamlit

This application has been completely migrated from a Streamlit-based architecture to a modern FastAPI + React stack:

### Key Improvements:
- ✅ **Better Performance**: Separate frontend and backend
- ✅ **Modern UI**: Professional React interface with shadcn/ui
- ✅ **API-First**: RESTful API design
- ✅ **Scalability**: Independent frontend and backend scaling
- ✅ **Mobile Support**: Responsive design
- ✅ **Developer Experience**: TypeScript, modern tooling

## 🐛 Troubleshooting

### Common Issues

1. **Model Loading Error**
   ```
   Ensure model-folder/diabetic-retino-model.h5 exists
   ```

2. **CORS Errors**
   ```
   Check frontend URL in backend CORS configuration
   ```

3. **Database Issues**
   ```
   Delete medical_data.db and restart to recreate tables
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**Built with ❤️ for healthcare innovation**
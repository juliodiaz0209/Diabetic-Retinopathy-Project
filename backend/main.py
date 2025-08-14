from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn
import os
from datetime import datetime, timedelta
from typing import Optional, List
import jwt
from passlib.context import CryptContext
import sqlite3
from contextlib import contextmanager
import numpy as np
from PIL import Image
import tensorflow as tf
from pydantic import BaseModel
import tempfile
import shutil

# Import our existing modules
from model import predict_image
from retfound_official import RETFoundOfficial  # Import RETFound
from auth import (
    get_db_connection, init_db, add_user, authenticate_user,
    add_patient, add_dr_prediction, get_patient_data, 
    fetch_predictions, get_patient_id, generate_pdf_report
)

app = FastAPI(
    title="RetinaScan AI API",
    description="Advanced AI-Powered Diabetic Retinopathy Screening Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todos los orígenes - útil para desarrollo y testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Pydantic Models
class UserCreate(BaseModel):
    username: str
    name: str
    password: str
    email: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    contact_info: str

class PredictionCreate(BaseModel):
    prediction_class: str
    confidence_score: float

class PredictionResponse(BaseModel):
    confidence_score: float
    prediction_class: str
    diagnosis: str
    model_used: str = "Current Model"

class RETFoundPredictionResponse(BaseModel):
    # Interpretación principal (binaria para screening)
    confidence_score: float
    prediction_class: str
    diagnosis: str
    probabilities: dict
    
    # Interpretación detallada (clase individual más probable)
    individual_prediction: str
    individual_confidence: float
    individual_diagnosis: str
    
    # Interpretación binaria explícita
    binary_prediction: str
    binary_confidence: float
    binary_diagnosis: str
    
    # Recomendación clínica
    clinical_recommendation: str
    
    # Información detallada (compatibilidad)
    detailed_class: str
    detailed_probabilities: dict
    model_used: str
    checkpoint_loaded: bool

# Load the ML models
try:
    model = tf.keras.models.load_model("model-folder/diabetic-retino-model.h5")
    print("✅ Current model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading current model: {e}")
    model = None

# Load RETFound model
try:
    retfound_model = RETFoundOfficial()
    print("✅ RETFound model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading RETFound model: {e}")
    retfound_model = None

# Initialize database
init_db()

# Helper functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return username
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# API Endpoints

@app.get("/")
async def root():
    return {"message": "RetinaScan AI API - Diabetic Retinopathy Screening Platform"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "RetinaScan AI API",
        "models": {
            "current_model": "available" if model else "unavailable",
            "retfound_model": "available" if retfound_model else "unavailable",
            "checkpoint_exists": os.path.exists("checkpoint-best.pth") if retfound_model else False
        }
    }

@app.post("/auth/register", response_model=dict)
async def register(user: UserCreate):
    try:
        add_user(user.username, user.name, user.password, user.email)
        return {"message": "User created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    user = authenticate_user(user_login.username, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user[1]}, expires_delta=access_token_expires  # user[1] is username
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me")
async def get_current_user(current_user: str = Depends(verify_token)):
    return {"username": current_user}

@app.post("/patients")
async def create_patient(patient: PatientCreate, current_user: str = Depends(verify_token)):
    try:
        add_patient(current_user, patient.name, patient.age, patient.gender, patient.contact_info)
        return {"message": "Patient created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/patients/me")
async def get_my_patient(current_user: str = Depends(verify_token)):
    patient_data = get_patient_data(current_user)
    if not patient_data:
        return None
    return patient_data

@app.post("/predict", response_model=PredictionResponse)
async def predict_retinopathy(
    file: UploadFile = File(...),
    current_user: str = Depends(verify_token)
):
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            # Read and save uploaded file
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Predict using the model
        confidence_level = predict_image(model=model, image_path=temp_file_path)
        confidence_score = float(confidence_level[0, 0]) * 100
        
        # Determine diagnosis
        if confidence_level >= 0.5:
            prediction_class = "NO-DR"
            diagnosis = "Negative for Diabetic Retinopathy"
        else:
            prediction_class = "DR"
            diagnosis = "Positive for Diabetic Retinopathy"
            confidence_score = 100 - confidence_score
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        return PredictionResponse(
            confidence_score=confidence_score,
            prediction_class=prediction_class,
            diagnosis=diagnosis,
            model_used="Current Model (.h5)"
        )
        
    except Exception as e:
        # Clean up on error
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict/retfound", response_model=RETFoundPredictionResponse)
async def predict_retinopathy_retfound(
    file: UploadFile = File(...),
    current_user: str = Depends(verify_token)
):
    if not retfound_model:
        raise HTTPException(status_code=500, detail="RETFound model not loaded")
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            # Read and save uploaded file
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Predict using RETFound
        result = retfound_model.predict(temp_file_path)
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        return RETFoundPredictionResponse(
            # Interpretación principal (binaria para screening)
            confidence_score=result['confidence_score'],
            prediction_class=result['prediction_class'],
            diagnosis=result['diagnosis'],
            probabilities=result['probabilities'],
            
            # Interpretación detallada (clase individual más probable)
            individual_prediction=result['individual_prediction'],
            individual_confidence=result['individual_confidence'],
            individual_diagnosis=result['individual_diagnosis'],
            
            # Interpretación binaria explícita
            binary_prediction=result['binary_prediction'],
            binary_confidence=result['binary_confidence'],
            binary_diagnosis=result['binary_diagnosis'],
            
            # Recomendación clínica
            clinical_recommendation=result['clinical_recommendation'],
            
            # Información detallada (compatibilidad)
            detailed_class=result['detailed_class'],
            detailed_probabilities=result['detailed_probabilities'],
            model_used=result['model_used'],
            checkpoint_loaded=result['checkpoint_loaded']
        )
        
    except Exception as e:
        # Clean up on error
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"RETFound prediction failed: {str(e)}")

@app.post("/predictions")
async def save_prediction(
    prediction: PredictionCreate,
    current_user: str = Depends(verify_token)
):
    try:
        patient_id = get_patient_id(current_user)
        if not patient_id:
            raise HTTPException(
                status_code=400, 
                detail="No patient profile found. Please create a patient profile first to save predictions."
            )
        
        add_dr_prediction(patient_id, prediction.prediction_class, prediction.confidence_score)
        return {"message": "Prediction saved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save prediction: {str(e)}")

@app.get("/predictions")
async def get_predictions(current_user: str = Depends(verify_token)):
    predictions = fetch_predictions(current_user)
    if not predictions:
        return []
    
    # Convert to list of dictionaries for better JSON response
    return [
        {
            "patient_name": pred[0],
            "patient_id": pred[1],
            "prediction_class": pred[2],
            "confidence_score": pred[3],
            "prediction_date": pred[4]
        }
        for pred in predictions
    ]

@app.get("/models/info")
async def get_models_info():
    """Get information about available models"""
    return {
        "current_model": {
            "name": "Current Model (.h5)",
            "status": "available" if model else "unavailable",
            "description": "Original diabetic retinopathy model",
            "endpoint": "/predict"
        },
        "retfound_model": {
            "name": "RETFound Official",
            "status": "available" if retfound_model else "unavailable", 
            "description": "Foundation model for retinal imaging (Nature 2023)",
            "endpoint": "/predict/retfound",
            "checkpoint_loaded": getattr(retfound_model, 'checkpoint_loaded', False) if retfound_model else False
        }
    }

@app.get("/predictions/report")
async def download_report(current_user: str = Depends(verify_token)):
    predictions = fetch_predictions(current_user)
    if not predictions:
        raise HTTPException(status_code=404, detail="No predictions found")
    
    try:
        pdf_filename = generate_pdf_report(predictions)
        return FileResponse(
            path=pdf_filename,
            filename=pdf_filename,
            media_type='application/pdf'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
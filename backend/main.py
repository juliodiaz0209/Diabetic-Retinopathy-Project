from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
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

# ML API Configuration

# Pydantic Models for ML responses only

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

# Load RETFound quantized model
try:
    checkpoint_path = "checkpoint-quantized-model.pth"
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Quantized model checkpoint not found: {checkpoint_path}")
    
    retfound_model = RETFoundOfficial(checkpoint_path=checkpoint_path)
    print(f"✅ RETFound quantized model loaded successfully from {checkpoint_path}!")
except Exception as e:
    print(f"❌ Error loading RETFound quantized model: {e}")
    retfound_model = None

# ML API ready - Database and auth moved to Supabase

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
            "retfound_quantized_model": "available" if retfound_model else "unavailable",
            "quantized_checkpoint_exists": os.path.exists("checkpoint-quantized-model.pth") if retfound_model else False
        }
    }

# ML endpoints only - Auth and patient management moved to Supabase

@app.post("/predict", response_model=PredictionResponse)
async def predict_retinopathy(
    file: UploadFile = File(...)
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
    file: UploadFile = File(...)
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

# Prediction management moved to Supabase - only ML endpoints remain

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
        "retfound_quantized_model": {
            "name": "RETFound Official (Quantized)",
            "status": "available" if retfound_model else "unavailable", 
            "description": "Foundation model for retinal imaging (Nature 2023) - Quantized version",
            "endpoint": "/predict/retfound",
            "checkpoint_loaded": getattr(retfound_model, 'checkpoint_loaded', False) if retfound_model else False
        }
    }

# Report generation moved to Supabase - only ML endpoints remain

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
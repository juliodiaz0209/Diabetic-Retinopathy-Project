"""
Comparación Real: Modelo Actual (.h5) vs RETFound
Evaluación directa en el mismo dataset
"""

import os
import json
import time
import numpy as np
from PIL import Image
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt

# Importar modelos
from model import predict_image as current_model_predict
from retfound_official import RETFoundOfficial  # MODELO OFICIAL REAL
import tensorflow as tf
from tensorflow.keras.models import load_model

def load_test_images(test_path="../diabetic_retinopathy_dataset/test", max_images=10):
    """Cargar imágenes de test para comparación"""
    images = []
    labels = []
    filenames = []
    
    print(f"🔍 Buscando imágenes en: {test_path}")
    
    if not os.path.exists(test_path):
        print(f"❌ No existe el directorio: {test_path}")
        return [], [], []
    
    # Buscar subdirectorios (clases)
    subdirs = [d for d in os.listdir(test_path) 
               if os.path.isdir(os.path.join(test_path, d))]
    
    if not subdirs:
        # Si no hay subdirectorios, buscar imágenes directamente
        files = [f for f in os.listdir(test_path) 
                if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        for i, filename in enumerate(files[:max_images]):
            if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(test_path, filename)
                try:
                    img = Image.open(img_path)
                    images.append(img_path)
                    # Asumir etiqueta basada en nombre del archivo o usar 0 por defecto
                    labels.append(0 if 'no_dr' in filename.lower() else 1)
                    filenames.append(filename)
                except Exception as e:
                    print(f"❌ Error cargando {filename}: {e}")
                    continue
    else:
        print(f"📁 Encontradas clases: {subdirs}")
        
        for class_idx, class_name in enumerate(subdirs):
            class_path = os.path.join(test_path, class_name)
            files = [f for f in os.listdir(class_path) 
                    if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            
            count = 0
            for filename in files:
                if count >= max_images // len(subdirs):
                    break
                    
                img_path = os.path.join(class_path, filename)
                try:
                    img = Image.open(img_path)
                    images.append(img_path)
                    # Mapear correctamente: DR=1, No_DR=0
                    true_label = 1 if class_name == 'DR' else 0
                    labels.append(true_label)
                    filenames.append(f"{class_name}/{filename}")
                    count += 1
                except Exception as e:
                    print(f"❌ Error cargando {filename}: {e}")
                    continue
    
    print(f"✅ Cargadas {len(images)} imágenes")
    return images, labels, filenames

def compare_models():
    """Comparar modelo actual vs RETFound"""
    print("🚀 INICIANDO COMPARACIÓN DE MODELOS")
    print("=" * 50)
    
    # Cargar imágenes de test
    test_images, true_labels, filenames = load_test_images()
    
    if len(test_images) == 0:
        print("❌ No se encontraron imágenes para probar")
        return
    
    print(f"📊 Evaluando en {len(test_images)} imágenes")
    
    # Cargar modelo actual
    print("\n🔧 Cargando modelo actual (.h5)...")
    try:
        current_model = load_model("model-folder/diabetic-retino-model.h5")
        print("✅ Modelo actual cargado exitosamente")
    except Exception as e:
        print(f"❌ Error cargando modelo actual: {e}")
        return
    
    # Inicializar RETFound OFICIAL REAL
    print("\n🔧 Inicializando RETFound OFICIAL REAL...")
    retfound_official = RETFoundOfficial()
    
    # Resultados
    current_predictions = []
    current_confidences = []
    retfound_predictions = []
    retfound_confidences = []
    
    print("\n🔄 Procesando imágenes...")
    
    for i, img_path in enumerate(test_images):
        print(f"Procesando {i+1}/{len(test_images)}: {filenames[i]}")
        
        try:
            # Modelo actual
            start_time = time.time()
            current_result_raw = current_model_predict(current_model, img_path)
            current_time = time.time() - start_time
            
            # Procesar resultado del modelo actual (igual que en main.py)
            raw_confidence = float(current_result_raw[0][0])
            confidence_score = raw_confidence * 100
            
            if raw_confidence >= 0.5:
                prediction_class = "No_DR"
                final_confidence = confidence_score
            else:
                prediction_class = "DR" 
                final_confidence = 100 - confidence_score
                
            current_result = {
                'prediction_class': prediction_class,
                'confidence_score': final_confidence
            }
            
            current_class = 1 if current_result['prediction_class'] == 'DR' else 0
            current_predictions.append(current_class)
            current_confidences.append(current_result['confidence_score'])
            
            # RETFound OFICIAL
            start_time = time.time()
            retfound_result = retfound_official.predict(img_path)
            retfound_time = time.time() - start_time
            
            retfound_class = 1 if retfound_result['prediction_class'] == 'DR' else 0
            retfound_predictions.append(retfound_class)
            retfound_confidences.append(retfound_result['confidence_score'])
            
            print(f"  Actual: {current_result['prediction_class']} ({current_result['confidence_score']:.1f}%) - {current_time:.2f}s")
            print(f"  RETFound OFICIAL: {retfound_result['prediction_class']} ({retfound_result['confidence_score']:.1f}%) - {retfound_time:.2f}s")
            
            # Debug para RETFound
            if 'detailed_probabilities' in retfound_result:
                probs = retfound_result['detailed_probabilities']
                print(f"    🔍 Detalles: {probs}")
            
            # Mostrar si se cargó el checkpoint oficial
            if 'checkpoint_loaded' in retfound_result:
                checkpoint_status = "✅ Checkpoint oficial" if retfound_result['checkpoint_loaded'] else "⚠️ Fallback model"
                print(f"    🏆 Estado: {checkpoint_status}")
            
        except Exception as e:
            print(f"❌ Error procesando {filenames[i]}: {e}")
            continue
    
    # Calcular métricas
    print("\n📊 RESULTADOS DE COMPARACIÓN")
    print("=" * 50)
    
    if len(true_labels) == len(current_predictions):
        # Modelo actual
        current_accuracy = accuracy_score(true_labels, current_predictions)
        current_avg_confidence = np.mean(current_confidences)
        
        # RETFound
        retfound_accuracy = accuracy_score(true_labels, retfound_predictions)
        retfound_avg_confidence = np.mean(retfound_confidences)
        
        print("🏆 MODELO ACTUAL (.h5):")
        print(f"   Accuracy: {current_accuracy:.3f} ({current_accuracy*100:.1f}%)")
        print(f"   Confidence promedio: {current_avg_confidence:.1f}%")
        
        print("\n🚀 RETFound:")
        print(f"   Accuracy: {retfound_accuracy:.3f} ({retfound_accuracy*100:.1f}%)")
        print(f"   Confidence promedio: {retfound_avg_confidence:.1f}%")
        
        # Ganador
        winner = "RETFound" if retfound_accuracy > current_accuracy else "Modelo Actual"
        diff = abs(retfound_accuracy - current_accuracy) * 100
        
        print(f"\n🏅 GANADOR: {winner}")
        print(f"   Diferencia: {diff:.1f} puntos porcentuales")
        
        # Guardar resultados
        results = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "test_images": len(test_images),
            "current_model": {
                "accuracy": float(current_accuracy),
                "avg_confidence": float(current_avg_confidence),
                "predictions": current_predictions
            },
            "retfound_model": {
                "accuracy": float(retfound_accuracy),
                "avg_confidence": float(retfound_avg_confidence),
                "predictions": retfound_predictions
            },
            "true_labels": true_labels,
            "winner": winner,
            "difference_percentage": float(diff)
        }
        
        # Guardar en archivo
        with open("model_comparison_results.json", "w") as f:
            json.dump(results, f, indent=2)
        
        print(f"\n💾 Resultados guardados en: model_comparison_results.json")
        
    else:
        print("⚠️ No se pudieron calcular métricas - revisar etiquetas de verdad")
        
        print("\n📊 ESTADÍSTICAS GENERALES:")
        print(f"🏆 MODELO ACTUAL (.h5):")
        print(f"   Confidence promedio: {np.mean(current_confidences):.1f}%")
        print(f"   Predicciones DR: {sum(current_predictions)}/{len(current_predictions)}")
        
        print(f"\n🚀 RETFound:")
        print(f"   Confidence promedio: {np.mean(retfound_confidences):.1f}%")
        print(f"   Predicciones DR: {sum(retfound_predictions)}/{len(retfound_predictions)}")

if __name__ == "__main__":
    compare_models()
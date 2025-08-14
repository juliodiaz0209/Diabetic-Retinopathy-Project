#!/usr/bin/env python3
"""
Script para cuantizar el modelo RETFound y guardarlo como archivo más pequeño
"""

import torch
import os
import sys
from retfound_official import RETFoundOfficial

def quantize_and_save_model():
    """Cuantizar modelo y guardarlo como archivo más pequeño"""
    
    print("🔄 Cargando modelo original...")
    
    # Cargar modelo original
    model = RETFoundOfficial()
    
    print("🔄 Preparando modelo para guardar (modelo ya cuantizado dinámicamente)...")
    
    # El modelo interno ya fue cuantizado dinámicamente en RETFoundOfficial
    # Solo aseguramos modo eval antes de guardar
    model.model.eval()
    quantized_model = model.model
    
    print("🔄 Guardando modelo cuantizado...")
    
    # Guardar SOLO pesos (state_dict)
    output_path = "checkpoint-quantized.pth"
    torch.save(quantized_model.state_dict(), output_path)
    
    # Guardar el modelo completo para carga directa (recomendado)
    full_model_path = "checkpoint-quantized-model.pth"
    torch.save(quantized_model, full_model_path)
    
    # Verificar tamaños
    original_size = os.path.getsize("checkpoint-best.pth") / (1024**3)
    quantized_size = os.path.getsize(output_path) / (1024**3)
    full_model_size = os.path.getsize(full_model_path) / (1024**3)
    
    print(f"✅ Modelo cuantizado guardado como: {output_path}")
    print(f"📊 Tamaño original: {original_size:.2f} GB")
    print(f"📊 Tamaño cuantizado (state_dict): {quantized_size:.2f} GB")
    print(f"📊 Tamaño modelo completo: {full_model_size:.2f} GB")
    print(f"📊 Reducción: {((original_size - quantized_size) / original_size * 100):.1f}%")
    
    return output_path

if __name__ == "__main__":
    try:
        output_file = quantize_and_save_model()
        print(f"🎉 Modelo cuantizado listo: {output_file}")
        print("💡 Ahora puedes subir este archivo a Google Drive/Cloud Storage")
        print("💡 Y actualizar el Dockerfile para descargarlo")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1) 
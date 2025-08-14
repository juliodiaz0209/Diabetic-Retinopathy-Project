#!/usr/bin/env python3
"""
Pequeño script para probar inferencia con el checkpoint cuantizado.
Uso:
  # Opción A: usar state_dict cuantizado
  python test_quantized.py --image ../diabetic_retinopathy_dataset/test/some_image.jpg --checkpoint checkpoint-quantized.pth

  # Opción B: usar modelo completo cuantizado
  python test_quantized.py --image ../diabetic_retinopathy_dataset/test/some_image.jpg --checkpoint checkpoint-quantized-model.pth
"""

import argparse
from retfound_official import RETFoundOfficial


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True, help="Ruta a una imagen de prueba")
    parser.add_argument(
        "--checkpoint",
        default="checkpoint-quantized.pth",
        help="Ruta al checkpoint a usar (cuantizado o float)",
    )
    args = parser.parse_args()

    model = RETFoundOfficial(checkpoint_path=args.checkpoint)
    result = model.predict(args.image)
    print("\n=== Resultado de predicción ===")
    print({k: v for k, v in result.items() if k in [
        "prediction_class", "confidence_score", "diagnosis", "binary_prediction", "binary_confidence", "model_used"
    ]})


if __name__ == "__main__":
    main()


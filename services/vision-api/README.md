# Medusa Vision API

Servicio local de IA para analizar frames enviados por la web Medusa.

## Arranque rapido en Windows

```bat
start-vision-api.cmd
```

El servicio queda disponible en:

```text
http://127.0.0.1:8000
```

## Prueba

```bash
curl http://127.0.0.1:8000/health
```

## Variables

```text
MEDUSA_YOLO_MODEL=yolo11n.pt
MEDUSA_PERSON_CONFIDENCE=0.35
MEDUSA_YOLO_IMAGE_SIZE=416
MEDUSA_YOLO_MAX_DETECTIONS=12
MEDUSA_ALLOWED_ORIGINS=*
```

Para bajar latencia, reduce `MEDUSA_YOLO_IMAGE_SIZE` a `384` o `320`. Para mas precision, subelo a `512` o `640`, aceptando mas tiempo por frame.

## Nota

Esta fase detecta personas reales. Casco/chaleco requieren un modelo EPP especializado.

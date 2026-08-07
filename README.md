# Medusa

Medusa es una app web para monitoreo industrial de EPP. La web vive en Next.js/Vercel y el procesamiento de vision corre en un servicio separado para poder usar modelos IA.

## Estado actual

- Dashboard responsive para telefono y escritorio.
- Camara del dispositivo desde navegador.
- Captura y analisis de frames.
- API mock en `/api/analyze-frame`.
- Backend local `services/vision-api` con FastAPI + Ultralytics YOLO para detectar personas reales.

## Web

```bash
npm install
npm run dev
npm run build
npm test
```

Cuando `VISION_API_URL` no existe, la web usa detecciones simuladas. Cuando existe, `/api/analyze-frame` reenvia los frames al backend real.

Ejemplo local:

```bash
copy .env.example .env.local
npm run dev
```

## Vision API local

Desde Windows:

```bash
cd services\vision-api
start-vision-api.cmd
```

El primer analisis puede tardar porque Ultralytics descarga el modelo configurado en `MEDUSA_YOLO_MODEL`.

Endpoints:

- `GET /health`
- `POST /analyze-frame`

Payload:

```json
{
  "frame": "data:image/jpeg;base64,...",
  "source": "device-camera"
}
```

Respuesta compatible con la app:

```json
{
  "mode": "yolo",
  "summary": {
    "people": 1,
    "compliance": 100,
    "alerts": 0
  },
  "detections": []
}
```

## Produccion

La app en Vercel necesita que el backend IA sea accesible por HTTPS. Para pruebas puedes usar un tunel HTTPS hacia `http://127.0.0.1:8000` y configurar en Vercel:

```text
VISION_API_URL=https://tu-tunel-https
```

Despues, el backend puede moverse a un servidor con GPU, Jetson, RunPod, AWS, GCP o una mini PC industrial.

## Siguiente fase

El backend actual detecta personas con YOLO. Para casco, chaleco y otros EPP hay que conectar un modelo especializado o entrenar uno propio con datos del entorno real.

from __future__ import annotations

import base64
import io
import os
import time
from functools import lru_cache
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, Field


class AnalyzeFrameRequest(BaseModel):
    frame: str = Field(..., description="Data URL with a base64 encoded image.")
    source: str = "device-camera"


class Detection(BaseModel):
    id: str
    label: str
    confidence: float
    box: tuple[float, float, float, float]
    status: Literal["ok", "warning", "missing"] = "ok"


class AnalyzeFrameResponse(BaseModel):
    mode: Literal["yolo"]
    source: str
    frameBytes: int
    latencyMs: int
    analyzedAt: str
    summary: dict[str, int | float]
    detections: list[Detection]
    alerts: list[dict[str, str | float]]
    next: str


app = FastAPI(title="Medusa Vision API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("MEDUSA_ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "model": os.getenv("MEDUSA_YOLO_MODEL", "yolo11n.pt"),
        "imageSize": os.getenv("MEDUSA_YOLO_IMAGE_SIZE", "416"),
    }


@app.post("/analyze-frame", response_model=AnalyzeFrameResponse)
def analyze_frame(payload: AnalyzeFrameRequest) -> AnalyzeFrameResponse:
    started_at = time.perf_counter()
    image_bytes = decode_data_url(payload.frame)
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as error:
        raise HTTPException(status_code=400, detail="Frame de imagen invalido.") from error

    width, height = image.size
    model = get_model()

    results = model.predict(
        image,
        classes=[0],
        conf=float(os.getenv("MEDUSA_PERSON_CONFIDENCE", "0.35")),
        imgsz=int(os.getenv("MEDUSA_YOLO_IMAGE_SIZE", "416")),
        max_det=int(os.getenv("MEDUSA_YOLO_MAX_DETECTIONS", "12")),
        verbose=False,
    )

    detections: list[Detection] = []
    first_result = results[0] if results else None

    if first_result is not None and first_result.boxes is not None:
        for index, box in enumerate(first_result.boxes):
            xyxy = box.xyxy[0].tolist()
            confidence = float(box.conf[0].item())
            x1, y1, x2, y2 = to_percent_box(xyxy, width, height)
            detections.append(
                Detection(
                    id=f"person-{index + 1}",
                    label="Persona",
                    confidence=round(confidence, 3),
                    box=(x1, y1, x2, y2),
                    status="ok",
                )
            )

    latency_ms = int((time.perf_counter() - started_at) * 1000)

    return AnalyzeFrameResponse(
        mode="yolo",
        source=payload.source,
        frameBytes=len(image_bytes),
        latencyMs=latency_ms,
        analyzedAt=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        summary={
            "people": len(detections),
            "compliance": 100,
            "alerts": 0,
        },
        detections=detections,
        alerts=[],
        next="Fase 2 detecta personas reales. Para casco/chaleco falta conectar un modelo EPP.",
    )


@lru_cache(maxsize=1)
def get_model():
    try:
        from ultralytics import YOLO
    except ImportError as error:
        raise HTTPException(
            status_code=503,
            detail="Ultralytics no esta instalado. Ejecuta: pip install -r requirements.txt",
        ) from error

    model_name = os.getenv("MEDUSA_YOLO_MODEL", "yolo11n.pt")
    return YOLO(model_name)


def decode_data_url(frame: str) -> bytes:
    if not frame.startswith("data:image/") or "," not in frame:
        raise HTTPException(status_code=400, detail="Frame debe ser data:image/*;base64,...")

    try:
        return base64.b64decode(frame.split(",", 1)[1], validate=True)
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Frame base64 invalido.") from error


def to_percent_box(
    xyxy: list[float],
    width: int,
    height: int,
) -> tuple[float, float, float, float]:
    x1, y1, x2, y2 = xyxy
    return (
        round(max(0, min(100, (x1 / width) * 100)), 2),
        round(max(0, min(100, (y1 / height) * 100)), 2),
        round(max(0, min(100, (x2 / width) * 100)), 2),
        round(max(0, min(100, (y2 / height) * 100)), 2),
    )

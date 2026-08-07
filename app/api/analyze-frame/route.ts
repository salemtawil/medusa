import { NextResponse } from "next/server";

type Detection = {
  id: string;
  label: string;
  confidence: number;
  box: [number, number, number, number];
  status: "ok" | "warning" | "missing";
};

export async function POST(request: Request) {
  const startedAt = Date.now();

  try {
    const body = await request.json();
    const frame = typeof body?.frame === "string" ? body.frame : "";
    const source = typeof body?.source === "string" ? body.source : "device-camera";

    if (process.env.VISION_API_URL) {
      const proxiedResponse = await proxyToVisionApi(body);

      if (proxiedResponse) {
        return proxiedResponse;
      }

      return NextResponse.json(
        {
          error: "VISION_API_UNAVAILABLE",
          message: "El backend YOLO no respondio. No se generaron detecciones simuladas.",
        },
        {
          status: 503,
          headers: {
            "x-medusa-vision-backend": "vision-api-unavailable",
          },
        },
      );
    }

    return mockAnalyzeFrame(frame, source, startedAt);
  } catch {
    return NextResponse.json(
      { error: "INVALID_PAYLOAD", message: "No se pudo leer el frame enviado." },
      { status: 400 },
    );
  }
}

async function proxyToVisionApi(body: unknown) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const baseUrl = process.env.VISION_API_URL?.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/analyze-frame`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await response.json();

    return NextResponse.json(payload, {
      status: response.status,
      headers: {
        "x-medusa-vision-backend": response.ok ? "vision-api" : "vision-api-error",
      },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function mockAnalyzeFrame(frame: string, source: string, startedAt: number) {
  const frameBytes = estimateFrameBytes(frame);
  const seed = createSeed(frame, Date.now());

  if (!frame.startsWith("data:image/")) {
    return NextResponse.json(
      { error: "FRAME_REQUIRED", message: "Se requiere un frame en formato data:image." },
      { status: 400 },
    );
  }

  const missingHelmet = seed % 5 === 0 || seed % 7 === 0;
  const missingVest = seed % 6 === 0;
  const people = 1 + (seed % 2);
  const detections: Detection[] = [
    {
      id: "person-1",
      label: "Persona",
      confidence: confidence(seed, 88, 97),
      box: [18, 16, 46, 78],
      status: "ok",
    },
    {
      id: "helmet-1",
      label: "Casco",
      confidence: confidence(seed, missingHelmet ? 54 : 84, missingHelmet ? 68 : 94),
      box: [26, 12, 38, 25],
      status: missingHelmet ? "missing" : "ok",
    },
    {
      id: "vest-1",
      label: "Chaleco",
      confidence: confidence(seed, missingVest ? 50 : 78, missingVest ? 66 : 91),
      box: [24, 32, 42, 58],
      status: missingVest ? "warning" : "ok",
    },
  ];

  if (people > 1) {
    detections.push({
      id: "person-2",
      label: "Persona",
      confidence: confidence(seed, 81, 93),
      box: [58, 22, 78, 76],
      status: "ok",
    });
  }

  const alerts = [
    missingHelmet
      ? {
          type: "Casco faltante",
          severity: "Alta",
          confidence: confidence(seed, 76, 89),
          state: "Sospecha",
        }
      : null,
    missingVest
      ? {
          type: "Chaleco no visible",
          severity: "Media",
          confidence: confidence(seed, 70, 84),
          state: "En revision",
        }
      : null,
  ].filter(Boolean);

  return NextResponse.json(
    {
      mode: "mock",
      source,
      frameBytes,
      latencyMs: Date.now() - startedAt + 64 + (seed % 80),
      analyzedAt: new Date().toISOString(),
      summary: {
        people,
        compliance: Math.max(0, 100 - alerts.length * 18),
        alerts: alerts.length,
      },
      detections,
      alerts,
      next: "Configura VISION_API_URL para usar el backend YOLO real.",
    },
    {
      headers: {
        "x-medusa-vision-backend": "mock",
      },
    },
  );
}

function estimateFrameBytes(frame: string) {
  const base64 = frame.split(",")[1] ?? "";
  return Math.round((base64.length * 3) / 4);
}

function createSeed(frame: string, fallback: number) {
  const sample = frame.slice(-140);
  let hash = fallback % 997;

  for (let index = 0; index < sample.length; index += 1) {
    hash = (hash * 31 + sample.charCodeAt(index)) % 1009;
  }

  return hash;
}

function confidence(seed: number, min: number, max: number) {
  return Number(((min + (seed % (max - min + 1))) / 100).toFixed(2));
}

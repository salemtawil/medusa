"use client";

import { Activity, Camera, CameraOff, FlipHorizontal, Loader2, ScanLine, Square, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CameraState = "idle" | "starting" | "live" | "blocked" | "unsupported";
type DetectionStatus = "ok" | "warning" | "missing";
type AnalyzeResult = {
  mode: "mock" | "yolo";
  source: string;
  frameBytes: number;
  latencyMs: number;
  analyzedAt: string;
  summary: {
    people: number;
    compliance: number;
    alerts: number;
  };
  detections: Array<{
    id: string;
    label: string;
    confidence: number;
    box: [number, number, number, number];
    status: DetectionStatus;
  }>;
  alerts: Array<{
    type: string;
    severity: string;
    confidence: number;
    state: string;
  }>;
  next: string;
};

export function DeviceCameraPanel() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisInFlightRef = useRef(false);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [frameCount, setFrameCount] = useState(0);
  const [lastFrame, setLastFrame] = useState<string | null>(null);
  const [deviceLabel, setDeviceLabel] = useState("Camara local");
  const [analysisState, setAnalysisState] = useState<"idle" | "analyzing" | "ready" | "error">("idle");
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (cameraState !== "live") {
      return;
    }

    const warmup = window.setTimeout(() => {
      void analyzeFrame();
    }, 900);
    const interval = window.setInterval(() => {
      void analyzeFrame();
    }, 3000);

    return () => {
      window.clearTimeout(warmup);
      window.clearInterval(interval);
    };
  }, [cameraState, deviceLabel]);

  async function startCamera(nextFacingMode = facingMode) {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("unsupported");
      return;
    }

    setCameraState("starting");

    try {
      stopCamera();
      setAnalysisResult(null);
      setAnalysisError(null);
      setAnalysisState("idle");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: nextFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      const [track] = stream.getVideoTracks();
      setDeviceLabel(track?.label || (nextFacingMode === "environment" ? "Camara trasera" : "Camara frontal"));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraState("live");
    } catch {
      setCameraState("blocked");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    analysisInFlightRef.current = false;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraState((current) => (current === "starting" ? "idle" : current === "live" ? "idle" : current));
  }

  async function switchCamera() {
    const nextFacingMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacingMode);

    if (cameraState === "live") {
      await startCamera(nextFacingMode);
    }
  }

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setFrameCount((count) => count + 1);
    setLastFrame(new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

    return canvas.toDataURL("image/jpeg", 0.72);
  }

  async function analyzeFrame() {
    const frame = captureFrame();

    if (!frame || analysisInFlightRef.current) {
      return;
    }

    analysisInFlightRef.current = true;
    setAnalysisState("analyzing");
    setAnalysisError(null);

    try {
      const response = await fetch("/api/analyze-frame", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frame,
          source: deviceLabel,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo analizar el frame.");
      }

      const result = (await response.json()) as AnalyzeResult;
      setAnalysisResult(result);
      setAnalysisState("ready");
    } catch (error) {
      setAnalysisState("error");
      setAnalysisError(error instanceof Error ? error.message : "Fallo inesperado al analizar.");
    } finally {
      analysisInFlightRef.current = false;
    }
  }

  const stateText = {
    idle: "Lista para iniciar",
    starting: "Solicitando permiso",
    live: "Transmision en vivo",
    blocked: "Permiso bloqueado",
    unsupported: "Camara no disponible",
  }[cameraState];

  return (
    <section className="live-camera-panel" id="en-vivo">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Prueba de campo</p>
          <h3>Camara del dispositivo</h3>
        </div>
        <span className={`live-state ${cameraState}`}>
          <span aria-hidden="true" />
          {stateText}
        </span>
      </div>

      <div className="live-camera-grid">
        <div className="live-stage">
          <video ref={videoRef} className="device-video" playsInline muted aria-label="Vista en vivo de la camara" />
          {cameraState !== "live" ? (
            <div className="camera-placeholder">
              <Camera size={34} aria-hidden="true" />
              <strong>Activa la camara para comenzar</strong>
              <p>El video se queda en tu navegador hasta que conectemos el backend de IA.</p>
            </div>
          ) : null}
          <div className="live-reticle" aria-hidden="true">
            <span />
            <span />
          </div>
          {cameraState === "live" && analysisResult
            ? analysisResult.detections.map((detection) => (
                <span
                  className={`vision-box ${detection.status}`}
                  key={detection.id}
                  style={{
                    left: `${detection.box[0]}%`,
                    top: `${detection.box[1]}%`,
                    width: `${detection.box[2] - detection.box[0]}%`,
                    height: `${detection.box[3] - detection.box[1]}%`,
                  }}
                >
                  {detection.label} {detection.confidence.toFixed(2)}
                </span>
              ))
            : null}
        </div>

        <aside className="live-control-panel">
          <div className="live-control-header">
            <Video size={19} aria-hidden="true" />
            <div>
              <strong>{deviceLabel}</strong>
              <span>{cameraState === "live" ? "Supervision continua" : "Fuente local"}</span>
            </div>
          </div>

          <div className="live-actions">
            {cameraState === "live" ? (
              <button className="danger-action" onClick={stopCamera} type="button">
                <CameraOff size={18} aria-hidden="true" />
                Detener
              </button>
            ) : (
              <button className="primary-action" onClick={() => startCamera()} type="button">
                <Camera size={18} aria-hidden="true" />
                Iniciar camara
              </button>
            )}
            <button className="secondary-action" onClick={switchCamera} type="button">
              <FlipHorizontal size={17} aria-hidden="true" />
              Cambiar
            </button>
            <button className="secondary-action" disabled={cameraState !== "live"} onClick={captureFrame} type="button">
              <ScanLine size={17} aria-hidden="true" />
              Capturar evidencia
            </button>
          </div>

          <div className={`continuous-status ${cameraState === "live" ? "active" : ""}`}>
            {analysisState === "analyzing" ? <Loader2 className="spin-icon" size={17} aria-hidden="true" /> : <Activity size={17} aria-hidden="true" />}
            <div>
              <strong>{cameraState === "live" ? "Analisis continuo activo" : "Analisis continuo en espera"}</strong>
              <span>Medusa analiza un frame cada 3 s mientras la camara esta encendida.</span>
            </div>
          </div>

          <div className="live-readings" aria-label="Estado de captura">
            <div>
              <span>Frames capturados</span>
              <strong>{frameCount}</strong>
            </div>
            <div>
              <span>Ultimo frame</span>
              <strong>{lastFrame ?? "--"}</strong>
            </div>
            <div>
              <span>Latencia IA</span>
              <strong>{analysisResult ? `${analysisResult.latencyMs} ms` : "Backend IA"}</strong>
            </div>
          </div>

          {analysisResult ? (
            <div className="analysis-result" aria-label="Resultado de analisis IA simulado">
              <div className="analysis-summary">
                <div>
                  <span>Modo</span>
                  <strong>{analysisResult.mode.toUpperCase()}</strong>
                </div>
                <div>
                  <span>Personas</span>
                  <strong>{analysisResult.summary.people}</strong>
                </div>
                <div>
                  <span>Cumplimiento</span>
                  <strong>{analysisResult.summary.compliance}%</strong>
                </div>
                <div>
                  <span>Alertas</span>
                  <strong>{analysisResult.summary.alerts}</strong>
                </div>
              </div>

              <div className="detection-list">
                {analysisResult.detections.map((detection) => (
                  <div className={`detection-row ${detection.status}`} key={detection.id}>
                    <div>
                      <strong>{detection.label}</strong>
                      <span>Conf. {detection.confidence.toFixed(2)}</span>
                    </div>
                    <em>{statusLabel[detection.status]}</em>
                  </div>
                ))}
              </div>

              {analysisResult.alerts.length ? (
                <div className="alert-list">
                  {analysisResult.alerts.map((alert) => (
                    <p key={`${alert.type}-${alert.confidence}`}>
                      {alert.type} - {alert.severity} - {alert.state}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="clear-analysis">Sin alertas simuladas en este frame.</p>
              )}
            </div>
          ) : (
            <div className="analysis-placeholder">
              <Square size={14} aria-hidden="true" />
              <p>Inicia la camara y Medusa comenzara a supervisar de forma continua.</p>
            </div>
          )}

          {analysisError ? <p className="analysis-error">{analysisError}</p> : null}
        </aside>
      </div>

      <canvas ref={canvasRef} className="capture-canvas" aria-hidden="true" />
    </section>
  );
}

const statusLabel: Record<DetectionStatus, string> = {
  ok: "OK",
  warning: "Revision",
  missing: "Falta",
};

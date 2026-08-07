"use client";

import { Camera, CameraOff, FlipHorizontal, ScanLine, Square, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CameraState = "idle" | "starting" | "live" | "blocked" | "unsupported";

export function DeviceCameraPanel() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [frameCount, setFrameCount] = useState(0);
  const [lastFrame, setLastFrame] = useState<string | null>(null);
  const [deviceLabel, setDeviceLabel] = useState("Camara local");

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera(nextFacingMode = facingMode) {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("unsupported");
      return;
    }

    setCameraState("starting");

    try {
      stopCamera();
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
        </div>

        <aside className="live-control-panel">
          <div className="live-control-header">
            <Video size={19} aria-hidden="true" />
            <div>
              <strong>{deviceLabel}</strong>
              <span>{cameraState === "live" ? "Fuente activa" : "Fuente local"}</span>
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
              Capturar frame
            </button>
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
              <span>Proximo paso</span>
              <strong>Backend IA</strong>
            </div>
          </div>

          <div className="analysis-placeholder">
            <Square size={14} aria-hidden="true" />
            <p>La deteccion de casco, chaleco y persona se conectara a este mismo flujo.</p>
          </div>
        </aside>
      </div>

      <canvas ref={canvasRef} className="capture-canvas" aria-hidden="true" />
    </section>
  );
}

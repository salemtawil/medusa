const cameras = [
  {
    id: "CAM-01",
    name: "Acceso norte",
    source: "RTSP",
    zone: "Zona construccion",
    status: "Operativa",
    fps: 24,
    latency: "164 ms",
    compliance: 92,
    alerts: 2,
  },
  {
    id: "CAM-02",
    name: "Linea de carga",
    source: "Archivo piloto",
    zone: "Carga pesada",
    status: "Revision",
    fps: 18,
    latency: "241 ms",
    compliance: 81,
    alerts: 5,
  },
  {
    id: "CAM-03",
    name: "Bodega quimicos",
    source: "Webcam",
    zone: "Restringida",
    status: "Pausada",
    fps: 0,
    latency: "--",
    compliance: 100,
    alerts: 0,
  },
];

const events = [
  {
    time: "17:42:18",
    camera: "CAM-02",
    track: "P-184",
    zone: "Carga pesada",
    rule: "Casco faltante",
    confidence: "0.87",
    state: "Confirmada",
  },
  {
    time: "17:39:04",
    camera: "CAM-01",
    track: "P-031",
    zone: "Zona construccion",
    rule: "Chaleco no visible",
    confidence: "0.79",
    state: "En revision",
  },
  {
    time: "17:31:55",
    camera: "CAM-02",
    track: "P-177",
    zone: "Carga pesada",
    rule: "Guantes faltantes",
    confidence: "0.72",
    state: "Sospecha",
  },
  {
    time: "17:20:11",
    camera: "CAM-01",
    track: "P-025",
    zone: "Zona construccion",
    rule: "Recuperado",
    confidence: "0.94",
    state: "Cerrada",
  },
];

const rules = [
  ["Casco", "Obligatorio", "1.5 s", "Alta"],
  ["Chaleco reflectivo", "Obligatorio", "1.5 s", "Alta"],
  ["Guantes", "Por zona", "2.0 s", "Media"],
  ["Botas", "Por zona", "3.0 s", "Media"],
  ["Gafas", "Por tarea", "2.0 s", "Media"],
];

export default function Home() {
  const activeCameras = cameras.filter((camera) => camera.status !== "Pausada").length;
  const totalAlerts = cameras.reduce((sum, camera) => sum + camera.alerts, 0);
  const averageCompliance = Math.round(
    cameras.reduce((sum, camera) => sum + camera.compliance, 0) / cameras.length,
  );

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegacion principal">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            M
          </div>
          <div>
            <p className="eyebrow">Medusa</p>
            <h1>Control EPP</h1>
          </div>
        </div>

        <nav className="nav-stack" aria-label="Secciones">
          <a className="nav-item active" href="#operacion">
            <span aria-hidden="true">●</span> Operacion
          </a>
          <a className="nav-item" href="#camaras">
            <span aria-hidden="true">●</span> Camaras
          </a>
          <a className="nav-item" href="#eventos">
            <span aria-hidden="true">●</span> Eventos
          </a>
          <a className="nav-item" href="#reglas">
            <span aria-hidden="true">●</span> Reglas
          </a>
        </nav>

        <div className="system-panel">
          <p className="panel-label">Pipeline</p>
          <ol>
            <li>Ingesta RTSP</li>
            <li>Detector EPP</li>
            <li>Tracking</li>
            <li>Reglas temporales</li>
          </ol>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar" id="operacion">
          <div>
            <p className="eyebrow">Centro de vigilancia industrial</p>
            <h2>Operacion en tiempo real</h2>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Actualizar tablero" title="Actualizar tablero">
              ↻
            </button>
            <button className="primary-action">Nueva zona</button>
          </div>
        </header>

        <section className="metric-grid" aria-label="Indicadores principales">
          <article className="metric">
            <span>Camaras activas</span>
            <strong>{activeCameras}/{cameras.length}</strong>
            <small>1 fuente pausada</small>
          </article>
          <article className="metric">
            <span>Cumplimiento</span>
            <strong>{averageCompliance}%</strong>
            <small>Promedio operativo</small>
          </article>
          <article className="metric warn">
            <span>Alertas abiertas</span>
            <strong>{totalAlerts}</strong>
            <small>Ultimos 30 minutos</small>
          </article>
          <article className="metric">
            <span>Latencia media</span>
            <strong>202 ms</strong>
            <small>CPU piloto</small>
          </article>
        </section>

        <section className="content-grid">
          <div className="camera-section" id="camaras">
            <div className="section-heading">
              <h3>Camaras</h3>
              <div className="segmented" aria-label="Filtro de camaras">
                <button className="selected">Todas</button>
                <button>Activas</button>
                <button>Alertas</button>
              </div>
            </div>

            <div className="camera-grid">
              {cameras.map((camera) => (
                <article className="camera-card" key={camera.id}>
                  <div className="video-tile" aria-label={`Vista de ${camera.name}`}>
                    <div className="scan-line" />
                    <span className={`status-dot ${camera.status.toLowerCase()}`} />
                    <p>{camera.id}</p>
                    <strong>{camera.name}</strong>
                  </div>
                  <div className="camera-meta">
                    <div>
                      <span>Fuente</span>
                      <strong>{camera.source}</strong>
                    </div>
                    <div>
                      <span>Zona</span>
                      <strong>{camera.zone}</strong>
                    </div>
                    <div>
                      <span>FPS</span>
                      <strong>{camera.fps}</strong>
                    </div>
                    <div>
                      <span>Latencia</span>
                      <strong>{camera.latency}</strong>
                    </div>
                  </div>
                  <div className="compliance-row">
                    <span>Cumplimiento</span>
                    <div className="meter" aria-label={`${camera.compliance}% cumplimiento`}>
                      <div style={{ width: `${camera.compliance}%` }} />
                    </div>
                    <strong>{camera.compliance}%</strong>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="rules-panel" id="reglas">
            <div className="section-heading compact">
              <h3>Reglas EPP</h3>
              <button className="icon-button" aria-label="Editar reglas" title="Editar reglas">
                ⚙
              </button>
            </div>
            <div className="rule-list">
              {rules.map(([name, mode, duration, risk]) => (
                <div className="rule-row" key={name}>
                  <div>
                    <strong>{name}</strong>
                    <span>{mode}</span>
                  </div>
                  <p>{duration}</p>
                  <em>{risk}</em>
                </div>
              ))}
            </div>
            <div className="threshold-box">
              <label htmlFor="threshold">Umbral de confianza</label>
              <input id="threshold" type="range" min="0" max="100" defaultValue="72" aria-label="Umbral de confianza" />
              <div>
                <span>0.40</span>
                <strong>0.72</strong>
                <span>0.95</span>
              </div>
            </div>
          </aside>
        </section>

        <section className="events-section" id="eventos">
          <div className="section-heading">
            <h3>Eventos recientes</h3>
            <button className="secondary-action">Exportar JSON</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Camara</th>
                  <th>Persona</th>
                  <th>Zona</th>
                  <th>Regla</th>
                  <th>Conf.</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={`${event.time}-${event.track}`}>
                    <td>{event.time}</td>
                    <td>{event.camera}</td>
                    <td>{event.track}</td>
                    <td>{event.zone}</td>
                    <td>{event.rule}</td>
                    <td>{event.confidence}</td>
                    <td>
                      <span className="state-chip">{event.state}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

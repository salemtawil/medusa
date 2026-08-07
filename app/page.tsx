import {
  Bell,
  Camera,
  ChevronRight,
  Download,
  Gauge,
  LayoutDashboard,
  Menu,
  Plus,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  TriangleAlert,
  Video,
} from "lucide-react";

const cameras = [
  {
    id: "CAM-01",
    name: "Acceso norte",
    source: "RTSP",
    zone: "Zona construccion",
    status: "Operativa",
    health: "online",
    fps: 24,
    latency: "164 ms",
    compliance: 92,
    alerts: 2,
    people: 18,
  },
  {
    id: "CAM-02",
    name: "Linea de carga",
    source: "Archivo piloto",
    zone: "Carga pesada",
    status: "Revision",
    health: "warning",
    fps: 18,
    latency: "241 ms",
    compliance: 81,
    alerts: 5,
    people: 11,
  },
  {
    id: "CAM-03",
    name: "Bodega quimicos",
    source: "Webcam",
    zone: "Restringida",
    status: "Pausada",
    health: "paused",
    fps: 0,
    latency: "--",
    compliance: 100,
    alerts: 0,
    people: 0,
  },
];

const events = [
  {
    time: "17:42",
    camera: "CAM-02",
    track: "P-184",
    zone: "Carga pesada",
    rule: "Casco faltante",
    confidence: "0.87",
    state: "Confirmada",
    severity: "Alta",
  },
  {
    time: "17:39",
    camera: "CAM-01",
    track: "P-031",
    zone: "Zona construccion",
    rule: "Chaleco no visible",
    confidence: "0.79",
    state: "En revision",
    severity: "Alta",
  },
  {
    time: "17:31",
    camera: "CAM-02",
    track: "P-177",
    zone: "Carga pesada",
    rule: "Guantes faltantes",
    confidence: "0.72",
    state: "Sospecha",
    severity: "Media",
  },
  {
    time: "17:20",
    camera: "CAM-01",
    track: "P-025",
    zone: "Zona construccion",
    rule: "Recuperado",
    confidence: "0.94",
    state: "Cerrada",
    severity: "Baja",
  },
];

const rules = [
  ["Casco", "Obligatorio", "1.5 s", "Alta"],
  ["Chaleco reflectivo", "Obligatorio", "1.5 s", "Alta"],
  ["Guantes", "Por zona", "2.0 s", "Media"],
  ["Botas", "Por zona", "3.0 s", "Media"],
  ["Gafas", "Por tarea", "2.0 s", "Media"],
];

const navItems = [
  ["Operacion", "#operacion", LayoutDashboard],
  ["Camaras", "#camaras", Video],
  ["Eventos", "#eventos", Bell],
  ["Reglas", "#reglas", SlidersHorizontal],
] as const;

export default function Home() {
  const activeCameras = cameras.filter((camera) => camera.status !== "Pausada").length;
  const totalAlerts = cameras.reduce((sum, camera) => sum + camera.alerts, 0);
  const averageCompliance = Math.round(
    cameras.reduce((sum, camera) => sum + camera.compliance, 0) / cameras.length,
  );
  const peopleDetected = cameras.reduce((sum, camera) => sum + camera.people, 0);

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegacion principal">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <ShieldCheck size={24} strokeWidth={2.4} />
          </div>
          <div>
            <p className="eyebrow">Medusa</p>
            <h1>Control EPP</h1>
          </div>
        </div>

        <nav className="nav-stack" aria-label="Secciones">
          {navItems.map(([label, href, Icon], index) => (
            <a className={`nav-item ${index === 0 ? "active" : ""}`} href={href} key={label}>
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="system-panel">
          <p className="panel-label">Pipeline activo</p>
          <ol>
            <li>Ingesta RTSP</li>
            <li>Detector EPP</li>
            <li>Tracking multi-persona</li>
            <li>Reglas temporales</li>
          </ol>
        </div>
      </aside>

      <section className="workspace">
        <header className="mobile-appbar" aria-label="Barra superior movil">
          <button className="icon-button ghost" aria-label="Abrir menu" title="Abrir menu">
            <Menu size={20} />
          </button>
          <div className="mobile-brand">
            <strong>Medusa</strong>
            <span>Control EPP</span>
          </div>
          <button className="icon-button ghost" aria-label="Alertas" title="Alertas">
            <Bell size={19} />
          </button>
        </header>

        <header className="topbar" id="operacion">
          <div className="title-block">
            <p className="eyebrow">Centro de vigilancia industrial</p>
            <h2>Operacion en tiempo real</h2>
            <p>Monitoreo de camaras, cumplimiento EPP y eventos criticos para supervision en planta.</p>
          </div>
          <div className="topbar-actions" aria-label="Acciones principales">
            <button className="icon-button" aria-label="Actualizar tablero" title="Actualizar tablero">
              <RefreshCw size={18} />
            </button>
            <button className="primary-action">
              <Plus size={18} aria-hidden="true" />
              Nueva zona
            </button>
          </div>
        </header>

        <section className="status-strip" aria-label="Estado del sistema">
          <div>
            <span className="live-dot" aria-hidden="true" />
            <strong>Modo vigilancia</strong>
          </div>
          <p>Ultima lectura hace 18 s</p>
        </section>

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
            <span>Personas detectadas</span>
            <strong>{peopleDetected}</strong>
            <small>Tracks activos</small>
          </article>
        </section>

        <section className="content-grid">
          <div className="camera-section" id="camaras">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Fuentes de video</p>
                <h3>Camaras</h3>
              </div>
              <div className="segmented" aria-label="Filtro de camaras">
                <button className="selected">Todas</button>
                <button>Activas</button>
                <button>Alertas</button>
              </div>
            </div>

            <div className="camera-grid">
              {cameras.map((camera) => (
                <article className="camera-card" key={camera.id}>
                  <div className={`video-tile ${camera.health}`} aria-label={`Vista de ${camera.name}`}>
                    <div className="camera-overlay">
                      <span className={`status-pill ${camera.health}`}>
                        <span aria-hidden="true" />
                        {camera.status}
                      </span>
                      <span>{camera.id}</span>
                    </div>
                    <div className="feed-frame" aria-hidden="true">
                      <span className="detection-box worker-one" />
                      <span className="detection-box worker-two" />
                      <span className="safe-line" />
                    </div>
                    <div className="camera-title">
                      <p>{camera.zone}</p>
                      <strong>{camera.name}</strong>
                    </div>
                  </div>

                  <div className="camera-meta">
                    <div>
                      <span>Fuente</span>
                      <strong>{camera.source}</strong>
                    </div>
                    <div>
                      <span>FPS</span>
                      <strong>{camera.fps}</strong>
                    </div>
                    <div>
                      <span>Latencia</span>
                      <strong>{camera.latency}</strong>
                    </div>
                    <div>
                      <span>Personas</span>
                      <strong>{camera.people}</strong>
                    </div>
                  </div>

                  <div className="compliance-row">
                    <span>Cumplimiento</span>
                    <div className="meter" aria-label={`${camera.compliance}% cumplimiento`}>
                      <div style={{ width: `${camera.compliance}%` }} />
                    </div>
                    <strong>{camera.compliance}%</strong>
                  </div>

                  <button className="card-action" aria-label={`Abrir detalle de ${camera.name}`}>
                    Ver detalle
                    <ChevronRight size={17} aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          </div>

          <aside className="rules-panel" id="reglas">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">Politicas EPP</p>
                <h3>Reglas activas</h3>
              </div>
              <button className="icon-button" aria-label="Editar reglas" title="Editar reglas">
                <SlidersHorizontal size={18} />
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
            <div>
              <p className="section-kicker">Bitacora operativa</p>
              <h3>Eventos recientes</h3>
            </div>
            <button className="secondary-action">
              <Download size={17} aria-hidden="true" />
              Exportar
            </button>
          </div>

          <div className="event-list" aria-label="Eventos recientes en formato movil">
            {events.map((event) => (
              <article className="event-card" key={`${event.time}-${event.track}`}>
                <div className="event-icon" aria-hidden="true">
                  {event.state === "Cerrada" ? <ShieldCheck size={18} /> : <TriangleAlert size={18} />}
                </div>
                <div>
                  <div className="event-heading">
                    <strong>{event.rule}</strong>
                    <span>{event.time}</span>
                  </div>
                  <p>{event.camera} - {event.track} - {event.zone}</p>
                  <div className="event-tags">
                    <span>{event.state}</span>
                    <span>Conf. {event.confidence}</span>
                    <span>{event.severity}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="table-wrap" aria-label="Eventos recientes en tabla">
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

      <nav className="bottom-nav" aria-label="Navegacion movil">
        {navItems.map(([label, href, Icon], index) => (
          <a className={index === 0 ? "active" : ""} href={href} key={label}>
            <Icon size={19} aria-hidden="true" />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </main>
  );
}

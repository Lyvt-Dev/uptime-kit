import { Refresh } from "./refresh";

export const dynamic = "force-dynamic";

type Monitor = {
  id: number;
  name: string;
  url: string;
  status: "UP" | "DOWN" | "UNKNOWN";
  lastStatusCode: number | null;
  lastLatencyMs: number | null;
  averageLatencyMs: number | null;
  uptimePercentage: number | null;
  checks24h: number;
  lastCheckedAt: string | null;
};
type StatusResponse = { generatedAt: string; monitors: Monitor[] };
async function getStatus(): Promise<StatusResponse | null> {
  try {
    const response = await fetch(`${process.env.API_URL ?? "http://localhost:3001"}/api/status`, {
      cache: "no-store", signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    return await response.json() as StatusResponse;
  } catch { return null; }
}
const text = (n: number | null, suffix: string) => n === null ? "—" : `${n}${suffix}`;

export default async function Home() {
  const result = await getStatus();
  const monitors = result?.monitors ?? [];
  const isHealthy = result !== null && monitors.every(m => m.status === "UP");
  const unhealthy = monitors.some(m => m.status === "DOWN");
  return <main className="shell">
    <Refresh />
    <header className="header">
      <a className="brand" href="/"><span className="logo">⌁</span> uptime<span className="brandLight">kit</span></a>
      <span className="live"><span className="liveDot" /> LIVE MONITORING</span>
    </header>
    <section className="hero">
      <p className="eyebrow">SYSTEM STATUS</p>
      <h1>Know when things<br/><span>go offline.</span></h1>
      <p className="lead">Real-time service health, latency and 24-hour uptime. Transparent by default.</p>
      <div className={`banner ${isHealthy ? "good" : unhealthy ? "bad" : "unknown"}`}>
        <span className="statusDot"/>
        <div><strong>{!result ? "Status API unavailable" : monitors.length === 0 ? "No monitors configured" : isHealthy ? "All systems operational" : "Some systems are experiencing issues"}</strong>
          <p>{!result ? "The monitoring backend could not be reached." : "Updated automatically every 30 seconds."}</p></div>
        <span className="statusPill">{!result ? "UNAVAILABLE" : isHealthy ? "OPERATIONAL" : unhealthy ? "ISSUES DETECTED" : "WAITING"}</span>
      </div>
    </section>
    <section className="services">
      <div className="sectionHeader"><div><p className="eyebrow">OVERVIEW</p><h2>Monitored services</h2></div><span className="serviceCount">{monitors.length} services</span></div>
      <div className="cards">
        {monitors.map(m => <article key={m.id} className="card">
          <div className="cardTop"><div><h3>{m.name}</h3><p className="host">{new URL(m.url).host}</p></div><span className={`chip ${m.status.toLowerCase()}`}><span className="chipDot"/>{m.status}</span></div>
          <div className="metrics">
            <div><span>24H UPTIME</span><strong>{text(m.uptimePercentage, "%")}</strong></div>
            <div><span>AVG. LATENCY</span><strong>{text(m.averageLatencyMs, " ms")}</strong></div>
            <div><span>LAST RESPONSE</span><strong>{m.lastStatusCode ?? "—"}</strong></div>
          </div>
          <p className="cardFooter">{m.checks24h} checks in the last 24 hours</p>
        </article>)}
        {monitors.length === 0 && <div className="empty">Configure a monitor in <code>MONITORS_JSON</code> to get started.</div>}
      </div>
    </section>
    <footer><span>Powered by <strong>Uptime Kit</strong></span><span>Open-source · Self-hosted · Lightweight</span></footer>
  </main>;
}

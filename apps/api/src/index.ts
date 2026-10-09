import Fastify from "fastify";
import { gte, eq, desc } from "drizzle-orm";
import { db } from "./db.js";
import { monitors, heartbeats } from "./schema.js";
import { loadMonitors } from "./config.js";
import { startWorker, stopWorker } from "./worker.js";

const app = Fastify({ logger: true });
app.get("/health", async () => ({ ok: true }));
app.get("/api/status", async (_request, reply) => {
  reply.header("Cache-Control", "no-store");
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const all = db.select().from(monitors).all();
  return {
    generatedAt: new Date().toISOString(),
    monitors: all.map((monitor) => {
      const checks = db.select().from(heartbeats)
        .where(eq(heartbeats.monitorId, monitor.id))
        .orderBy(desc(heartbeats.checkedAt)).all()
        .filter((heartbeat) => heartbeat.checkedAt >= since);
      const successes = checks.filter((check) => check.isUp).length;
      const averageLatencyMs = checks.length
        ? Math.round(checks.reduce((sum, check) => sum + check.latencyMs, 0) / checks.length)
        : null;
      const uptimePercentage = checks.length
        ? Math.round((successes / checks.length) * 10000) / 100
        : null;
      return {
        id: monitor.id, name: monitor.name, url: monitor.url,
        status: monitor.status, intervalSeconds: monitor.intervalSeconds,
        lastCheckedAt: monitor.lastCheckedAt === null ? null : new Date(monitor.lastCheckedAt).toISOString(),
        lastStatusCode: monitor.lastStatusCode, lastLatencyMs: monitor.lastLatencyMs,
        averageLatencyMs, uptimePercentage, checks24h: checks.length,
      };
    }),
  };
});

const config = loadMonitors();
startWorker(config);
const port = Number(process.env.PORT ?? "3001");
try {
  await app.listen({ port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  stopWorker();
  process.exit(1);
}
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    stopWorker();
    void app.close().finally(() => process.exit(0));
  });
}

import { eq } from "drizzle-orm";
import { performance } from "node:perf_hooks";
import { db } from "./db.js";
import { monitors, heartbeats } from "./schema.js";
import { notifyTransition } from "./alerts.js";
import type { MonitorInput } from "./config.js";

type Monitor = typeof monitors.$inferSelect;
const timers: NodeJS.Timeout[] = [];
const busy = new Set<number>();

/** Record one HTTP check; use elapsed time for both success and failure. */
async function check(monitor: Monitor): Promise<void> {
  if (busy.has(monitor.id)) return;
  busy.add(monitor.id);
  const start = performance.now();
  let statusCode: number | null = null;
  let error: string | null = null;
  let up = false;
  try {
    const response = await fetch(monitor.url, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
      redirect: "error",
      headers: { "user-agent": "UptimeKit/0.1 (+self-hosted monitor)" },
    });
    statusCode = response.status;
    up = statusCode < 400;
    // The check measures time-to-headers, so the response body is not downloaded.
    await response.body?.cancel();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }
  const latencyMs = Math.round((performance.now() - start) * 100) / 100;
  const next = up ? "UP" : "DOWN";
  const previous = monitor.status;
  const checkedAt = Date.now();

  try {
    db.transaction((tx) => {
      tx.insert(heartbeats).values({
        monitorId: monitor.id, checkedAt, isUp: up, statusCode, latencyMs, error,
      }).run();
      tx.update(monitors).set({
        status: next, lastCheckedAt: checkedAt, lastStatusCode: statusCode, lastLatencyMs: latencyMs,
      }).where(eq(monitors.id, monitor.id)).run();
    });
    monitor.status = next;
    if (previous !== "UNKNOWN" && previous !== next) {
      try {
        await notifyTransition(monitor.name, monitor.url, previous, next);
      } catch (cause) {
        console.error("Alert delivery failed:", cause);
      }
    }
  } catch (cause) {
    console.error(`Failed to store heartbeat for ${monitor.name}:`, cause);
  } finally {
    busy.delete(monitor.id);
  }
}

export function startWorker(configured: MonitorInput[]): void {
  for (const input of configured) {
    db.insert(monitors).values(input).onConflictDoUpdate({
      target: monitors.url,
      set: { name: input.name, intervalSeconds: input.intervalSeconds },
    }).run();
    const monitor = db.select().from(monitors).where(eq(monitors.url, input.url)).get();
    if (!monitor) continue;
    void check(monitor);
    const interval = setInterval(() => void check(monitor), input.intervalSeconds * 1000);
    timers.push(interval);
    console.log(`Monitoring ${monitor.name} every ${monitor.intervalSeconds}s`);
  }
}

export function stopWorker(): void {
  for (const timer of timers) clearInterval(timer);
  timers.length = 0;
}

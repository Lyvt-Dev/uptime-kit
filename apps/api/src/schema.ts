import { integer, real, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const monitors = sqliteTable("monitors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  intervalSeconds: integer("interval_seconds").notNull(),
  status: text("status", { enum: ["UNKNOWN", "UP", "DOWN"] }).notNull().default("UNKNOWN"),
  lastCheckedAt: integer("last_checked_at"),
  lastStatusCode: integer("last_status_code"),
  lastLatencyMs: real("last_latency_ms"),
});

export const heartbeats = sqliteTable("heartbeats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  monitorId: integer("monitor_id").notNull().references(() => monitors.id, { onDelete: "cascade" }),
  checkedAt: integer("checked_at").notNull(),
  isUp: integer("is_up", { mode: "boolean" }).notNull(),
  statusCode: integer("status_code"),
  latencyMs: real("latency_ms").notNull(),
  error: text("error"),
}, (t) => [index("heartbeats_monitor_time_idx").on(t.monitorId, t.checkedAt)]);

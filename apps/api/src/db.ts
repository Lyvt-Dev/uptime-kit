import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema.js";

const file = process.env.DATABASE_PATH ?? "./uptime.db";
mkdirSync(dirname(file), { recursive: true });
const sqlite = new Database(file);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.exec(`
CREATE TABLE IF NOT EXISTS monitors (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, url TEXT NOT NULL UNIQUE,
 interval_seconds INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'UNKNOWN',
 last_checked_at INTEGER, last_status_code INTEGER, last_latency_ms REAL
);
CREATE TABLE IF NOT EXISTS heartbeats (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 monitor_id INTEGER NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
 checked_at INTEGER NOT NULL, is_up INTEGER NOT NULL,
 status_code INTEGER, latency_ms REAL NOT NULL, error TEXT
);
CREATE INDEX IF NOT EXISTS heartbeats_monitor_time_idx ON heartbeats(monitor_id, checked_at);
`);
export const db = drizzle(sqlite, { schema });
export { sqlite };

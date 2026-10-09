import { z } from "zod";
const MonitorInput = z.object({
  name: z.string().trim().min(1).max(100),
  url: z.url().refine(v => ["http:", "https:"].includes(new URL(v).protocol), "HTTP(S) only"),
  intervalSeconds: z.number().int().min(10).max(86400).default(60),
});
export type MonitorInput = z.infer<typeof MonitorInput>;
export function loadMonitors(): MonitorInput[] {
  const input: unknown = JSON.parse(process.env.MONITORS_JSON ?? "[]");
  const parsed = z.array(MonitorInput).parse(input);
  if (new Set(parsed.map(m => m.url)).size !== parsed.length) throw new Error("Duplicate URLs in MONITORS_JSON");
  return parsed;
}

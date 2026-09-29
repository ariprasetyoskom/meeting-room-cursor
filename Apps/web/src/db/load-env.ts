import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** CLI scripts — load .env.local then .env (manual parse; reliable on Windows). */
export function loadAppEnv() {
  const root = process.cwd();
  const merged: Record<string, string> = {};
  for (const file of [".env", ".env.local"]) {
    const path = join(root, file);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      merged[key] = trimmed.slice(eq + 1).trim();
    }
  }
  for (const [key, value] of Object.entries(merged)) {
    process.env[key] = value;
  }
}

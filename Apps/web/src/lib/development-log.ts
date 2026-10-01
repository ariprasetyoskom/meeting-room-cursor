import { appendFile, mkdir } from "fs/promises";
import path from "path";

export type DevLogLevel = "info" | "warn" | "error";

export type DevLogEntry = {
  ts: string;
  channel: string;
  level: DevLogLevel;
  event: string;
  data?: Record<string, unknown>;
};

/** Folder `Development/logs` di root monorepo (atau `DEVELOPMENT_LOG_DIR`). */
export function resolveDevelopmentLogDir(): string {
  const override = process.env.DEVELOPMENT_LOG_DIR?.trim();
  if (override) {
    if (/^[a-zA-Z]:[/\\]/.test(override)) {
      return override.replace(/\//g, "\\");
    }
    return path.resolve(override);
  }

  const cwd = process.cwd();
  const fromWebApp = path.resolve(cwd, "..", "..", "Development", "logs");
  const fromRepoRoot = path.resolve(cwd, "Development", "logs");
  if (cwd.replace(/\\/g, "/").endsWith("/Apps/web")) {
    return fromWebApp;
  }
  return fromRepoRoot;
}

export async function appendDevelopmentLog(
  entry: Omit<DevLogEntry, "ts"> & { ts?: string },
): Promise<void> {
  const dir = resolveDevelopmentLogDir();
  await mkdir(dir, { recursive: true });
  const record: DevLogEntry = {
    ...entry,
    ts: entry.ts ?? new Date().toISOString(),
  };
  const file = path.join(dir, `${entry.channel}.jsonl`);
  await appendFile(file, `${JSON.stringify(record)}\n`, "utf8");
}

export function developmentDataPath(filename: string): string {
  return path.join(resolveDevelopmentLogDir(), filename);
}

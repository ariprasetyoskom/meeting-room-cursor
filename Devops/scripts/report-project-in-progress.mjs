#!/usr/bin/env node
/**
 * @deprecated Prefer run-project-scheduler.mjs — wrapper laporan In Progress saja.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const args = ["Devops/scripts/run-project-scheduler.mjs"];
if (process.argv.includes("--json")) args.push("--json");

const r = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit", shell: false });
process.exit(r.status ?? 1);

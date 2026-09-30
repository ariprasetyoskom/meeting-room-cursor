import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

export function getRepoRoot() {
  return root;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function runGh(args) {
  const r = spawnSync("gh", args, { cwd: root, encoding: "utf8", shell: false });
  return {
    ok: r.status === 0,
    out: (r.stdout || "").trim(),
    err: (r.stderr || "").trim(),
    code: r.status,
  };
}

/** FR-SCH-03: gagal jelas tanpa mengekspos token */
export function assertProjectAuth() {
  const token = process.env.GH_TOKEN || process.env.GH_PROJECT_PAT;
  if (process.env.GITHUB_ACTIONS === "true" && !token) {
    throw new Error(
      "GH_PROJECT_PAT belum diset di GitHub Actions Secrets (scope project).",
    );
  }
  const r = runGh(["auth", "status"]);
  if (!r.ok) {
    throw new Error(
      "gh CLI belum login. Lokal: gh auth login -s project. CI: set GH_TOKEN dari GH_PROJECT_PAT.",
    );
  }
}

export async function ghWithBackoff(args, label) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = runGh(args);
    if (r.ok) return r.out;
    const msg = r.err || r.out;
    if (/rate limit/i.test(msg)) {
      const wait = Math.min(120_000, 15_000 * 2 ** attempt);
      console.warn(`[rate limit] ${label}: tunggu ${wait / 1000}s…`);
      await sleep(wait);
      continue;
    }
    throw new Error(`${label}: ${msg}`);
  }
  throw new Error(`${label}: rate limit (max retries)`);
}

export async function loadProjectItems(owner, projectNumber) {
  const raw = await ghWithBackoff(
    [
      "project",
      "item-list",
      projectNumber,
      "--owner",
      owner,
      "--limit",
      "100",
      "--format",
      "json",
    ],
    "project item-list",
  );
  return JSON.parse(raw).items || [];
}

export async function loadIssueStates(repo) {
  const raw = await ghWithBackoff(
    [
      "issue",
      "list",
      "-R",
      repo,
      "--state",
      "all",
      "--limit",
      "100",
      "--json",
      "number,state",
    ],
    "issue list",
  );
  const map = new Map();
  for (const row of JSON.parse(raw)) {
    map.set(row.number, row.state);
  }
  return map;
}

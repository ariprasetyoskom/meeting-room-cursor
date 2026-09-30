#!/usr/bin/env node
/**
 * Selaraskan kolom Project "Status" dengan state issue GitHub (minimal API calls).
 *
 * - Issue **closed** + kartu bukan Done → set Done
 * - Issue **open** + kartu Done → set Todo (opsional, --fix-reopened)
 *
 * Usage:
 *   node Devops/scripts/sync-project-status.mjs
 *   node Devops/scripts/sync-project-status.mjs --dry-run
 *   PROJECT_OWNER=ariprasetyoskom PROJECT_NUMBER=1 node Devops/scripts/sync-project-status.mjs
 *
 * Requires: gh auth login -s project
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const dryRun = process.argv.includes("--dry-run");
const fixReopened = process.argv.includes("--fix-reopened");
/** User project: gunakan @me jika login gh = pemilik project. */
const owner = process.env.PROJECT_OWNER || "@me";
const projectNumber = process.env.PROJECT_NUMBER || "1";
const repo = process.env.GITHUB_REPO || "ariprasetyoskom/meeting-room-cursor";
const delayMs = Number(process.env.PROJECT_SYNC_DELAY_MS || "600");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runGh(args) {
  const r = spawnSync("gh", args, { cwd: root, encoding: "utf8", shell: false });
  return {
    ok: r.status === 0,
    out: (r.stdout || "").trim(),
    err: (r.stderr || "").trim(),
    code: r.status,
  };
}

async function ghWithBackoff(args, label) {
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

async function loadProjectItems() {
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

async function loadIssueStates() {
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

async function setStatus(issueNumber, status) {
  const url = `https://github.com/${repo}/issues/${issueNumber}`;
  if (dryRun) {
    console.log(`[dry-run] #${issueNumber} → Status "${status}"`);
    return;
  }
  await ghWithBackoff(
    [
      "project",
      "item-edit",
      projectNumber,
      "--owner",
      owner,
      "--url",
      url,
      "--field",
      "Status",
      "--value",
      status,
    ],
    `#${issueNumber} Status`,
  );
  console.log(`#${issueNumber} → ${status}`);
}

async function main() {
  const items = await loadProjectItems();
  const states = await loadIssueStates();

  const updates = [];
  for (const item of items) {
    const content = item.content;
    if (!content || content.type !== "Issue" || !content.number) continue;
    const n = content.number;
    const issueState = states.get(n);
    if (!issueState) continue;
    const boardStatus = item.status || "Todo";

    if (issueState === "CLOSED" && boardStatus !== "Done") {
      updates.push({ n, status: "Done", reason: "issue closed" });
    } else if (fixReopened && issueState === "OPEN" && boardStatus === "Done") {
      updates.push({ n, status: "Todo", reason: "issue reopened" });
    }
  }

  if (updates.length === 0) {
    console.log("Tidak ada kartu yang perlu diselaraskan.");
    return;
  }

  console.log(`${updates.length} kartu akan di-update${dryRun ? " (dry-run)" : ""}:`);
  for (const u of updates) {
    console.log(`  #${u.n} ${u.reason}`);
  }

  for (const u of updates) {
    await setStatus(u.n, u.status);
    if (!dryRun && delayMs > 0) await sleep(delayMs);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

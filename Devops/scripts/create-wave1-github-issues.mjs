#!/usr/bin/env node
/**
 * Create GitHub issues from Docs/plan-wave-1-issues.csv
 * Usage: node Devops/scripts/create-wave1-github-issues.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join as pathJoin } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const csvPath = join(root, "Docs/plan-wave-1-issues.csv");
const dryRun = process.argv.includes("--dry-run");

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",");
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = [];
    let cur = "";
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (c === "," && !inQuotes) {
        cols.push(cur);
        cur = "";
        continue;
      }
      cur += c;
    }
    cols.push(cur);
    const row = {};
    header.forEach((h, idx) => {
      row[h.trim()] = (cols[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function sleepMs(ms) {
  spawnSync("ping", ["127.0.0.1", "-n", "1", "-w", String(ms)], {
    shell: true,
    stdio: "ignore",
  });
}

function gh(args) {
  const r = spawnSync("gh", args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
  });
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || `gh ${args.join(" ")} failed`);
  }
  return (r.stdout || "").trim();
}

const rows = parseCsv(readFileSync(csvPath, "utf8"));

function issueExists(title) {
  const q = `repo:ariprasetyoskom/meeting-room-cursor is:issue "${title.replace(/"/g, "")}" in:title`;
  const r = spawnSync("gh", ["issue", "list", "--search", q, "--limit", "1", "--json", "title"], {
    cwd: root,
    encoding: "utf8",
    shell: false,
  });
  if (r.status !== 0) return false;
  try {
    const list = JSON.parse(r.stdout || "[]");
    return list.some((i) => i.title === title);
  } catch {
    return false;
  }
}

const docUrl =
  "https://github.com/ariprasetyoskom/meeting-room-cursor/blob/cursor/meeting-room-web-scaffold/Docs/PLAN-Wave-1-Email.md";

const created = [];

for (const row of rows) {
  const id = row["Issue ID"];
  const title = `[${id}] ${row.Summary}`;
  const labels = [row.Labels, "wave1", "enhancement"].filter(Boolean);

  const body = `## Wave 1 — F-10 Email (S4)

| Field | Value |
|-------|-------|
| **Ticket** | \`${id}\` |
| **Epic PLAN** | ${row.Epic} |
| **Story points** | ${row["Story Points"]} |
| **Depends on** | ${row["Depends On"] || "—"} |

### Acceptance criteria

${row.Acceptance}

### Referensi

- [PLAN-Wave-1-Email.md](${docUrl})
- Trace: PRD F-10, D-3, BR-07, TDD §7

---
*Auto-created from \`Docs/plan-wave-1-issues.csv\`*`;

  if (dryRun) {
    console.log("DRY", title, labels.join(","));
    continue;
  }

  if (issueExists(title)) {
    console.log(id, "-> skip (exists)");
    continue;
  }

  const bodyFile = pathJoin(tmpdir(), `gh-issue-${id}.md`);
  writeFileSync(bodyFile, body, "utf8");

  const args = [
    "issue",
    "create",
    "--title",
    title,
    "--body-file",
    bodyFile,
    ...labels.flatMap((l) => ["--label", l]),
  ];
  if (process.env.WAVE1_MILESTONE) {
    args.push("--milestone", process.env.WAVE1_MILESTONE);
  }

  let out;
  const run = () => gh(args);
  try {
    try {
      out = run();
    } catch {
      sleepMs(2500);
      out = run();
    }
  } finally {
    try {
      unlinkSync(bodyFile);
    } catch {
      /* ignore */
    }
  }
  const m = out.match(/issues\/(\d+)/);
  const num = m ? m[1] : out;
  created.push({ id, num, url: out.split("\n").pop() || out });
  console.log(id, "->", num);
  sleepMs(800);
}

if (!dryRun && created.length) {
  console.log("\nCreated", created.length, "issues");
}

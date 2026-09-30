#!/usr/bin/env node
/**
 * Create UI enhance GitHub issues from Docs/plan-ui-enhance-issues.csv
 * Requires UI_EPIC_PARENT (issue number of [UI-EPIC] parent).
 * Usage: UI_EPIC_PARENT=30 UI_MILESTONE="..." node Devops/scripts/create-ui-enhance-github-issues.mjs
 */
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join as pathJoin } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const csvPath = join(root, "Docs/plan-ui-enhance-issues.csv");
const dryRun = process.argv.includes("--dry-run");
const epicParent = process.env.UI_EPIC_PARENT;

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
  spawnSync("ping", ["127.0.0.1", "-n", "1", "-w", String(Math.min(ms, 1000))], {
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

const rows = parseCsv(readFileSync(csvPath, "utf8"));
const docUrl =
  "https://github.com/ariprasetyoskom/meeting-room-cursor/blob/cursor/meeting-room-web-scaffold/Docs/PLAN-UI-Enhance.md";
const designUrl =
  "https://github.com/ariprasetyoskom/meeting-room-cursor/blob/cursor/meeting-room-web-scaffold/Docs/Design-Aplikasi-Booking-Ruang-Meeting.md";

if (!dryRun && !epicParent) {
  console.error("Set UI_EPIC_PARENT to the [UI-EPIC] issue number.");
  process.exit(1);
}

const created = [];

for (const row of rows) {
  const id = row["Issue ID"];
  const title = `[${id}] ${row.Summary}`;
  const labels = [row.Labels, "ui-enhance", "enhancement"].filter(Boolean);

  const body = `## UI enhance — MVP polish

| Field | Value |
|-------|-------|
| **Ticket** | \`${id}\` |
| **Epic group** | ${row.Epic} |
| **Story points** | ${row["Story Points"]} |
| **Depends on** | ${row["Depends On"] || "—"} |

### Acceptance criteria

${row.Acceptance}

### Referensi

- [PLAN-UI-Enhance.md](${docUrl})
- [Design v1.1](${designUrl}) — tokens §4, \`/book\` §6

---
*Auto-created from \`Docs/plan-ui-enhance-issues.csv\`*`;

  if (dryRun) {
    console.log("DRY", title, labels.join(","), "parent", epicParent || "?");
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
    "--parent",
    epicParent,
    ...labels.flatMap((l) => ["--label", l]),
  ];
  if (process.env.UI_MILESTONE) {
    args.push("--milestone", process.env.UI_MILESTONE);
  }

  let out;
  try {
    try {
      out = gh(args);
    } catch {
      sleepMs(2500);
      out = gh(args);
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
  created.push({ id, num });
  console.log(id, "->", num);
  sleepMs(800);
}

if (!dryRun && created.length) {
  console.log("\nCreated", created.length, "sub-issues under epic", epicParent);
}

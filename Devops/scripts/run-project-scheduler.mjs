#!/usr/bin/env node
/**
 * Entry point scheduler Kanban — PRD-GitHub-Project-Scheduler v1.0
 *
 * Usage:
 *   node Devops/scripts/run-project-scheduler.mjs
 *   node Devops/scripts/run-project-scheduler.mjs --json
 *   node Devops/scripts/run-project-scheduler.mjs --sync
 *   node Devops/scripts/run-project-scheduler.mjs --sync --dry-run
 */
import { writeFileSync } from "node:fs";
import { analyzeBoard, formatTextReport } from "./lib/board-analysis.mjs";
import { loadSchedulerConfig } from "./lib/project-scheduler-config.mjs";
import {
  assertProjectAuth,
  getRepoRoot,
  ghWithBackoff,
  loadIssueStates,
  loadProjectItems,
} from "./lib/gh-project.mjs";

const asJson = process.argv.includes("--json");
const doSync = process.argv.includes("--sync");
const dryRunSync = process.argv.includes("--dry-run");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function applySync(config, driftRows) {
  const toFix = driftRows.filter((r) => r.issueState === "CLOSED");
  if (toFix.length === 0) return { updated: 0, skipped: 0 };

  const capped = toFix.slice(0, config.syncMaxUpdates);
  const skipped = toFix.length - capped.length;

  console.log(
    `\nSync: ${capped.length} kartu → Done${dryRunSync ? " (dry-run)" : ""}${skipped ? ` (${skipped} ditunda, max ${config.syncMaxUpdates})` : ""}`,
  );

  for (const row of capped) {
    const url = `https://github.com/${config.repo}/issues/${row.number}`;
    if (dryRunSync) {
      console.log(`[dry-run] #${row.number} → Done`);
      continue;
    }
    await ghWithBackoff(
      [
        "project",
        "item-edit",
        config.projectNumber,
        "--owner",
        config.owner,
        "--url",
        url,
        "--field",
        "Status",
        "--value",
        "Done",
      ],
      `#${row.number} Status`,
    );
    console.log(`#${row.number} → Done`);
    if (config.syncDelayMs > 0) await sleep(config.syncDelayMs);
  }

  return { updated: dryRunSync ? 0 : capped.length, skipped };
}

async function main() {
  const config = loadSchedulerConfig();
  assertProjectAuth();

  const [items, issueStates] = await Promise.all([
    loadProjectItems(config.owner, config.projectNumber),
    loadIssueStates(config.repo),
  ]);

  const analysis = analyzeBoard(items, issueStates);
  const meta = {
    timestamp: new Date().toISOString(),
    owner: config.owner,
    projectNumber: config.projectNumber,
  };

  const payload = {
    meta,
    inProgress: analysis.inProgress,
    driftClosedInProgress: analysis.driftClosedInProgress,
    driftOpenDone: analysis.driftOpenDone,
  };

  if (asJson) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(formatTextReport(analysis, meta));
  }

  if (doSync || dryRunSync) {
    await applySync(config, analysis.driftClosedInProgress);
  }

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath && !asJson) {
    const md = formatTextReport(analysis, meta);
    writeFileSync(
      summaryPath,
      `## Project scheduler\n\n\`\`\`text\n${md}\n\`\`\`\n`,
      { flag: "a" },
    );
  }

  if (config.failOnDrift && analysis.driftClosedInProgress.length > 0 && !doSync && !dryRunSync) {
    console.error(
      `\nDrift terdeteksi (${analysis.driftClosedInProgress.length}). Jalankan --sync atau set PROJECT_SYNC_ON_SCHEDULE.`,
    );
    process.exit(2);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

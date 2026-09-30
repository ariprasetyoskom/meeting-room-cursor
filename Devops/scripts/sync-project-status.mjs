#!/usr/bin/env node
/**
 * Selaraskan Status Project dengan issue GitHub (closed → Done).
 * PRD FR-SCH-04 / F-SCH-03
 */
import { loadSchedulerConfig } from "./lib/project-scheduler-config.mjs";
import {
  assertProjectAuth,
  ghWithBackoff,
  loadIssueStates,
  loadProjectItems,
} from "./lib/gh-project.mjs";

const dryRun = process.argv.includes("--dry-run");
const fixReopened = process.argv.includes("--fix-reopened");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function setStatus(config, issueNumber, status) {
  const url = `https://github.com/${config.repo}/issues/${issueNumber}`;
  if (dryRun) {
    console.log(`[dry-run] #${issueNumber} → Status "${status}"`);
    return;
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
      status,
    ],
    `#${issueNumber} Status`,
  );
  console.log(`#${issueNumber} → ${status}`);
}

async function main() {
  const config = loadSchedulerConfig();
  assertProjectAuth();

  const [items, issueStates] = await Promise.all([
    loadProjectItems(config.owner, config.projectNumber),
    loadIssueStates(config.repo),
  ]);

  const updates = [];
  for (const item of items) {
    const content = item.content;
    if (!content || content.type !== "Issue" || !content.number) continue;
    const n = content.number;
    const issueState = issueStates.get(n);
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

  const capped = updates.slice(0, config.syncMaxUpdates);
  if (capped.length < updates.length) {
    console.warn(
      `Membatasi ${capped.length}/${updates.length} update (PROJECT_SYNC_MAX_UPDATES=${config.syncMaxUpdates}).`,
    );
  }

  console.log(`${capped.length} kartu akan di-update${dryRun ? " (dry-run)" : ""}:`);
  for (const u of capped) {
    console.log(`  #${u.n} ${u.reason}`);
  }

  for (const u of capped) {
    await setStatus(config, u.n, u.status);
    if (!dryRun && config.syncDelayMs > 0) await sleep(config.syncDelayMs);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

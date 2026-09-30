#!/usr/bin/env node
/**
 * Laporan kartu Project dengan Status "In Progress".
 *
 * Usage:
 *   node Devops/scripts/report-project-in-progress.mjs
 *   node Devops/scripts/report-project-in-progress.mjs --json
 *
 * Env: PROJECT_OWNER (@me), PROJECT_NUMBER (1), GITHUB_REPO
 * Requires: gh auth login -s project (read)
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const asJson = process.argv.includes("--json");
const owner = process.env.PROJECT_OWNER || "@me";
const projectNumber = process.env.PROJECT_NUMBER || "1";

function runGh(args) {
  const r = spawnSync("gh", args, { cwd: root, encoding: "utf8", shell: false });
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || `gh failed: ${args.join(" ")}`);
  }
  return (r.stdout || "").trim();
}

function loadItems() {
  const raw = runGh([
    "project",
    "item-list",
    projectNumber,
    "--owner",
    owner,
    "--limit",
    "100",
    "--format",
    "json",
  ]);
  return JSON.parse(raw).items || [];
}

function main() {
  const inProgress = loadItems()
    .filter((item) => item.status === "In Progress")
    .map((item) => ({
      number: item.content?.number,
      title: item.title || item.content?.title,
      url: item.content?.url,
      labels: item.labels,
      milestone: item.milestone?.title,
    }))
    .filter((row) => row.number != null);

  if (asJson) {
    console.log(JSON.stringify({ count: inProgress.length, items: inProgress }, null, 2));
    return;
  }

  const stamp = new Date().toISOString();
  console.log(`# Project In Progress (${stamp})`);
  console.log(`Owner: ${owner} · Project #${projectNumber}`);
  console.log(`Total: ${inProgress.length}\n`);

  if (inProgress.length === 0) {
    console.log("(tidak ada kartu In Progress)");
    return;
  }

  for (const row of inProgress) {
    console.log(`- #${row.number} ${row.title}`);
    console.log(`  ${row.url}`);
    if (row.milestone) console.log(`  milestone: ${row.milestone}`);
  }
}

main();

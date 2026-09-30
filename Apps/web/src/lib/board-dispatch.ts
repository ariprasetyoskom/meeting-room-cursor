import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  assertCanDispatch,
  createEmptyLedger,
  getActiveLock,
  type DispatchLedger,
} from "@/lib/board-dispatch-policy";

export class DispatchNotConfiguredError extends Error {
  constructor() {
    super(
      "Dispatch agent belum dikonfigurasi. Set BOARD_AGENT_DISPATCH_ENABLED dan webhook di server.",
    );
    this.name = "DispatchNotConfiguredError";
  }
}

export class DispatchRejectedError extends Error {
  code: "LOCKED" | "DEBOUNCE" | "EPIC";

  constructor(code: "LOCKED" | "DEBOUNCE" | "EPIC", message: string) {
    super(message);
    this.name = "DispatchRejectedError";
    this.code = code;
  }
}

export class DispatchWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DispatchWebhookError";
  }
}

function dispatchEnabled(): boolean {
  return process.env.BOARD_AGENT_DISPATCH_ENABLED === "true";
}

function lockTtlMs(): number {
  const raw = process.env.BOARD_DISPATCH_LOCK_TTL_MS;
  const n = raw ? Number(raw) : 4 * 60 * 60 * 1000;
  return Number.isFinite(n) && n > 0 ? n : 4 * 60 * 60 * 1000;
}

function ledgerPath(): string {
  return path.join(process.cwd(), ".data", "board-dispatch.json");
}

async function readLedger(): Promise<DispatchLedger> {
  try {
    const raw = await readFile(ledgerPath(), "utf8");
    const parsed = JSON.parse(raw) as DispatchLedger;
    return {
      active: parsed.active ?? null,
      lastDispatchAtByIssue: parsed.lastDispatchAtByIssue ?? {},
    };
  } catch {
    return createEmptyLedger();
  }
}

async function writeLedger(ledger: DispatchLedger): Promise<void> {
  const file = ledgerPath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(ledger, null, 2), "utf8");
}

function githubRepo(): string {
  const owner =
    process.env.GITHUB_DISPATCH_REPO?.split("/")[0] ??
    process.env.GITHUB_REPO_OWNER ??
    "ariprasetyoskom";
  const name =
    process.env.GITHUB_DISPATCH_REPO?.split("/")[1] ??
    process.env.GITHUB_REPO_NAME ??
    "meeting-room-cursor";
  return `${owner}/${name}`;
}

function githubToken(): string | null {
  return (
    process.env.GH_DISPATCH_PAT?.trim() ||
    process.env.GH_SCHEDULER_ADMIN_TOKEN?.trim() ||
    null
  );
}

export type GitHubIssueSnapshot = {
  number: number;
  title: string;
  body: string;
  html_url: string;
  state: string;
};

export async function fetchGitHubIssue(
  issueNumber: number,
): Promise<GitHubIssueSnapshot> {
  const token = githubToken();
  if (!token) {
    throw new DispatchNotConfiguredError();
  }
  const repo = githubRepo();
  const res = await fetch(
    `https://api.github.com/repos/${repo}/issues/${issueNumber}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`GitHub issue #${issueNumber}: HTTP ${res.status}`);
  }
  const data = (await res.json()) as GitHubIssueSnapshot;
  return data;
}

export function buildAgentPrompt(issue: GitHubIssueSnapshot, repo: string): string {
  const body = issue.body?.trim() || "(tidak ada deskripsi)";
  return [
    `Kerjakan GitHub issue #${issue.number} di repo ${repo}.`,
    `Judul: ${issue.title}`,
    `URL: ${issue.html_url}`,
    "",
    "Acceptance / deskripsi issue:",
    body,
    "",
    "Aturan:",
    "- Branch: agent/issue-" + issue.number,
    "- Implementasi + test relevan; jangan merge ke main.",
    "- Buka pull request; komentari di PR jika blocker.",
    "- Jangan ubah scope di luar issue.",
  ].join("\n");
}

async function postAutomationWebhook(payload: {
  issueNumber: number;
  repository: string;
  prompt: string;
  correlationId: string;
}): Promise<void> {
  const url = process.env.CURSOR_AUTOMATION_WEBHOOK_URL?.trim();
  const secret = process.env.CURSOR_AUTOMATION_WEBHOOK_SECRET?.trim();
  if (!url || !secret) {
    throw new DispatchNotConfiguredError();
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secret}`,
  };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new DispatchWebhookError(
      `Webhook Automation gagal (HTTP ${res.status}).`,
    );
  }
}

export type DispatchStatus = {
  enabled: boolean;
  configured: boolean;
  activeIssueNumber: number | null;
  correlationId: string | null;
  repository: string;
};

export async function getDispatchStatus(): Promise<DispatchStatus> {
  const enabled = dispatchEnabled();
  const configured = Boolean(
    process.env.CURSOR_AUTOMATION_WEBHOOK_URL?.trim() &&
      process.env.CURSOR_AUTOMATION_WEBHOOK_SECRET?.trim() &&
      githubToken(),
  );
  const ledger = await readLedger();
  const active = getActiveLock(ledger, Date.now(), lockTtlMs());
  return {
    enabled,
    configured,
    activeIssueNumber: active?.issueNumber ?? null,
    correlationId: active?.correlationId ?? null,
    repository: githubRepo(),
  };
}

export type DispatchResult = {
  correlationId: string;
  issueNumber: number;
  issueTitle: string;
};

export async function dispatchBoardIssue(
  issueNumber: number,
): Promise<DispatchResult> {
  if (!dispatchEnabled()) {
    throw new DispatchNotConfiguredError();
  }

  const now = Date.now();
  let ledger = await readLedger();
  const gate = assertCanDispatch(ledger, issueNumber, now, lockTtlMs());
  if (!gate.ok) {
    const messages: Record<typeof gate.code, string> = {
      EPIC: "Epic #30 tidak didispatch otomatis. Geser sub-issue (#31–#40).",
      LOCKED: "Masih ada issue lain yang sedang dikerjakan agent.",
      DEBOUNCE: "Tunggu sebentar sebelum memanggil agent untuk issue yang sama.",
    };
    throw new DispatchRejectedError(gate.code, messages[gate.code]);
  }

  const issue = await fetchGitHubIssue(issueNumber);
  const repo = githubRepo();
  const correlationId = randomUUID();
  const prompt = buildAgentPrompt(issue, repo);

  await postAutomationWebhook({
    issueNumber,
    repository: repo,
    prompt,
    correlationId,
  });

  ledger = {
    active: {
      issueNumber,
      correlationId,
      startedAt: new Date(now).toISOString(),
    },
    lastDispatchAtByIssue: {
      ...ledger.lastDispatchAtByIssue,
      [String(issueNumber)]: now,
    },
  };
  await writeLedger(ledger);

  return {
    correlationId,
    issueNumber,
    issueTitle: issue.title,
  };
}

/** Lepas lock aktif (opsional, v1.1 UI). */
export async function clearDispatchLock(): Promise<void> {
  const ledger = await readLedger();
  ledger.active = null;
  await writeLedger(ledger);
}

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  agentBranchForIssue,
  assertCanDispatch,
  createEmptyLedger,
  getActiveLock,
  type DispatchCompletedRun,
  type DispatchLedger,
} from "@/lib/board-dispatch-policy";
import {
  BOARD_DISPATCH_STAGE,
  type BoardStatus,
} from "@/lib/project-board";
import {
  appendDevelopmentLog,
  developmentDataPath,
} from "@/lib/development-log";

const KAD_LOG_CHANNEL = "kad-dispatch";

export type AutomationWebhookPayload = {
  source: "kad-v1";
  correlationId: string;
  issueNumber: number;
  repository: string;
  pipelineStage: typeof BOARD_DISPATCH_STAGE;
  fromStage: BoardStatus | null;
  prompt: string;
};

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

function legacyLedgerPath(): string {
  return path.join(process.cwd(), ".data", "board-dispatch.json");
}

function ledgerPath(): string {
  return developmentDataPath("kad-dispatch-ledger.json");
}

function parseLedger(raw: string): DispatchLedger {
  const parsed = JSON.parse(raw) as DispatchLedger;
  return {
    active: parsed.active ?? null,
    lastDispatchAtByIssue: parsed.lastDispatchAtByIssue ?? {},
    completedByIssue: parsed.completedByIssue ?? {},
  };
}

export type GitHubPullSnapshot = {
  number: number;
  title: string;
  html_url: string;
  state: string;
  body: string;
};

export async function fetchPullRequestForIssue(
  issueNumber: number,
): Promise<GitHubPullSnapshot | null> {
  const token = githubToken();
  if (!token) return null;
  const repo = githubRepo();
  const [owner, name] = repo.split("/");
  if (!owner || !name) return null;
  const head = `${owner}:${agentBranchForIssue(issueNumber)}`;
  const url = new URL(`https://api.github.com/repos/${repo}/pulls`);
  url.searchParams.set("state", "all");
  url.searchParams.set("head", head);
  url.searchParams.set("per_page", "5");
  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const pulls = (await res.json()) as GitHubPullSnapshot[];
  return pulls[0] ?? null;
}

export function buildCompletionSummary(pr: GitHubPullSnapshot): string {
  const bodyLine = pr.body?.split("\n").find((line) => line.trim())?.trim();
  if (bodyLine && bodyLine.length <= 220) return bodyLine;
  if (bodyLine) return `${bodyLine.slice(0, 217)}…`;
  return pr.title.trim();
}

export function applyPullRequestCompletion(
  ledger: DispatchLedger,
  pr: GitHubPullSnapshot,
  nowIso: string,
): DispatchLedger {
  const active = ledger.active;
  if (!active) return ledger;
  const completed: DispatchCompletedRun = {
    issueNumber: active.issueNumber,
    correlationId: active.correlationId,
    completedAt: nowIso,
    summary: buildCompletionSummary(pr),
    prNumber: pr.number,
    prUrl: pr.html_url,
    prState: pr.state,
  };
  return {
    ...ledger,
    active: null,
    completedByIssue: {
      ...ledger.completedByIssue,
      [String(active.issueNumber)]: completed,
    },
  };
}

async function syncActiveCompletion(ledger: DispatchLedger): Promise<DispatchLedger> {
  const active = getActiveLock(ledger, Date.now(), lockTtlMs());
  if (!active || !githubToken()) return ledger;
  const pr = await fetchPullRequestForIssue(active.issueNumber);
  if (!pr) return ledger;
  const next = applyPullRequestCompletion(ledger, pr, new Date().toISOString());
  await writeLedger(next);
  await logKad("info", "dispatch.completed", {
    issueNumber: active.issueNumber,
    correlationId: active.correlationId,
    prNumber: pr.number,
    prUrl: pr.html_url,
  });
  return next;
}

async function readLedger(): Promise<DispatchLedger> {
  try {
    const raw = await readFile(ledgerPath(), "utf8");
    return parseLedger(raw);
  } catch {
    try {
      const raw = await readFile(legacyLedgerPath(), "utf8");
      const ledger = parseLedger(raw);
      await writeLedger(ledger);
      return ledger;
    } catch {
      return createEmptyLedger();
    }
  }
}

async function logKad(
  level: "info" | "warn" | "error",
  event: string,
  data?: Record<string, unknown>,
): Promise<void> {
  try {
    await appendDevelopmentLog({
      channel: KAD_LOG_CHANNEL,
      level,
      event,
      data,
    });
  } catch {
    /* logging must not break dispatch */
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

export function buildAgentPrompt(
  issue: GitHubIssueSnapshot,
  repo: string,
  fromStage: BoardStatus | null,
): string {
  const body = issue.body?.trim() || "(tidak ada deskripsi)";
  const fromLine = fromStage
    ? `Kartu kanban dipindah dari **${fromStage}** ke **${BOARD_DISPATCH_STAGE}**.`
    : `Stage kanban: **${BOARD_DISPATCH_STAGE}**.`;
  return [
    `Kerjakan GitHub issue #${issue.number} di repo ${repo}.`,
    `Judul: ${issue.title}`,
    `URL: ${issue.html_url}`,
    "",
    fromLine,
    "Alur papan: Intake → Plan → Development → Test → Audit → Human Clarify → Human QA → Done.",
    "Kamu dipanggil pada **Development** (implementasi). Setelah selesai, operator geser ke Test/Audit; jangan loncat stage sendiri.",
    "",
    "Acceptance / deskripsi issue:",
    body,
    "",
    "Aturan:",
    "- Branch: agent/issue-" + issue.number,
    "- Selaras ORCH: tulis dokumen agent + development per stage bila skill devops-agent dipakai.",
    "- Implementasi + test relevan; jangan merge ke main/master.",
    "- Buka pull request; komentari di PR jika blocker.",
    "- Jangan ubah scope di luar issue.",
  ].join("\n");
}

async function postAutomationWebhook(
  payload: AutomationWebhookPayload,
): Promise<void> {
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
    const err = new DispatchWebhookError(
      `Webhook Automation gagal (HTTP ${res.status}).`,
    );
    await logKad("error", "dispatch.webhook_failed", {
      issueNumber: payload.issueNumber,
      correlationId: payload.correlationId,
      httpStatus: res.status,
    });
    throw err;
  }
}

export type DispatchStatus = {
  enabled: boolean;
  configured: boolean;
  activeIssueNumber: number | null;
  correlationId: string | null;
  repository: string;
  pipelineStage: typeof BOARD_DISPATCH_STAGE;
  completedByIssue: Record<string, DispatchCompletedRun>;
};

export async function getDispatchStatus(): Promise<DispatchStatus> {
  const enabled = dispatchEnabled();
  const configured = Boolean(
    process.env.CURSOR_AUTOMATION_WEBHOOK_URL?.trim() &&
      process.env.CURSOR_AUTOMATION_WEBHOOK_SECRET?.trim() &&
      githubToken(),
  );
  let ledger = await readLedger();
  if (enabled && configured && ledger.active) {
    ledger = await syncActiveCompletion(ledger);
  }
  const active = getActiveLock(ledger, Date.now(), lockTtlMs());
  return {
    enabled,
    configured,
    activeIssueNumber: active?.issueNumber ?? null,
    correlationId: active?.correlationId ?? null,
    repository: githubRepo(),
    pipelineStage: BOARD_DISPATCH_STAGE,
    completedByIssue: ledger.completedByIssue,
  };
}

export type DispatchResult = {
  correlationId: string;
  issueNumber: number;
  issueTitle: string;
};

export async function dispatchBoardIssue(
  issueNumber: number,
  fromStage: BoardStatus | null = null,
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
    await logKad("warn", "dispatch.rejected", {
      issueNumber,
      fromStage,
      code: gate.code,
    });
    throw new DispatchRejectedError(gate.code, messages[gate.code]);
  }

  let issue: GitHubIssueSnapshot;
  try {
    issue = await fetchGitHubIssue(issueNumber);
  } catch (e) {
    await logKad("error", "dispatch.github_failed", {
      issueNumber,
      message: e instanceof Error ? e.message : "unknown",
    });
    throw e;
  }
  const repo = githubRepo();
  const correlationId = randomUUID();
  const prompt = buildAgentPrompt(issue, repo, fromStage);

  await postAutomationWebhook({
    source: "kad-v1",
    issueNumber,
    repository: repo,
    prompt,
    correlationId,
    pipelineStage: BOARD_DISPATCH_STAGE,
    fromStage,
  });

  const { [String(issueNumber)]: _prev, ...restCompleted } =
    ledger.completedByIssue;
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
    completedByIssue: restCompleted,
  };
  await writeLedger(ledger);

  await logKad("info", "dispatch.accepted", {
    issueNumber,
    correlationId,
    fromStage,
    repository: repo,
    issueTitle: issue.title,
  });

  return {
    correlationId,
    issueNumber,
    issueTitle: issue.title,
  };
}

/** Lepas lock aktif (opsional, v1.1 UI). */
export async function clearDispatchLock(): Promise<void> {
  const ledger = await readLedger();
  const previous = ledger.active;
  ledger.active = null;
  await writeLedger(ledger);
  await logKad("info", "lock.cleared", {
    previousIssueNumber: previous?.issueNumber ?? null,
    previousCorrelationId: previous?.correlationId ?? null,
  });
}

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  agentBranchForIssue,
  assertCanDispatch,
  createEmptyLedger,
  getActiveLock,
  normalizeDispatchLedger,
  type DispatchCompletedRun,
  type DispatchLedger,
} from "@/lib/board-dispatch-policy";
import type { AuditVerdict } from "@/lib/board-audit-verdict";
import {
  parseAuditVerdictFromLooseText,
  parseAuditVerdictFromPrBody,
} from "@/lib/board-audit-verdict";
import {
  checkAuditStageGate,
  checkDevelopmentStageGate,
  checkTestStageGate,
  kadStrictStageGates,
} from "@/lib/board-kad-stage-gates";
import type { DispatchLock } from "@/lib/board-dispatch-policy";
import { completionStorageKey } from "@/lib/board-dispatch-stages";
import {
  type BoardDispatchStage,
  type BoardStatus,
} from "@/lib/project-board";
import {
  appendDevelopmentLog,
  developmentDataPath,
} from "@/lib/development-log";
import type { IssueAgentDetail } from "@/lib/board-agent-detail";

export type { IssueAgentDetail };

const KAD_LOG_CHANNEL = "kad-dispatch";

export type AutomationWebhookPayload = {
  source: "kad-v1";
  correlationId: string;
  issueNumber: number;
  repository: string;
  pipelineStage: BoardDispatchStage;
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

function autoDispatchTestAfterDev(): boolean {
  if (!dispatchEnabled()) return false;
  return process.env.BOARD_AUTO_DISPATCH_TEST !== "false";
}

function autoDispatchAuditAfterTest(): boolean {
  if (!dispatchEnabled()) return false;
  return process.env.BOARD_AUTO_DISPATCH_AUDIT !== "false";
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
  return normalizeDispatchLedger({
    active: parsed.active ?? null,
    lastDispatchAtByIssue: parsed.lastDispatchAtByIssue ?? {},
    completedByIssue: parsed.completedByIssue ?? {},
  });
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
  summaryOverride?: string,
  auditVerdict?: AuditVerdict,
): DispatchLedger {
  const active = ledger.active;
  if (!active) return ledger;
  const completed: DispatchCompletedRun = {
    issueNumber: active.issueNumber,
    correlationId: active.correlationId,
    completedAt: nowIso,
    summary: summaryOverride ?? buildCompletionSummary(pr),
    prNumber: pr.number,
    prUrl: pr.html_url,
    prState: pr.state,
    pipelineStage: active.pipelineStage,
    ...(active.pipelineStage === "audit" && auditVerdict
      ? { auditVerdict }
      : {}),
  };
  return {
    ...ledger,
    active: null,
    completedByIssue: {
      ...ledger.completedByIssue,
      [completionStorageKey(active.issueNumber, active.pipelineStage)]: completed,
    },
  };
}

type GitHubCommitSnapshot = {
  sha: string;
  date: string;
  message: string;
};

async function fetchLatestCommitOnBranch(
  issueNumber: number,
): Promise<GitHubCommitSnapshot | null> {
  const token = githubToken();
  if (!token) return null;
  const repo = githubRepo();
  const branch = agentBranchForIssue(issueNumber);
  const url = new URL(`https://api.github.com/repos/${repo}/commits`);
  url.searchParams.set("sha", branch);
  url.searchParams.set("per_page", "1");
  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const commits = (await res.json()) as Array<{
    sha: string;
    commit: { message: string; author: { date: string } };
  }>;
  const head = commits[0];
  if (!head) return null;
  return {
    sha: head.sha,
    date: head.commit.author.date,
    message: head.commit.message.split("\n")[0]?.trim() ?? "",
  };
}

async function fetchCheckConclusion(
  ref: string,
): Promise<"success" | "pending" | "failure" | "none"> {
  const token = githubToken();
  if (!token) return "none";
  const repo = githubRepo();
  const res = await fetch(
    `https://api.github.com/repos/${repo}/commits/${ref}/check-runs?per_page=100`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );
  if (!res.ok) return "none";
  const data = (await res.json()) as {
    check_runs: Array<{ status: string; conclusion: string | null }>;
  };
  const runs = data.check_runs ?? [];
  if (runs.length === 0) return "none";
  if (
    runs.some(
      (run) =>
        run.status === "queued" ||
        run.status === "in_progress" ||
        run.conclusion == null,
    )
  ) {
    return "pending";
  }
  if (
    runs.some(
      (run) =>
        run.conclusion === "failure" ||
        run.conclusion === "cancelled" ||
        run.conclusion === "timed_out",
    )
  ) {
    return "failure";
  }
  return "success";
}

function commitAfterDispatch(
  commit: GitHubCommitSnapshot | null,
  startedAt: string,
): boolean {
  const started = Date.parse(startedAt);
  if (!commit || Number.isNaN(started)) return false;
  return Date.parse(commit.date) > started;
}

async function logStageCheck(
  active: DispatchLock,
  ok: boolean,
  detail: Record<string, unknown>,
): Promise<void> {
  await logKad("info", "dispatch.stage_check", {
    issueNumber: active.issueNumber,
    correlationId: active.correlationId,
    pipelineStage: active.pipelineStage,
    ok,
    strictGates: kadStrictStageGates(),
    ...detail,
  });
}

async function fetchIssueCommentsText(issueNumber: number): Promise<string> {
  const token = githubToken();
  if (!token) return "";
  const repo = githubRepo();
  const res = await fetch(
    `https://api.github.com/repos/${repo}/issues/${issueNumber}/comments?per_page=20`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );
  if (!res.ok) return "";
  const comments = (await res.json()) as Array<{ body?: string; created_at?: string }>;
  return comments
    .filter((c) => {
      const t = c.created_at ? Date.parse(c.created_at) : 0;
      return t > 0;
    })
    .map((c) => c.body ?? "")
    .join("\n\n");
}

async function isAuditDispatchComplete(
  active: NonNullable<DispatchLedger["active"]>,
  pr: GitHubPullSnapshot,
): Promise<
  { ok: true; summary: string; auditVerdict: AuditVerdict } | { ok: false }
> {
  const started = Date.parse(active.startedAt);
  const body = pr.body ?? "";

  let verdict =
    parseAuditVerdictFromPrBody(body) ??
    parseAuditVerdictFromLooseText(body);

  if (!verdict) {
    const prComments = await fetchIssueCommentsText(pr.number);
    verdict = parseAuditVerdictFromLooseText(prComments);
  }
  if (!verdict) {
    const issueComments = await fetchIssueCommentsText(active.issueNumber);
    verdict = parseAuditVerdictFromLooseText(issueComments);
  }

  if (!verdict) {
    const commit = await fetchLatestCommitOnBranch(active.issueNumber);
    if (
      commit &&
      !Number.isNaN(started) &&
      Date.parse(commit.date) > started
    ) {
      verdict = parseAuditVerdictFromLooseText(commit.message);
      if (verdict) {
        const dest =
          verdict === "pass"
            ? "Human QA"
            : verdict === "clarify"
              ? "Human Clarify"
              : "Audit (ulang)";
        return {
          ok: true,
          auditVerdict: verdict,
          summary: `Audit ORCH: verdict **${verdict}** (commit) → ${dest} · PR #${pr.number}.`,
        };
      }
    }
  }

  if (verdict) {
    const dest =
      verdict === "pass"
        ? "Human QA"
        : verdict === "clarify"
          ? "Human Clarify"
          : "Audit (ulang)";
    return {
      ok: true,
      auditVerdict: verdict,
      summary: `Audit ORCH: verdict **${verdict}** → ${dest} · PR #${pr.number}.`,
    };
  }
  return { ok: false };
}

async function syncActiveCompletion(ledger: DispatchLedger): Promise<DispatchLedger> {
  const active = getActiveLock(ledger, Date.now(), lockTtlMs());
  if (!active || !githubToken()) return ledger;
  const pr = await fetchPullRequestForIssue(active.issueNumber);
  if (!pr) {
    await logKad("warn", "dispatch.stage_check", {
      issueNumber: active.issueNumber,
      correlationId: active.correlationId,
      pipelineStage: active.pipelineStage,
      ok: false,
      reasons: ["PR branch agent belum ditemukan di GitHub"],
    });
    return ledger;
  }

  const commit = await fetchLatestCommitOnBranch(active.issueNumber);
  const afterCommit = commitAfterDispatch(commit, active.startedAt);
  const body = pr.body ?? "";

  let next: DispatchLedger | null = null;
  let summary: string | undefined;

  if (active.pipelineStage === "development") {
    const gate = checkDevelopmentStageGate(body, afterCommit);
    await logStageCheck(active, gate.ok, {
      prNumber: pr.number,
      reasons: gate.ok ? [] : gate.reasons,
    });
    if (!gate.ok) return ledger;
    summary = gate.summary;
    next = applyPullRequestCompletion(ledger, pr, new Date().toISOString(), summary);
    await writeLedger(next);
    await logKad("info", "dispatch.completed", {
      issueNumber: active.issueNumber,
      correlationId: active.correlationId,
      pipelineStage: active.pipelineStage,
      prNumber: pr.number,
      prUrl: pr.html_url,
      summary,
    });
    if (autoDispatchTestAfterDev()) {
      await logKad("info", "dispatch.auto_chain_attempt", {
        issueNumber: active.issueNumber,
        fromStage: "development",
        toStage: "test",
      });
      try {
        await dispatchBoardIssue(active.issueNumber, "development", "test");
        await logKad("info", "dispatch.auto_test_chained", {
          issueNumber: active.issueNumber,
        });
      } catch (e) {
        await logKad("warn", "dispatch.auto_test_failed", {
          issueNumber: active.issueNumber,
          message: e instanceof Error ? e.message : "unknown",
        });
      }
    }
    return readLedger();
  }

  if (active.pipelineStage === "test") {
    const checks = commit ? await fetchCheckConclusion(commit.sha) : "none";
    const ciSuccess = checks === "success";
    const gate = checkTestStageGate(body, ciSuccess, afterCommit);
    await logStageCheck(active, gate.ok, {
      prNumber: pr.number,
      ciSuccess,
      commitAfterDispatch: afterCommit,
      reasons: gate.ok ? [] : gate.reasons,
    });
    if (!gate.ok) return ledger;
    summary = gate.summary;
    next = applyPullRequestCompletion(
      ledger,
      pr,
      new Date().toISOString(),
      summary,
    );
    await writeLedger(next);
    await logKad("info", "dispatch.completed", {
      issueNumber: active.issueNumber,
      correlationId: active.correlationId,
      pipelineStage: active.pipelineStage,
      prNumber: pr.number,
      prUrl: pr.html_url,
      summary,
    });
    if (autoDispatchAuditAfterTest()) {
      await logKad("info", "dispatch.auto_chain_attempt", {
        issueNumber: active.issueNumber,
        fromStage: "test",
        toStage: "audit",
      });
      try {
        await dispatchBoardIssue(active.issueNumber, "test", "audit");
        await logKad("info", "dispatch.auto_audit_chained", {
          issueNumber: active.issueNumber,
        });
      } catch (e) {
        await logKad("warn", "dispatch.auto_audit_failed", {
          issueNumber: active.issueNumber,
          message: e instanceof Error ? e.message : "unknown",
        });
      }
    }
    return readLedger();
  }

  let auditVerdict: AuditVerdict | undefined;
  if (kadStrictStageGates()) {
    const gate = checkAuditStageGate(body);
    await logStageCheck(active, gate.ok, {
      prNumber: pr.number,
      reasons: gate.ok ? [] : gate.reasons,
    });
    if (!gate.ok) return ledger;
    summary = gate.summary;
    auditVerdict = gate.auditVerdict;
  } else {
    const legacy = await isAuditDispatchComplete(active, pr);
    await logStageCheck(active, legacy.ok, {
      prNumber: pr.number,
      mode: "legacy",
      reasons: legacy.ok ? [] : ["Audit belum memenuhi syarat (legacy)"],
    });
    if (!legacy.ok) return ledger;
    summary = legacy.summary;
    auditVerdict = legacy.auditVerdict;
  }

  next = applyPullRequestCompletion(
    ledger,
    pr,
    new Date().toISOString(),
    summary,
    auditVerdict,
  );
  await writeLedger(next);
  await logKad("info", "dispatch.completed", {
    issueNumber: active.issueNumber,
    correlationId: active.correlationId,
    pipelineStage: active.pipelineStage,
    prNumber: pr.number,
    prUrl: pr.html_url,
    summary,
    auditVerdict,
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
  pipelineStage: BoardDispatchStage,
): string {
  const body = issue.body?.trim() || "(tidak ada deskripsi)";
  const fromLine = fromStage
    ? `Kartu kanban dipindah dari **${fromStage}** ke **${pipelineStage}**.`
    : `Stage kanban: **${pipelineStage}**.`;
  const stageBlock =
    pipelineStage === "test"
      ? [
          "Kamu dipanggil pada **Test** (verifikasi ORCH).",
          "Acuan: pasangan dokumen develop (agent + development) bila ada, PR branch `agent/issue-" +
            issue.number +
            "`, dan kolom Output/verifikasi issue.",
          "Jalankan test/verifikasi (npm test / CI); perbaiki minimal jika gagal; tulis bukti (perintah, exit code) di komentar PR atau ## Test evidence di body PR.",
          "Update PR yang ada; jangan buka PR baru kecuali belum ada.",
          "Perbarui body PR dengan ringkasan hasil test agar kanban menampilkan summary.",
          "Jangan jalankan Audit penuh di run ini; setelah verifikasi lulus, papan otomatis lanjut ke Audit + run terpisah.",
        ]
      : pipelineStage === "audit"
        ? [
            "Kamu dipanggil pada **Audit** (review ORCH — pelaksana audit ≠ develop).",
            "Acuan: issue acceptance, PR branch `agent/issue-" +
              issue.number +
              "`, ## Summary, ## Test evidence, diff PR vs scope; pasangan dokumen develop/test bila ada.",
            "Review kontrak & diff; jangan menulis ulang fitur kecuali temuan bug kecil yang wajib diperbaiki agar audit jujur.",
            "Sebelum run selesai: tambahkan **## Audit** di body PR dengan **Verdict:** pass | fail | clarify (wajib). pass → kanban Human QA; clarify → Human Clarify; fail → tetap Audit untuk perbaikan/ulang.",
            "Opsional: dokumen agent + development stage audit di `Agentic/runs/` bila skill devops-agent dipakai.",
            "Update PR yang ada; jangan merge ke main/master.",
          ]
        : [
            "Kamu dipanggil pada **Development** (implementasi).",
            "Implementasi + test lokal relevan; buka atau perbarui PR di branch agent.",
            "Sebelum menyelesai run: perbarui **body PR** dengan bagian ## Summary (judul, file utama, cara uji) — dipakai papan kanban.",
            "Setelah PR ada, papan otomatis pindah ke Test dan run Test terpisah akan dipanggil; jangan jalankan stage Test dalam run Development ini.",
          ];
  return [
    `Kerjakan GitHub issue #${issue.number} di repo ${repo}.`,
    `Judul: ${issue.title}`,
    `URL: ${issue.html_url}`,
    "",
    fromLine,
    "Alur papan: Intake → Plan → Development → Test → Audit → Human Clarify → Human QA → Done.",
    ...stageBlock,
    "",
    "Acceptance / deskripsi issue:",
    body,
    "",
    "Aturan:",
    "- Branch: agent/issue-" + issue.number,
    "- Selaras ORCH: tulis dokumen agent + development untuk stage **" +
      pipelineStage +
      "** bila skill devops-agent dipakai.",
    "- Jangan merge ke main/master.",
    "- Jika blocker, komentari di PR/issue.",
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
  activePipelineStage: BoardDispatchStage | null;
  correlationId: string | null;
  repository: string;
  dispatchStages: BoardDispatchStage[];
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
    activePipelineStage: active?.pipelineStage ?? null,
    correlationId: active?.correlationId ?? null,
    repository: githubRepo(),
    dispatchStages: ["development", "test", "audit"],
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
  pipelineStage: BoardDispatchStage = "development",
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
      pipelineStage,
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
  const prompt = buildAgentPrompt(issue, repo, fromStage, pipelineStage);

  await postAutomationWebhook({
    source: "kad-v1",
    issueNumber,
    repository: repo,
    prompt,
    correlationId,
    pipelineStage,
    fromStage,
  });

  const completionKey = completionStorageKey(issueNumber, pipelineStage);
  const { [completionKey]: _prev, ...restCompleted } = ledger.completedByIssue;
  ledger = {
    active: {
      issueNumber,
      correlationId,
      startedAt: new Date(now).toISOString(),
      pipelineStage,
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
    pipelineStage,
    repository: repo,
    issueTitle: issue.title,
  });

  return {
    correlationId,
    issueNumber,
    issueTitle: issue.title,
  };
}

export async function getIssueAgentDetail(
  issueNumber: number,
  contextStage: BoardDispatchStage = "development",
): Promise<IssueAgentDetail> {
  let ledger = await readLedger();
  const activeLock = getActiveLock(ledger, Date.now(), lockTtlMs());
  if (
    dispatchEnabled() &&
    activeLock?.issueNumber === issueNumber &&
    githubToken()
  ) {
    ledger = await syncActiveCompletion(ledger);
  }
  const lock = getActiveLock(ledger, Date.now(), lockTtlMs());
  const active =
    lock?.issueNumber === issueNumber && lock.pipelineStage === contextStage
      ? lock
      : null;
  const completed =
    ledger.completedByIssue[completionStorageKey(issueNumber, contextStage)] ??
    null;
  const issue = await fetchGitHubIssue(issueNumber);
  const repo = githubRepo();
  const pullRequest = await fetchPullRequestForIssue(issueNumber);

  let agentStatus: IssueAgentDetail["agentStatus"] = "none";
  if (active) agentStatus = "active";
  else if (completed) agentStatus = "completed";

  return {
    issueNumber,
    repository: repo,
    contextStage,
    issue,
    agentStatus,
    active: active
      ? {
          correlationId: active.correlationId,
          startedAt: active.startedAt,
          pipelineStage: active.pipelineStage,
        }
      : null,
    completed,
    pullRequest,
    branch: agentBranchForIssue(issueNumber),
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

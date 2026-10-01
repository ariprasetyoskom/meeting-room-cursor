import {
  isBoardDispatchStage,
  type BoardDispatchStage,
  type BoardStatus,
} from "@/lib/project-board";
import type { AuditVerdict } from "@/lib/board-audit-verdict";
import { completionStorageKey } from "@/lib/board-dispatch-stages";

export const DISPATCH_EPIC_BLOCK = 30;
export const DISPATCH_DEBOUNCE_MS = 2000;

export function shouldTriggerDispatch(
  from: BoardStatus,
  to: BoardStatus,
): boolean {
  return isBoardDispatchStage(to) && from !== to;
}

export function isEpicDispatchBlocked(issueNumber: number): boolean {
  return issueNumber === DISPATCH_EPIC_BLOCK;
}

export type DispatchLock = {
  issueNumber: number;
  correlationId: string;
  startedAt: string;
  pipelineStage: BoardDispatchStage;
};

export type DispatchCompletedRun = {
  issueNumber: number;
  correlationId: string;
  completedAt: string;
  summary: string;
  prNumber: number;
  prUrl: string;
  prState: string;
  pipelineStage: BoardDispatchStage;
  auditVerdict?: AuditVerdict;
};

export type DispatchLedger = {
  active: DispatchLock | null;
  lastDispatchAtByIssue: Record<string, number>;
  completedByIssue: Record<string, DispatchCompletedRun>;
};

export function createEmptyLedger(): DispatchLedger {
  return {
    active: null,
    lastDispatchAtByIssue: {},
    completedByIssue: {},
  };
}

export function agentBranchForIssue(issueNumber: number): string {
  return `agent/issue-${issueNumber}`;
}

export function normalizeDispatchLedger(ledger: DispatchLedger): DispatchLedger {
  const completedByIssue: Record<string, DispatchCompletedRun> = {};
  for (const [key, run] of Object.entries(ledger.completedByIssue ?? {})) {
    const stage: BoardDispatchStage =
      run.pipelineStage ??
      (key.includes(":") ? (key.split(":")[1] as BoardDispatchStage) : "development");
    const issueNumber = run.issueNumber;
    completedByIssue[completionStorageKey(issueNumber, stage)] = {
      ...run,
      pipelineStage: stage,
      issueNumber,
    };
  }
  let active = ledger.active;
  if (active) {
    active = {
      ...active,
      pipelineStage: active.pipelineStage ?? "development",
    };
  }
  return {
    active,
    lastDispatchAtByIssue: ledger.lastDispatchAtByIssue ?? {},
    completedByIssue,
  };
}

export function isLockStale(
  lock: DispatchLock,
  nowMs: number,
  ttlMs: number,
): boolean {
  const started = Date.parse(lock.startedAt);
  if (Number.isNaN(started)) return true;
  return nowMs - started > ttlMs;
}

export function getActiveLock(
  ledger: DispatchLedger,
  nowMs: number,
  ttlMs: number,
): DispatchLock | null {
  if (!ledger.active) return null;
  if (isLockStale(ledger.active, nowMs, ttlMs)) return null;
  return ledger.active;
}

export function assertCanDispatch(
  ledger: DispatchLedger,
  issueNumber: number,
  nowMs: number,
  ttlMs: number,
): { ok: true } | { ok: false; code: "LOCKED" | "DEBOUNCE" | "EPIC" } {
  if (isEpicDispatchBlocked(issueNumber)) {
    return { ok: false, code: "EPIC" };
  }
  const active = getActiveLock(ledger, nowMs, ttlMs);
  if (active && active.issueNumber !== issueNumber) {
    return { ok: false, code: "LOCKED" };
  }
  const last = ledger.lastDispatchAtByIssue[String(issueNumber)];
  if (last != null && nowMs - last < DISPATCH_DEBOUNCE_MS) {
    return { ok: false, code: "DEBOUNCE" };
  }
  return { ok: true };
}

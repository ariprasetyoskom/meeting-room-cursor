import {
  BOARD_DISPATCH_STAGE,
  type BoardStatus,
} from "@/lib/project-board";

export const DISPATCH_EPIC_BLOCK = 30;
export const DISPATCH_DEBOUNCE_MS = 2000;

export function shouldTriggerDispatch(
  from: BoardStatus,
  to: BoardStatus,
): boolean {
  return to === BOARD_DISPATCH_STAGE && from !== BOARD_DISPATCH_STAGE;
}

export function isEpicDispatchBlocked(issueNumber: number): boolean {
  return issueNumber === DISPATCH_EPIC_BLOCK;
}

export type DispatchLock = {
  issueNumber: number;
  correlationId: string;
  startedAt: string;
};

export type DispatchLedger = {
  active: DispatchLock | null;
  lastDispatchAtByIssue: Record<string, number>;
};

export function createEmptyLedger(): DispatchLedger {
  return { active: null, lastDispatchAtByIssue: {} };
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

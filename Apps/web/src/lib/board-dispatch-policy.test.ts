import { describe, expect, it } from "vitest";
import {
  assertCanDispatch,
  createEmptyLedger,
  isEpicDispatchBlocked,
  shouldTriggerDispatch,
} from "./board-dispatch-policy";

describe("board dispatch policy", () => {
  it("only triggers when entering in_progress", () => {
    expect(shouldTriggerDispatch("todo", "in_progress")).toBe(true);
    expect(shouldTriggerDispatch("done", "in_progress")).toBe(true);
    expect(shouldTriggerDispatch("in_progress", "done")).toBe(false);
    expect(shouldTriggerDispatch("in_progress", "in_progress")).toBe(false);
  });

  it("blocks epic #30", () => {
    expect(isEpicDispatchBlocked(30)).toBe(true);
    expect(isEpicDispatchBlocked(35)).toBe(false);
  });

  it("rejects when another issue is active", () => {
    const ledger = createEmptyLedger();
    ledger.active = {
      issueNumber: 35,
      correlationId: "abc",
      startedAt: new Date().toISOString(),
    };
    const result = assertCanDispatch(ledger, 36, Date.now(), 4 * 60 * 60 * 1000);
    expect(result).toEqual({ ok: false, code: "LOCKED" });
  });

  it("debounces repeat dispatch on same issue", () => {
    const ledger = createEmptyLedger();
    const now = Date.now();
    ledger.lastDispatchAtByIssue["35"] = now - 500;
    const result = assertCanDispatch(ledger, 35, now, 4 * 60 * 60 * 1000);
    expect(result).toEqual({ ok: false, code: "DEBOUNCE" });
  });
});

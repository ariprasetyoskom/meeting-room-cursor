import { describe, expect, it } from "vitest";
import { createEmptyLedger } from "./board-dispatch-policy";
import {
  applyPullRequestCompletion,
  buildCompletionSummary,
} from "./board-dispatch";

describe("dispatch completion", () => {
  it("builds summary from PR title when body empty", () => {
    expect(
      buildCompletionSummary({
        number: 41,
        title: "Fix calendar scroll",
        html_url: "https://github.com/o/r/pull/41",
        state: "open",
        body: "",
      }),
    ).toBe("Fix calendar scroll");
  });

  it("clears active lock and stores completion", () => {
    const ledger = createEmptyLedger();
    ledger.active = {
      issueNumber: 35,
      correlationId: "abc",
      startedAt: new Date().toISOString(),
    };
    const next = applyPullRequestCompletion(
      ledger,
      {
        number: 41,
        title: "PR title",
        html_url: "https://github.com/o/r/pull/41",
        state: "open",
        body: "Ringkas perubahan UI calendar.",
      },
      "2026-10-01T00:00:00.000Z",
    );
    expect(next.active).toBeNull();
    expect(next.completedByIssue["35"]?.prNumber).toBe(41);
    expect(next.completedByIssue["35"]?.summary).toContain("calendar");
  });
});

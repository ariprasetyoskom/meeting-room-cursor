import { afterEach, describe, expect, it } from "vitest";
import {
  checkAuditStageGate,
  checkDevelopmentStageGate,
  checkTestStageGate,
  stageGateEvidenceBody,
} from "./board-kad-stage-gates";

describe("KAD stage gates", () => {
  const env = process.env.BOARD_KAD_DEFER_PR_UNTIL_HUMAN_QA;

  afterEach(() => {
    if (env === undefined) delete process.env.BOARD_KAD_DEFER_PR_UNTIL_HUMAN_QA;
    else process.env.BOARD_KAD_DEFER_PR_UNTIL_HUMAN_QA = env;
  });

  it("prefers issue body when defer PR mode env set", () => {
    process.env.BOARD_KAD_DEFER_PR_UNTIL_HUMAN_QA = "true";
    expect(stageGateEvidenceBody("issue-summary", "pr-summary")).toBe(
      "issue-summary",
    );
  });

  const devBody = `## Summary
Perubahan logo MR dan aria-label pada BrandLogo.

## Test evidence
_(placeholder)_
`;

  it("blocks development without summary content", () => {
    const r = checkDevelopmentStageGate("Closes #45", false);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons[0]).toMatch(/Summary/);
  });

  it("passes development with summary and commit", () => {
    const r = checkDevelopmentStageGate(devBody, true);
    expect(r.ok).toBe(true);
  });

  it("blocks test while evidence is placeholder", () => {
    const r = checkTestStageGate(devBody, false, true);
    expect(r.ok).toBe(false);
  });

  it("passes test with exit code 0 in evidence", () => {
    const r = checkTestStageGate(
      "## Summary\nok\n\n## Test evidence\n```\ncd Apps/web && npm test\nexit code 0\n```",
      false,
      true,
    );
    expect(r.ok).toBe(true);
  });

  it("blocks audit with pending verdict", () => {
    const r = checkAuditStageGate(
      "## Audit\n**Verdict:** _(pending — stage Audit)_\n",
    );
    expect(r.ok).toBe(false);
  });

  it("passes audit with pass verdict in PR", () => {
    const r = checkAuditStageGate("## Audit\n- **Verdict:** pass\n");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.auditVerdict).toBe("pass");
  });
});

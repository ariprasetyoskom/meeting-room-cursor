import { describe, expect, it } from "vitest";
import {
  boardStatusAfterAuditVerdict,
  parseAuditVerdictFromLooseText,
  parseAuditVerdictFromPrBody,
} from "./board-audit-verdict";

describe("audit verdict parsing", () => {
  it("reads verdict from ## Audit section", () => {
    const body = `## Summary\nok\n\n## Audit\n- **Verdict:** clarify\n- Temuan: scope\n`;
    expect(parseAuditVerdictFromPrBody(body)).toBe("clarify");
  });

  it("reads verdict from commit-style message", () => {
    expect(
      parseAuditVerdictFromLooseText(
        "docs(issue-38): ORCH audit stage verdict pass (UI-08)",
      ),
    ).toBe("pass");
  });

  it("maps verdict to kanban column", () => {
    expect(boardStatusAfterAuditVerdict("pass")).toBe("human_qa");
    expect(boardStatusAfterAuditVerdict("clarify")).toBe("human_clarify");
    expect(boardStatusAfterAuditVerdict("fail")).toBeNull();
  });
});

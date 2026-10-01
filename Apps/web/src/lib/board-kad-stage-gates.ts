import type { BoardDispatchStage } from "@/lib/project-board";
import {
  parseAuditVerdictFromPrBody,
  type AuditVerdict,
} from "@/lib/board-audit-verdict";

export type StageGateResult =
  | { ok: true; summary: string; auditVerdict?: AuditVerdict }
  | { ok: false; reasons: string[] };

export function kadStrictStageGates(): boolean {
  return process.env.BOARD_KAD_STRICT_GATES !== "false";
}

/** Commit di branch agent dulu; bukti stage di body issue; PR dibuka setelah Human QA lulus. */
export function kadDeferPrUntilHumanQa(): boolean {
  return process.env.BOARD_KAD_DEFER_PR_UNTIL_HUMAN_QA === "true";
}

export function stageGateEvidenceBody(
  issueBody: string,
  prBody: string | undefined,
): string {
  if (kadDeferPrUntilHumanQa()) {
    return issueBody ?? "";
  }
  return prBody ?? issueBody ?? "";
}

export function extractPrSection(body: string, heading: string): string {
  const re = new RegExp(
    `(?:^|\\n)##\\s*${heading}\\b[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`,
    "i",
  );
  const match = body.match(re);
  return match?.[1]?.trim() ?? "";
}

export function hasPrSection(body: string, heading: string): boolean {
  return new RegExp(`(?:^|\\n)##\\s*${heading}\\b`, "i").test(body);
}

function isPlaceholderSection(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (/^_\([^)]*\)_$/i.test(t)) return true;
  if (/diisi pada stage/i.test(t) && t.length < 120) return true;
  return false;
}

export function checkDevelopmentStageGate(
  prBody: string,
  hasCommitAfterDispatch: boolean,
): StageGateResult {
  const reasons: string[] = [];
  if (!hasPrSection(prBody, "Summary")) {
    reasons.push("PR body belum memiliki ## Summary");
  } else {
    const section = extractPrSection(prBody, "Summary");
    if (isPlaceholderSection(section) || section.length < 40) {
      reasons.push("## Summary kosong atau terlalu singkat");
    }
  }
  if (kadStrictStageGates() && !hasCommitAfterDispatch) {
    reasons.push(
      "Belum ada commit baru di branch agent setelah dispatch Development",
    );
  }
  if (reasons.length > 0) return { ok: false, reasons };
  return {
    ok: true,
    summary: extractPrSection(prBody, "Summary").split("\n")[0]?.trim() ?? "Development selesai",
  };
}

export function checkTestStageGate(
  prBody: string,
  ciSuccess: boolean,
  hasCommitAfterDispatch: boolean,
): StageGateResult {
  const reasons: string[] = [];
  if (!hasPrSection(prBody, "Test evidence")) {
    reasons.push("PR body belum memiliki ## Test evidence");
  } else {
    const section = extractPrSection(prBody, "Test evidence");
    if (isPlaceholderSection(section)) {
      reasons.push("## Test evidence masih placeholder — isi bukti test");
    } else if (kadStrictStageGates()) {
      const exitZero =
        /npm test[\s\S]{0,200}exit code\s*0/i.test(section) ||
        /\|\s*`?npm test`?\s*\|\s*0\s*\|/i.test(section) ||
        /exit code:\s*0/i.test(section);
      if (!exitZero && !ciSuccess) {
        reasons.push(
          "Test belum lulus: butuh CI hijau di head PR atau bukti exit code 0 di ## Test evidence",
        );
      }
    }
  }
  if (!kadStrictStageGates()) {
    if (ciSuccess) {
      return { ok: true, summary: "Verifikasi test: CI lulus." };
    }
    if (hasCommitAfterDispatch) {
      return { ok: true, summary: "Verifikasi test: commit setelah dispatch." };
    }
    return { ok: false, reasons: ["Test belum selesai (mode legacy)"] };
  }
  if (reasons.length > 0) return { ok: false, reasons };
  const via = ciSuccess ? "CI lulus" : "exit code 0 tercatat";
  return { ok: true, summary: `Verifikasi test: ${via}.` };
}

export function checkAuditStageGate(prBody: string): StageGateResult {
  const reasons: string[] = [];
  if (!hasPrSection(prBody, "Audit")) {
    reasons.push("PR body belum memiliki ## Audit");
  }
  const verdict = parseAuditVerdictFromPrBody(prBody);
  if (!verdict) {
    const section = extractPrSection(prBody, "Audit");
    if (/pending/i.test(section)) {
      reasons.push("Verdict Audit masih pending — isi **Verdict:** pass | fail | clarify");
    } else {
      reasons.push(
        "Verdict Audit tidak valid — wajib **Verdict:** pass | fail | clarify di ## Audit",
      );
    }
    return { ok: false, reasons };
  }
  if (kadStrictStageGates() && verdict === "fail") {
    return {
      ok: false,
      reasons: ["Verdict fail — perbaiki PR lalu dispatch Audit ulang"],
    };
  }
  const dest =
    verdict === "pass"
      ? "Human QA"
      : verdict === "clarify"
        ? "Human Clarify"
        : "Audit";
  return {
    ok: true,
    auditVerdict: verdict,
    summary: `Audit ORCH: verdict **${verdict}** → ${dest}.`,
  };
}

export function stageGateLabel(stage: BoardDispatchStage): string {
  switch (stage) {
    case "development":
      return "Development";
    case "test":
      return "Test";
    case "audit":
      return "Audit";
    default:
      return stage;
  }
}

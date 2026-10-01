export type AuditVerdict = "pass" | "fail" | "clarify";

export function extractAuditSection(body: string): string {
  const match = body.match(/(?:^|\n)##\s*audit\b[^\n]*\n([\s\S]*?)(?=\n##\s|$)/i);
  return match?.[1]?.trim() ?? "";
}

function parseVerdictInHaystack(haystack: string): AuditVerdict | null {
  const match =
    haystack.match(/\*\*verdict:\*\*\s*(pass|fail|clarify)\b/i) ??
    haystack.match(/\*\*verdict\*\*\s*:\s*(pass|fail|clarify)\b/i) ??
    haystack.match(/(?:^|\s)verdict\s*:\s*(pass|fail|clarify)\b/im) ??
    haystack.match(/\bverdict\s+(pass|fail|clarify)\b/i);
  if (!match) return null;
  return match[1].toLowerCase() as AuditVerdict;
}

export function parseAuditVerdictFromPrBody(body: string): AuditVerdict | null {
  const hasAuditHeading = /(?:^|\n)##\s*audit\b/i.test(body);
  if (!hasAuditHeading) return null;
  const section = extractAuditSection(body);
  const haystack = section.length > 0 ? section : body;
  return parseVerdictInHaystack(haystack);
}

/** Commit message / teks bebas (ORCH doc di branch tanpa update body PR). */
export function parseAuditVerdictFromLooseText(text: string): AuditVerdict | null {
  return parseVerdictInHaystack(text);
}

export function boardStatusAfterAuditVerdict(
  verdict: AuditVerdict | null | undefined,
): "human_qa" | "human_clarify" | null {
  if (verdict === "pass") return "human_qa";
  if (verdict === "clarify") return "human_clarify";
  return null;
}

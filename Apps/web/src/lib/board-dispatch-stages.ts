import type { BoardDispatchStage } from "@/lib/project-board";

export function completionStorageKey(
  issueNumber: number,
  stage: BoardDispatchStage,
): string {
  return `${issueNumber}:${stage}`;
}

export function parseCompletionStorageKey(
  key: string,
): { issueNumber: number; stage: BoardDispatchStage } | null {
  const [rawIssue, stage] = key.split(":");
  const issueNumber = Number(rawIssue);
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) return null;
  if (stage !== "development" && stage !== "test" && stage !== "audit") {
    return null;
  }
  return { issueNumber, stage };
}

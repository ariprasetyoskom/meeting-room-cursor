import type { BoardDispatchStage } from "@/lib/project-board";

export type IssueAgentDetail = {
  issueNumber: number;
  repository: string;
  contextStage: BoardDispatchStage;
  issue: {
    number: number;
    title: string;
    body: string;
    html_url: string;
    state: string;
  };
  agentStatus: "none" | "active" | "completed";
  active: {
    correlationId: string;
    startedAt: string;
    pipelineStage: BoardDispatchStage;
  } | null;
  completed: {
    issueNumber: number;
    correlationId: string;
    completedAt: string;
    summary: string;
    prNumber: number;
    prUrl: string;
    prState: string;
    pipelineStage: BoardDispatchStage;
  } | null;
  pullRequest: {
    number: number;
    title: string;
    html_url: string;
    state: string;
    body: string;
  } | null;
  branch: string;
};

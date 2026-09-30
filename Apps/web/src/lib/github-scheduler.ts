import { getOptionalEnv } from "@/lib/env";

const WORKFLOW_FILE = "project-board-check.yml";
const VAR_ENABLED = "PROJECT_SCHEDULER_ENABLED";
const VAR_SYNC = "PROJECT_SYNC_ON_SCHEDULE";

export class SchedulerNotConfiguredError extends Error {
  constructor() {
    super(
      "GitHub scheduler belum dikonfigurasi. Set GH_SCHEDULER_ADMIN_TOKEN di server.",
    );
    this.name = "SchedulerNotConfiguredError";
  }
}

function getGitHubConfig() {
  const token = process.env.GH_SCHEDULER_ADMIN_TOKEN?.trim();
  const owner = getOptionalEnv("GITHUB_REPO_OWNER", "ariprasetyoskom");
  const repo = getOptionalEnv("GITHUB_REPO_NAME", "meeting-room-cursor");
  return { token, owner, repo };
}

function parseBool(value: string | null | undefined, defaultValue: boolean): boolean {
  if (value == null || value === "") return defaultValue;
  return value === "true" || value === "1";
}

async function githubFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const { token, owner, repo } = getGitHubConfig();
  if (!token) throw new SchedulerNotConfiguredError();

  const url = `https://api.github.com/repos/${owner}/${repo}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers as Record<string, string>),
    },
    cache: "no-store",
  });
  return res;
}

async function getVariable(name: string): Promise<string | null> {
  const res = await githubFetch(`/actions/variables/${encodeURIComponent(name)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub variable ${name}: ${res.status} ${body}`);
  }
  const data = (await res.json()) as { value: string };
  return data.value;
}

async function upsertVariable(name: string, value: string): Promise<void> {
  const existing = await getVariable(name);
  if (existing === null) {
    const res = await githubFetch("/actions/variables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, value }),
    });
    if (!res.ok) {
      throw new Error(`GitHub create variable: ${res.status} ${await res.text()}`);
    }
    return;
  }

  const res = await githubFetch(`/actions/variables/${encodeURIComponent(name)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });
  if (!res.ok) {
    throw new Error(`GitHub update variable: ${res.status} ${await res.text()}`);
  }
}

export type SchedulerStatus = {
  configured: boolean;
  enabled: boolean;
  syncOnSchedule: boolean;
  workflowUrl: string;
  actionsUrl: string;
  lastRun: {
    id: number;
    status: string;
    conclusion: string | null;
    createdAt: string;
    htmlUrl: string;
  } | null;
};

export async function getSchedulerStatus(): Promise<SchedulerStatus> {
  const { owner, repo, token } = getGitHubConfig();
  const workflowUrl = `https://github.com/${owner}/${repo}/blob/master/.github/workflows/${WORKFLOW_FILE}`;
  const actionsUrl = `https://github.com/${owner}/${repo}/actions/workflows/${WORKFLOW_FILE}`;

  if (!token) {
    return {
      configured: false,
      enabled: true,
      syncOnSchedule: false,
      workflowUrl,
      actionsUrl,
      lastRun: null,
    };
  }

  const [enabledRaw, syncRaw, runsRes] = await Promise.all([
    getVariable(VAR_ENABLED),
    getVariable(VAR_SYNC),
    githubFetch(
      `/actions/workflows/${WORKFLOW_FILE}/runs?per_page=1&event=schedule`,
    ),
  ]);

  let lastRun: SchedulerStatus["lastRun"] = null;
  if (runsRes.ok) {
    const runs = (await runsRes.json()) as {
      workflow_runs: Array<{
        id: number;
        status: string;
        conclusion: string | null;
        created_at: string;
        html_url: string;
      }>;
    };
    const run = runs.workflow_runs?.[0];
    if (run) {
      lastRun = {
        id: run.id,
        status: run.status,
        conclusion: run.conclusion,
        createdAt: run.created_at,
        htmlUrl: run.html_url,
      };
    }
  }

  return {
    configured: true,
    enabled: parseBool(enabledRaw, true),
    syncOnSchedule: parseBool(syncRaw, false),
    workflowUrl,
    actionsUrl,
    lastRun,
  };
}

export async function updateSchedulerSettings(input: {
  enabled?: boolean;
  syncOnSchedule?: boolean;
}): Promise<SchedulerStatus> {
  if (input.enabled !== undefined) {
    await upsertVariable(VAR_ENABLED, input.enabled ? "true" : "false");
  }
  if (input.syncOnSchedule !== undefined) {
    await upsertVariable(VAR_SYNC, input.syncOnSchedule ? "true" : "false");
  }
  return getSchedulerStatus();
}

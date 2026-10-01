"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/client-api";
import {
  BOARD_COLUMNS,
  BOARD_REPO,
  isBoardDispatchStage,
  type BoardCard,
} from "@/lib/project-board";
import type { IssueAgentDetail } from "@/lib/board-agent-detail";
import { Alert, Button } from "./ui";

type Props = {
  card: BoardCard | null;
  onClose: () => void;
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function agentStatusLabel(status: IssueAgentDetail["agentStatus"]): string {
  if (status === "active") return "Agent aktif";
  if (status === "completed") return "Agent selesai";
  return "Belum ada run agent";
}

export function BoardCardAgentModal({ card, onClose }: Props) {
  const [detail, setDetail] = useState<IssueAgentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!card) {
      setDetail(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const stage = isBoardDispatchStage(card.status) ? card.status : "development";
    void apiFetch<IssueAgentDetail>(
      `/api/v1/admin/board/issues/${card.number}/agent?stage=${stage}`,
    )
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e instanceof ApiError ? e.message : "Gagal memuat detail agent.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [card]);

  useEffect(() => {
    if (!card) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, onClose]);

  if (!card) return null;

  const columnLabel =
    BOARD_COLUMNS.find((column) => column.id === card.status)?.label ??
    card.status;

  const pr = detail?.pullRequest;
  const completed = detail?.completed;
  const summary =
    completed?.summary ??
    (pr ? pr.title : null);

  const workBody = pr?.body?.trim() || "";

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal modal-wide project-board-detail-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-labelledby="board-card-detail-title"
      >
        <h2 id="board-card-detail-title">
          {BOARD_REPO} #{card.number}
        </h2>
        <p className="text-muted project-board-detail-meta">
          Kolom: <strong>{columnLabel}</strong>
          {detail?.branch && (
            <>
              {" · "}
              Branch: <code>{detail.branch}</code>
            </>
          )}
        </p>
        <h3 className="project-board-detail-issue-title">{card.title}</h3>

        {loading && <p className="text-muted">Memuat detail agent…</p>}
        {error && (
          <Alert variant="error" className="project-board-alert">
            {error}
          </Alert>
        )}

        {detail && !loading && (
          <div className="project-board-detail-sections">
            <section>
              <h4>Status agent</h4>
              <p
                className={`project-board-agent-badge project-board-detail-status ${detail.agentStatus === "completed" ? "is-complete" : ""}`}
              >
                {agentStatusLabel(detail.agentStatus)} · {detail.contextStage}
              </p>
              {detail.active && (
                <ul className="project-board-detail-list">
                  <li>
                    Mulai: {formatWhen(detail.active.startedAt)}
                  </li>
                  <li>
                    Run ID:{" "}
                    <code>{detail.active.correlationId.slice(0, 8)}…</code>
                  </li>
                </ul>
              )}
              {completed && (
                <ul className="project-board-detail-list">
                  <li>Selesai: {formatWhen(completed.completedAt)}</li>
                  <li>
                    Run ID: <code>{completed.correlationId.slice(0, 8)}…</code>
                  </li>
                </ul>
              )}
            </section>

            {(summary || workBody) && (
              <section>
                <h4>Yang dilakukan agent</h4>
                {summary && (
                  <p className="project-board-detail-summary">{summary}</p>
                )}
                {workBody && (
                  <pre className="project-board-detail-pre">{workBody}</pre>
                )}
              </section>
            )}

            {pr && (
              <section>
                <h4>Pull request</h4>
                <p>
                  <a href={pr.html_url} target="_blank" rel="noreferrer">
                    PR #{pr.number} — {pr.title}
                  </a>
                  {" · "}
                  <span className="text-muted">{pr.state}</span>
                </p>
              </section>
            )}

            <section>
              <h4>Issue GitHub</h4>
              <p className="text-muted project-board-detail-issue-body">
                {detail.issue.body?.trim() || "(tidak ada deskripsi)"}
              </p>
              <p>
                <a
                  href={detail.issue.html_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buka issue di GitHub
                </a>
              </p>
            </section>
          </div>
        )}

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BOARD_CARDS,
  BOARD_COLUMNS,
  BOARD_REPO,
  type BoardCard,
  type BoardStatus,
  filterCards,
  moveCard,
  uiEpicProgress,
} from "@/lib/project-board";
import { shouldTriggerDispatch } from "@/lib/board-dispatch-policy";
import { ApiError, apiFetch } from "@/lib/client-api";
import { Alert } from "./ui/Alert";

type DispatchCompletedRun = {
  issueNumber: number;
  correlationId: string;
  completedAt: string;
  summary: string;
  prNumber: number;
  prUrl: string;
  prState: string;
};

type DispatchStatus = {
  enabled: boolean;
  configured: boolean;
  activeIssueNumber: number | null;
  correlationId: string | null;
  repository: string;
  pipelineStage?: string;
  completedByIssue?: Record<string, DispatchCompletedRun>;
};

export function ProjectBoard() {
  const [cards, setCards] = useState<BoardCard[]>(BOARD_CARDS);
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<BoardStatus | null>(null);
  const [live, setLive] = useState("");
  const [dispatchStatus, setDispatchStatus] = useState<DispatchStatus | null>(
    null,
  );
  const [boardError, setBoardError] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState<number | null>(null);
  const [clearingLock, setClearingLock] = useState(false);

  const refreshDispatchStatus = useCallback(async () => {
    try {
      const status = await apiFetch<DispatchStatus>(
        "/api/v1/admin/board/dispatch",
      );
      setDispatchStatus(status);
    } catch {
      setDispatchStatus(null);
    }
  }, []);

  useEffect(() => {
    void refreshDispatchStatus();
  }, [refreshDispatchStatus]);

  useEffect(() => {
    if (!dispatchStatus?.enabled || dispatchStatus.activeIssueNumber == null) {
      return;
    }
    const id = window.setInterval(() => {
      void refreshDispatchStatus();
    }, 15_000);
    return () => window.clearInterval(id);
  }, [
    dispatchStatus?.enabled,
    dispatchStatus?.activeIssueNumber,
    refreshDispatchStatus,
  ]);

  const visible = useMemo(() => filterCards(cards, query), [cards, query]);
  const progress = uiEpicProgress(cards);
  const progressPct = progress.total
    ? Math.round((progress.done / progress.total) * 100)
    : 0;

  const place = useCallback(
    async (number: number, status: BoardStatus) => {
      const current = cards.find((card) => card.number === number);
      if (!current || current.status === status) return;

      const from = current.status;
      const label = BOARD_COLUMNS.find((column) => column.id === status)?.label;

      const applyMove = () => {
        setCards((prev) => moveCard(prev, number, status));
      };

      const revertMove = () => {
        setCards((prev) => moveCard(prev, number, from));
      };

      if (
        !shouldTriggerDispatch(from, status) ||
        !dispatchStatus?.enabled
      ) {
        applyMove();
        setLive(`meeting-room-cursor #${number} dipindah ke ${label}.`);
        return;
      }

      applyMove();
      setBoardError(null);
      setDispatching(number);

      try {
        const result = await apiFetch<{
          correlationId: string;
          issueNumber: number;
          issueTitle: string;
        }>("/api/v1/admin/board/dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ issueNumber: number, fromStage: from }),
        });
        setLive(
          `Agent dipanggil untuk #${result.issueNumber} (${result.correlationId.slice(0, 8)}…).`,
        );
        await refreshDispatchStatus();
      } catch (e) {
        revertMove();
        const message =
          e instanceof ApiError
            ? e.message
            : "Gagal memanggil agent. Kartu dikembalikan.";
        setBoardError(message);
        setLive(`#${number} tidak pindah ke Development: ${message}`);
      } finally {
        setDispatching(null);
      }
    },
    [cards, dispatchStatus?.enabled, refreshDispatchStatus],
  );

  const clearActiveLock = useCallback(async () => {
    setClearingLock(true);
    setBoardError(null);
    try {
      await apiFetch<{ cleared: boolean }>("/api/v1/admin/board/dispatch", {
        method: "DELETE",
      });
      setLive("Lock dispatch dilepas.");
      await refreshDispatchStatus();
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : "Gagal melepas lock dispatch.";
      setBoardError(message);
    } finally {
      setClearingLock(false);
    }
  }, [refreshDispatchStatus]);

  const activeAgentIssue = dispatchStatus?.activeIssueNumber ?? null;
  const completedByIssue = dispatchStatus?.completedByIssue ?? {};

  return (
    <section className="project-board" aria-label="Papan meeting-room-cursor">
      <div className="project-board-toolbar">
        <h1 className="project-board-title">{BOARD_REPO}</h1>
        <div className="project-board-views">
          <span className="project-board-view-current">Auto development</span>
        </div>
        <label className="project-board-filter">
          <span className="sr-only">Filter kartu</span>
          <input
            type="search"
            value={query}
            placeholder="Filter by keyword or by field"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <p className="project-board-pipeline text-muted" aria-hidden="true">
        {BOARD_COLUMNS.map((column) => column.label).join(" → ")}
      </p>

      {dispatchStatus?.enabled && (
        <div className="project-board-dispatch-row">
          <p className="project-board-dispatch-hint text-muted">
            Geser ke <strong>Development</strong> memanggil agent Cursor
            {dispatchStatus.configured
              ? activeAgentIssue
                ? ` (aktif: #${activeAgentIssue})`
                : " (siap)"
              : " — webhook belum dikonfigurasi di server"}
            . Lihat{" "}
            <a href="/admin/scheduler">Scheduler</a> · runbook di{" "}
            <code>Docs/KANBAN-AGENT-DISPATCH-RUNBOOK.md</code>.
          </p>
          {activeAgentIssue != null && (
            <button
              type="button"
              className="project-board-clear-lock"
              disabled={clearingLock}
              onClick={() => void clearActiveLock()}
            >
              {clearingLock ? "Melepas…" : "Lepas lock"}
            </button>
          )}
        </div>
      )}

      {boardError && (
        <Alert variant="error" className="project-board-alert">
          {boardError}
        </Alert>
      )}

      <p className="sr-only" aria-live="polite">
        {live}
      </p>

      <div className="project-board-scroll">
        <div className="project-board-columns">
        {BOARD_COLUMNS.map((column) => {
          const items = visible
            .filter((card) => card.status === column.id)
            .slice()
            .sort((a, b) => a.number - b.number);
          const total = cards.filter((card) => card.status === column.id).length;
          return (
            <div
              key={column.id}
              className={`project-board-column ${column.humanGate ? "is-human-gate" : ""} ${dropTarget === column.id ? "is-drop-target" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDropTarget(column.id);
              }}
              onDragLeave={() => {
                setDropTarget((current) => (current === column.id ? null : current));
              }}
              onDrop={(event) => {
                event.preventDefault();
                const raw = event.dataTransfer.getData("text/plain");
                const number = Number(raw);
                if (Number.isFinite(number)) void place(number, column.id);
                setDragging(null);
                setDropTarget(null);
              }}
            >
              <header className="project-board-column-head">
                <div className="project-board-column-title">
                  <span className={`project-board-dot dot-${column.id}`} aria-hidden="true" />
                  <h2>
                    {column.label}{" "}
                    <span className="project-board-count">{query ? items.length : total}</span>
                  </h2>
                </div>
                <p>{column.description}</p>
              </header>
              <ul className="project-board-cards" aria-label={column.label}>
                {items.map((card) => (
                  <li key={card.number}>
                    <article
                      className={`project-board-card ${dragging === card.number ? "is-dragging" : ""} ${dispatching === card.number ? "is-dispatching" : ""} ${activeAgentIssue === card.number ? "is-agent-active" : ""} ${completedByIssue[String(card.number)] && activeAgentIssue !== card.number ? "is-agent-done" : ""}`}
                      draggable={dispatching !== card.number}
                      tabIndex={0}
                      aria-label={`${BOARD_REPO} #${card.number}. ${card.title}. ${column.label}`}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", String(card.number));
                        event.dataTransfer.effectAllowed = "move";
                        setDragging(card.number);
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setDropTarget(null);
                      }}
                      onKeyDown={(event) => {
                        const order = BOARD_COLUMNS.map((item) => item.id);
                        const index = order.indexOf(card.status);
                        if (event.key === "ArrowRight" && index < order.length - 1) {
                          event.preventDefault();
                          void place(card.number, order[index + 1]);
                        }
                        if (event.key === "ArrowLeft" && index > 0) {
                          event.preventDefault();
                          void place(card.number, order[index - 1]);
                        }
                      }}
                    >
                      <div className="project-board-card-kicker">
                        <span className={`project-board-dot dot-${card.status}`} aria-hidden="true" />
                        <span>
                          {BOARD_REPO}{" "}
                          <span className="project-board-issue">#{card.number}</span>
                        </span>
                      </div>
                      <h3>{card.title}</h3>
                      {activeAgentIssue === card.number && (
                        <p className="project-board-agent-badge">Agent aktif</p>
                      )}
                      {activeAgentIssue !== card.number &&
                        completedByIssue[String(card.number)] && (
                          <>
                            <p className="project-board-agent-badge is-complete">
                              Agent selesai
                            </p>
                            <p className="project-board-agent-summary">
                              {completedByIssue[String(card.number)].summary}
                            </p>
                            <p className="project-board-agent-summary">
                              <a
                                href={
                                  completedByIssue[String(card.number)].prUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                PR #{completedByIssue[String(card.number)].prNumber}
                              </a>
                              {" · "}
                              {completedByIssue[String(card.number)].prState}
                            </p>
                          </>
                        )}
                      {card.number === 30 && (
                        <div className="project-board-progress">
                          <span>
                            {progress.done} / {progress.total}
                          </span>
                          <span className="project-board-segments" aria-hidden="true">
                            {Array.from({ length: progress.total }, (_, index) => (
                              <i key={index} className={index < progress.done ? "is-filled" : ""} />
                            ))}
                          </span>
                          <span>{progressPct}%</span>
                        </div>
                      )}
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        </div>
      </div>
    </section>
  );
}

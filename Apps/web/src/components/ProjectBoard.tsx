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

type DispatchStatus = {
  enabled: boolean;
  configured: boolean;
  activeIssueNumber: number | null;
  correlationId: string | null;
  repository: string;
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
          body: JSON.stringify({ issueNumber: number }),
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
        setLive(`#${number} tidak pindah ke In Progress: ${message}`);
      } finally {
        setDispatching(null);
      }
    },
    [cards, dispatchStatus?.enabled, refreshDispatchStatus],
  );

  return (
    <section className="project-board" aria-label="Papan meeting-room-cursor">
      <div className="project-board-toolbar">
        <h1 className="project-board-title">{BOARD_REPO}</h1>
        <div className="project-board-views">
          <span className="project-board-view-current">View 1</span>
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

      {dispatchStatus?.enabled && (
        <p className="project-board-dispatch-hint text-muted">
          Geser ke <strong>In Progress</strong> memanggil agent Cursor
          {dispatchStatus.configured
            ? dispatchStatus.activeIssueNumber
              ? ` (aktif: #${dispatchStatus.activeIssueNumber})`
              : " (siap)"
            : " — webhook belum dikonfigurasi di server"}
          . Lihat{" "}
          <a href="/admin/scheduler">Scheduler</a> · runbook di{" "}
          <code>Docs/KANBAN-AGENT-DISPATCH-RUNBOOK.md</code>.
        </p>
      )}

      {boardError && (
        <Alert variant="error" className="project-board-alert">
          {boardError}
        </Alert>
      )}

      <p className="sr-only" aria-live="polite">
        {live}
      </p>

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
              className={`project-board-column ${dropTarget === column.id ? "is-drop-target" : ""}`}
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
                      className={`project-board-card ${dragging === card.number ? "is-dragging" : ""} ${dispatching === card.number ? "is-dispatching" : ""}`}
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
    </section>
  );
}

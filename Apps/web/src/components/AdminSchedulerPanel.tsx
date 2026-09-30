"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, apiFetch } from "@/lib/client-api";
import { formatDateId, formatTimeId } from "@/lib/format";
import { Alert } from "./ui/Alert";
import { Button } from "./ui/Button";
import { Field } from "./ui/Field";
import { LoadingBlock } from "./ui/LoadingBlock";
import { PageHeader } from "./ui/PageHeader";

type SchedulerStatus = {
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

export function AdminSchedulerPanel() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<SchedulerStatus>("/api/v1/admin/scheduler");
      setStatus(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat scheduler.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(partial: { enabled?: boolean; syncOnSchedule?: boolean }) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await apiFetch<SchedulerStatus>("/api/v1/admin/scheduler", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      setStatus(res);
      setMessage("Pengaturan scheduler disimpan.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Scheduler Kanban GitHub"
        description="Nyalakan/matikan job 15 menit (Project board check) via repository variable."
      />

      {error && (
        <Alert variant="error" className="admin-scheduler-alert">
          {error}
        </Alert>
      )}
      {message && (
        <Alert variant="success" className="admin-scheduler-alert">
          {message}
        </Alert>
      )}

      {loading && (
        <div className="panel">
          <LoadingBlock label="Memuat pengaturan…" />
        </div>
      )}

      {!loading && status && (
        <div className="panel admin-scheduler-panel">
          {!status.configured && (
            <Alert variant="warning">
              Server belum punya <code>GH_SCHEDULER_ADMIN_TOKEN</code>. Tampilan
              hanya baca; toggle nonaktif. Lihat{" "}
              <code>Apps/web/.env.example</code> dan PRD scheduler.
            </Alert>
          )}

          <Field
            label="Scheduler Kanban (15 menit)"
            hint="Workflow Actions di-skip jika PROJECT_SCHEDULER_ENABLED=false (cron 15 menit UTC)."
          >
            <span className="switch-row">
              <input
                type="checkbox"
                className="switch-input"
                checked={status.enabled}
                disabled={!status.configured || saving}
                onChange={(e) => patch({ enabled: e.target.checked })}
              />
              <span className="switch-track" aria-hidden="true" />
              <span className="switch-label">
                Scheduler <strong>{status.enabled ? "ON" : "OFF"}</strong>
              </span>
            </span>
          </Field>

          <Field
            label="Auto-sync board"
            hint="Saat scheduler jalan, otomatis sync issue closed → Done di Project."
          >
            <span className="switch-row">
              <input
                type="checkbox"
                className="switch-input"
                checked={status.syncOnSchedule}
                disabled={!status.configured || saving || !status.enabled}
                onChange={(e) => patch({ syncOnSchedule: e.target.checked })}
              />
              <span className="switch-track" aria-hidden="true" />
              <span className="switch-label">
                Auto-sync board{" "}
                <strong>{status.syncOnSchedule ? "ON" : "OFF"}</strong>
              </span>
            </span>
          </Field>

          <div className="admin-scheduler-meta text-muted">
            <p>
              Workflow:{" "}
              <Link href={status.actionsUrl} className="btn-link" target="_blank" rel="noreferrer">
                Project board check (Actions)
              </Link>
            </p>
            {status.lastRun ? (
              <p>
                Run terakhir (schedule):{" "}
                <Link href={status.lastRun.htmlUrl} className="btn-link" target="_blank" rel="noreferrer">
                  #{status.lastRun.id}
                </Link>{" "}
                — {status.lastRun.conclusion ?? status.lastRun.status} ·{" "}
                {formatDateId(status.lastRun.createdAt)}{" "}
                {formatTimeId(status.lastRun.createdAt)} WIB
              </p>
            ) : (
              <p>Belum ada run terjadwal tercatat (atau token tanpa akses Actions).</p>
            )}
          </div>

          <div className="admin-scheduler-actions">
            <Button variant="secondary" size="sm" onClick={load} disabled={loading || saving}>
              Refresh
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

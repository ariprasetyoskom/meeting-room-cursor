"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "@/lib/client-api";
import {
  formatAuditAction,
  formatAuditPayload,
} from "@/lib/admin-display";
import { formatDateId, formatTimeId, toDateInputValue } from "@/lib/format";
import { Alert } from "./ui/Alert";
import { PageHeader } from "./ui/PageHeader";
import { LoadingBlock } from "./ui/LoadingBlock";

type AuditRow = {
  id: string;
  actorName: string | null;
  entityType: string;
  entityId: string;
  action: string;
  payload: unknown;
  createdAt: string;
};

export function AdminAuditLogList() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (from) params.set("from", `${from}T00:00:00+07:00`);
      if (to) params.set("to", `${to}T23:59:59+07:00`);
      const res = await apiFetch<{ logs: AuditRow[]; total: number }>(
        `/api/v1/admin/audit-logs?${params}`,
      );
      setLogs(res.logs);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat audit log.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    setFrom(toDateInputValue(d));
    setTo(toDateInputValue(new Date()));
  }, []);

  useEffect(() => {
    if (from && to) load();
  }, [from, to, load]);

  const filterSummary = useMemo(() => {
    if (!from || !to) return "";
    return `Menampilkan log ${formatDateId(`${from}T12:00:00+07:00`)} – ${formatDateId(`${to}T12:00:00+07:00`)} (WIB)`;
  }, [from, to]);

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Jejak create/cancel booking dan perubahan ruang (F-11)."
      />

      <div className="toolbar">
        <label className="toolbar-item">
          Dari
          <input
            type="date"
            className="input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="toolbar-item">
          Sampai
          <input
            type="date"
            className="input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button type="button" className="btn btn-secondary" onClick={load}>
          Terapkan filter
        </button>
        {filterSummary ? (
          <p className="toolbar-summary">{filterSummary}</p>
        ) : null}
      </div>

      {error && (
        <Alert variant="error" className="admin-feedback-alert">
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <p className="text-muted">
          {logs.length} dari {total} entri (maks. 100 terbaru)
        </p>
      )}

      {loading && <LoadingBlock />}

      {!loading && logs.length === 0 && !error && (
        <div className="empty-state">
          <p>Tidak ada entri audit untuk rentang tanggal ini.</p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="data-table-wrap">
          <table className="data-table data-table-compact admin-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Aktor</th>
                <th>Aksi</th>
                <th>Entitas</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const payloadText = log.payload
                  ? JSON.stringify(log.payload)
                  : "";
                return (
                  <tr key={log.id}>
                    <td>
                      {formatDateId(log.createdAt)}
                      <br />
                      <span className="text-muted">
                        {formatTimeId(log.createdAt)}
                      </span>
                    </td>
                    <td>{log.actorName ?? "—"}</td>
                    <td>
                      <span className="badge badge-muted audit-action-badge">
                        {formatAuditAction(log.action)}
                      </span>
                      <br />
                      <code className="mono-sm text-muted">{log.action}</code>
                    </td>
                    <td>
                      {log.entityType}
                      <br />
                      <span className="text-muted mono-sm" title={log.entityId}>
                        {log.entityId.slice(0, 8)}…
                      </span>
                    </td>
                    <td
                      className="mono-sm audit-payload-cell"
                      title={payloadText || undefined}
                    >
                      {formatAuditPayload(log.payload)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

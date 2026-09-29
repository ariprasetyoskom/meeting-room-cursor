"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/client-api";
import { formatDateId, formatTimeId, toDateInputValue } from "@/lib/format";
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
      if (to) params.set("to", to);
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
          Muat ulang
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <p className="text-muted">
        Menampilkan {logs.length} dari {total} entri
      </p>

      {loading && <LoadingBlock />}

      {!loading && logs.length === 0 && !error && (
        <div className="empty-state">
          <p>Tidak ada entri audit untuk rentang tanggal ini.</p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="data-table-wrap">
          <table className="data-table">
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
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    {formatDateId(log.createdAt)}{" "}
                    {formatTimeId(log.createdAt)}
                  </td>
                  <td>{log.actorName ?? "—"}</td>
                  <td>
                    <code>{log.action}</code>
                  </td>
                  <td>
                    {log.entityType}
                    <br />
                    <span className="text-muted mono-sm">
                      {log.entityId.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="mono-sm">
                    {log.payload
                      ? JSON.stringify(log.payload).slice(0, 80)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useSessionProfile } from "@/hooks/useSessionProfile";
import { switchToAdminSeedUser } from "@/lib/dev-auth-client";
import { appPortalHref } from "@/lib/portal-client";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading, error, isAdmin, reload } = useSessionProfile();
  const [switching, setSwitching] = useState(false);
  const [switchFailed, setSwitchFailed] = useState(false);

  const applyAdminDevSession = useCallback(async () => {
    setSwitching(true);
    setSwitchFailed(false);
    try {
      const ok = await switchToAdminSeedUser();
      if (ok) {
        await reload();
      } else {
        setSwitchFailed(true);
      }
    } finally {
      setSwitching(false);
    }
  }, [reload]);

  if (loading) {
    return <p className="text-muted">Memuat…</p>;
  }

  if (error || !profile) {
    return (
      <div className="alert alert-error" role="alert">
        {error ?? "Sesi tidak valid."}{" "}
        <Link href={appPortalHref("/book")}>Kembali ke Booking</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="alert alert-error" role="alert">
        <p>
          Halaman ini hanya untuk Facilities Admin. Sesi dev saat ini:{" "}
          <strong>{profile.displayName}</strong> ({profile.role}).
        </p>
        <p className="text-muted" style={{ marginTop: "0.5rem" }}>
          Portal admin (<code>:3001</code>) memakai{" "}
          <code>ADMIN_DEV_USER_ID</code> di <code>.env.local</code> (output{" "}
          <code>npm run db:seed</code>, user <code>admin@example.com</code>).
        </p>
        {switchFailed ? (
          <p className="text-muted" style={{ marginTop: "0.5rem" }}>
            <code>ADMIN_DEV_USER_ID</code> belum diset di server — tambahkan ke{" "}
            <code>.env.local</code> lalu restart <code>npm run dev:admin</code>.
          </p>
        ) : null}
        <div className="form-actions" style={{ marginTop: "0.75rem" }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={switching}
            onClick={() => void applyAdminDevSession()}
          >
            {switching ? "Mengganti sesi…" : "Gunakan akun admin (dev)"}
          </button>{" "}
          <Link href={appPortalHref("/book")} className="btn btn-secondary btn-sm">
            Ke portal karyawan
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

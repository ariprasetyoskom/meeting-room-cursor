"use client";

import Link from "next/link";
import { useSessionProfile } from "@/hooks/useSessionProfile";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading, error, isAdmin } = useSessionProfile();

  if (loading) {
    return <p className="text-muted">Memuat…</p>;
  }

  if (error || !profile) {
    return (
      <div className="alert alert-error" role="alert">
        {error ?? "Sesi tidak valid."}{" "}
        <Link href="/book">Kembali ke Booking</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="alert alert-error" role="alert">
        Halaman ini hanya untuk Facilities Admin. Gunakan user dengan role{" "}
        <code>admin</code> (lihat output <code>npm run db:seed</code>).
      </div>
    );
  }

  return <>{children}</>;
}

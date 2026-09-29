"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/client-api";

export type SessionProfile = {
  id: string;
  email: string;
  displayName: string;
  role: "employee" | "admin";
};

export function useSessionProfile() {
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await apiFetch<SessionProfile>("/api/v1/me");
      setProfile(me);
    } catch (e) {
      setProfile(null);
      if (e instanceof ApiError && e.status === 401) {
        setError("Autentikasi diperlukan.");
      } else {
        setError(e instanceof Error ? e.message : "Gagal memuat profil.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { profile, loading, error, reload, isAdmin: profile?.role === "admin" };
}

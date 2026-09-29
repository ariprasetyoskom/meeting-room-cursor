"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, apiFetch } from "@/lib/client-api";
import {
  DEV_AUTH_READY_EVENT,
  ensureDevUserId,
} from "@/lib/dev-auth-client";

export type SessionProfile = {
  id: string;
  email: string;
  displayName: string;
  role: "employee" | "admin";
};

type ContextValue = {
  profile: SessionProfile | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  isAdmin: boolean;
};

const SessionProfileContext = createContext<ContextValue | null>(null);

export function SessionProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureDevUserId();
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

  useEffect(() => {
    const onDevAuth = () => {
      reload();
    };
    window.addEventListener(DEV_AUTH_READY_EVENT, onDevAuth);
    return () => window.removeEventListener(DEV_AUTH_READY_EVENT, onDevAuth);
  }, [reload]);

  const value = useMemo(
    () => ({
      profile,
      loading,
      error,
      reload,
      isAdmin: profile?.role === "admin",
    }),
    [profile, loading, error, reload],
  );

  return (
    <SessionProfileContext.Provider value={value}>
      {children}
    </SessionProfileContext.Provider>
  );
}

export function useSessionProfile(): ContextValue {
  const ctx = useContext(SessionProfileContext);
  if (!ctx) {
    throw new Error("useSessionProfile must be used within SessionProfileProvider");
  }
  return ctx;
}

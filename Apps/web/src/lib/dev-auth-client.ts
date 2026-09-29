"use client";

import { getDevUserId, setDevUserId } from "./client-api";

export const DEV_AUTH_READY_EVENT = "mrb-dev-auth-ready";

export function notifyDevAuthReady() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DEV_AUTH_READY_EVENT));
  }
}

/** Pastikan localStorage dev user terisi dari /api/dev/config sebelum API booking. */
export async function ensureDevUserId(): Promise<void> {
  if (typeof window === "undefined") return;
  if (getDevUserId()) return;

  const res = await fetch("/api/dev/config", { cache: "no-store" });
  if (!res.ok) return;

  const cfg = (await res.json()) as {
    authMode?: string;
    defaultUserId?: string | null;
  };

  if (cfg.authMode === "dev" && cfg.defaultUserId) {
    setDevUserId(cfg.defaultUserId);
    notifyDevAuthReady();
  }
}

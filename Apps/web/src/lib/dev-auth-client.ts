"use client";

import { getDevUserId, setDevUserId } from "./client-api";

export const DEV_AUTH_READY_EVENT = "mrb-dev-auth-ready";

export type DevConfig = {
  authMode?: string;
  defaultUserId?: string | null;
  adminSeedUserId?: string | null;
  portal?: "app" | "admin";
};

export function notifyDevAuthReady() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DEV_AUTH_READY_EVENT));
  }
}

async function fetchDevConfig(): Promise<DevConfig | null> {
  const res = await fetch("/api/dev/config", { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as DevConfig;
}

async function fetchRoleForUserId(userId: string): Promise<"employee" | "admin" | null> {
  const res = await fetch("/api/v1/me", {
    cache: "no-store",
    headers: { "x-dev-user-id": userId },
  });
  if (!res.ok) return null;
  const me = (await res.json()) as { role?: "employee" | "admin" };
  return me.role ?? null;
}

/** Pilih user dev yang cocok untuk portal (admin vs app) sebelum API booking / profil. */
export async function ensureDevUserId(): Promise<void> {
  if (typeof window === "undefined") return;

  const cfg = await fetchDevConfig();
  if (!cfg || cfg.authMode !== "dev" || !cfg.defaultUserId) return;

  const existing = getDevUserId();

  if (cfg.portal === "admin") {
    const adminId = cfg.adminSeedUserId ?? cfg.defaultUserId;
    if (!existing) {
      setDevUserId(adminId);
      notifyDevAuthReady();
      return;
    }
    const role = await fetchRoleForUserId(existing);
    if (role !== "admin" && adminId !== existing) {
      setDevUserId(adminId);
      notifyDevAuthReady();
    }
    return;
  }

  if (!existing) {
    setDevUserId(cfg.defaultUserId);
    notifyDevAuthReady();
  }
}

/** Tombol di AdminGuard: paksa sesi ke ADMIN_DEV_USER_ID dari seed. */
export async function switchToAdminSeedUser(): Promise<boolean> {
  const cfg = await fetchDevConfig();
  const adminId = cfg?.adminSeedUserId;
  if (!adminId) return false;
  setDevUserId(adminId);
  notifyDevAuthReady();
  return true;
}

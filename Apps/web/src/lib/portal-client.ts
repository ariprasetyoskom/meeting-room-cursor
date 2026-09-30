"use client";

import {
  isAdminPath,
  isPortalSplitEnabled,
  parseOrigin,
} from "@/lib/portal-shared";

export function isPortalSplitEnabledClient(): boolean {
  return isPortalSplitEnabled();
}

export function isAdminPortalClient(): boolean {
  if (typeof window === "undefined" || !isPortalSplitEnabledClient()) return false;
  const admin = parseOrigin(process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL);
  return admin !== null && window.location.origin === admin;
}

export function appPortalHref(path: string): string {
  if (isPortalSplitEnabledClient() && isAdminPortalClient()) {
    const app = parseOrigin(process.env.NEXT_PUBLIC_APP_URL);
    if (app) return `${app}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return path;
}

export function adminPortalHref(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!isAdminPath(normalized)) {
    return normalized;
  }
  if (isPortalSplitEnabledClient() && !isAdminPortalClient()) {
    const admin = parseOrigin(process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL);
    if (admin) return `${admin}${normalized}`;
  }
  return normalized;
}

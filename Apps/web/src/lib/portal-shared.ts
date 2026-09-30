export function parseOrigin(url: string | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    return new URL(url.trim()).origin;
  } catch {
    return null;
  }
}

export function isPortalSplitEnabledFromEnv(
  appUrl: string | undefined,
  adminUrl: string | undefined,
): boolean {
  const app = parseOrigin(appUrl);
  const admin = parseOrigin(adminUrl);
  return Boolean(app && admin && app !== admin);
}

export function isPortalSplitEnabled(): boolean {
  return isPortalSplitEnabledFromEnv(
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL,
  );
}

function hostForPortalEnv(envKey: "NEXT_PUBLIC_APP_URL" | "NEXT_PUBLIC_ADMIN_PORTAL_URL"): string | null {
  const origin = parseOrigin(process.env[envKey]);
  if (!origin) return null;
  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    return null;
  }
}

export function isAdminPortalHost(host: string | null | undefined): boolean {
  if (!host || !isPortalSplitEnabled()) return false;
  const adminHost = hostForPortalEnv("NEXT_PUBLIC_ADMIN_PORTAL_URL");
  return adminHost !== null && host.toLowerCase() === adminHost;
}

export function isAppPortalHost(host: string | null | undefined): boolean {
  if (!host || !isPortalSplitEnabled()) return false;
  const appHost = hostForPortalEnv("NEXT_PUBLIC_APP_URL");
  return appHost !== null && host.toLowerCase() === appHost;
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

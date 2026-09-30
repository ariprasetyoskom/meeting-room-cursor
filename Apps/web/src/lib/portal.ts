import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  isAdminPath,
  isAdminPortalHost,
  isAppPortalHost,
  isPortalSplitEnabled,
  parseOrigin,
} from "@/lib/portal-shared";

export {
  isAdminPath,
  isAdminPortalHost,
  isAppPortalHost,
  isPortalSplitEnabled,
  parseOrigin,
} from "@/lib/portal-shared";

function isPassthroughPath(pathname: string): boolean {
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico" || pathname.startsWith("/icon")) return true;
  return false;
}

/** Dev: employee app (3000) vs admin portal (3001) — different origins, separate localStorage sessions. */
export function resolvePortalRedirect(request: NextRequest): NextResponse | null {
  if (!isPortalSplitEnabled()) return null;

  const host = request.headers.get("host");
  const { pathname, search } = request.nextUrl;

  if (isPassthroughPath(pathname)) return null;

  const appOrigin = parseOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const adminOrigin = parseOrigin(process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL);
  if (!appOrigin || !adminOrigin) return null;

  if (isAdminPortalHost(host)) {
    if (isAdminPath(pathname)) return null;
    if (pathname === "/") {
      return NextResponse.redirect(new URL(`/admin/rooms${search}`, adminOrigin));
    }
    return NextResponse.redirect(new URL(`${pathname}${search}`, appOrigin));
  }

  if (isAppPortalHost(host) && isAdminPath(pathname)) {
    return NextResponse.redirect(new URL(`${pathname}${search}`, adminOrigin));
  }

  return null;
}

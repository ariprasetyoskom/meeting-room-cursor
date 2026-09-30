"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { useSessionProfile } from "@/hooks/useSessionProfile";

type PublicConfig = {
  authMode: string;
  oidcConfigured?: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function UserMenuSkeleton() {
  return (
    <div className="user-menu user-menu--loading" aria-busy="true" aria-label="Memuat profil">
      <span className="user-menu-avatar user-menu-avatar--skeleton" aria-hidden="true" />
      <span className="user-menu-name user-menu-name--skeleton" aria-hidden="true" />
    </div>
  );
}

export function UserMenu() {
  const { data: session, status } = useSession();
  const { profile, loading: profileLoading } = useSessionProfile();
  const [authMode, setAuthMode] = useState<string>("dev");

  useEffect(() => {
    fetch("/api/dev/config")
      .then((r) => r.json())
      .then((cfg: PublicConfig) => setAuthMode(cfg.authMode ?? "dev"))
      .catch(() => undefined);
  }, []);

  const devDisplay = useMemo(() => {
    if (!profile) return null;
    return {
      name: profile.displayName,
      email: profile.email,
      isAdmin: profile.role === "admin",
    };
  }, [profile]);

  if (authMode === "dev") {
    if (profileLoading) return <UserMenuSkeleton />;
    if (!profile) {
      return (
        <Link href="/login" className="btn btn-secondary btn-sm">
          Dev login
        </Link>
      );
    }
    return (
      <div className="user-menu" title={devDisplay?.email}>
        <span className="user-menu-avatar" aria-hidden="true">
          {initials(devDisplay!.name)}
        </span>
        <span className="user-menu-name">{devDisplay!.name}</span>
        {devDisplay!.isAdmin && <span className="badge badge-muted">Admin</span>}
      </div>
    );
  }

  if (status === "loading") return <UserMenuSkeleton />;

  if (!session?.user) {
    return (
      <Link href="/login" className="btn btn-secondary btn-sm">
        Login SSO
      </Link>
    );
  }

  const name = session.user.name ?? session.user.email ?? "User";

  return (
    <div className="user-menu">
      <span className="user-menu-avatar" aria-hidden="true">
        {initials(name)}
      </span>
      <span className="user-menu-name" title={session.user.email ?? ""}>
        {name}
      </span>
      <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
        Logout
      </Button>
    </div>
  );
}

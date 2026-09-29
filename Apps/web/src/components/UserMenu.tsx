"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type PublicConfig = {
  authMode: string;
  oidcConfigured?: boolean;
};

export function UserMenu() {
  const { data: session, status } = useSession();
  const [authMode, setAuthMode] = useState<string>("dev");

  useEffect(() => {
    fetch("/api/dev/config")
      .then((r) => r.json())
      .then((cfg: PublicConfig) => setAuthMode(cfg.authMode ?? "dev"))
      .catch(() => undefined);
  }, []);

  if (authMode !== "oidc") return null;

  if (status === "loading") {
    return <span className="text-muted user-menu">…</span>;
  }

  if (!session?.user) {
    return (
      <Link href="/login" className="btn btn-secondary btn-sm">
        Login SSO
      </Link>
    );
  }

  return (
    <div className="user-menu">
      <span className="user-menu-name" title={session.user.email ?? ""}>
        {session.user.name ?? session.user.email}
      </span>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Logout
      </button>
    </div>
  );
}

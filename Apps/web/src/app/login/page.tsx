"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

type PublicConfig = {
  authMode: string;
  oidcConfigured?: boolean;
};

export default function LoginPage() {
  const [cfg, setCfg] = useState<PublicConfig | null>(null);

  useEffect(() => {
    fetch("/api/dev/config")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => setCfg({ authMode: "dev" }));
  }, []);

  if (!cfg) {
    return (
      <main className="login-page">
        <p className="text-muted">Memuat…</p>
      </main>
    );
  }

  if (cfg.authMode !== "oidc") {
    return (
      <main className="login-page">
        <h1>Mode development</h1>
        <p className="text-muted">
          Set <code>AUTH_MODE=dev</code>. Gunakan banner Dev user ID di atas, lalu
          buka{" "}
          <Link href="/book" className="btn-link">
            Booking
          </Link>
          .
        </p>
      </main>
    );
  }

  if (!cfg.oidcConfigured) {
    return (
      <main className="login-page">
        <h1>SSO belum dikonfigurasi</h1>
        <p className="text-muted">
          Isi <code>OIDC_ISSUER</code>, <code>OIDC_CLIENT_ID</code>,{" "}
          <code>OIDC_CLIENT_SECRET</code>, dan <code>AUTH_SECRET</code> di{" "}
          <code>.env.local</code>.
        </p>
      </main>
    );
  }

  return (
    <main className="login-page">
      <h1>Login karyawan</h1>
      <p className="text-muted">
        Gunakan akun perusahaan (OIDC / Azure AD / Keycloak).
      </p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => signIn("oidc", { callbackUrl: "/book" })}
      >
        Lanjut ke SSO
      </button>
    </main>
  );
}

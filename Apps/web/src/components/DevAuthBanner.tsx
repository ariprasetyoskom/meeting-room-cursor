"use client";

import { useEffect, useState } from "react";
import { getDevUserId, setDevUserId } from "@/lib/client-api";
import { notifyDevAuthReady } from "@/lib/dev-auth-client";

export function DevAuthBanner() {
  const [authMode, setAuthMode] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    fetch("/api/dev/config")
      .then((r) => r.json())
      .then((cfg: { authMode?: string }) => setAuthMode(cfg.authMode ?? "dev"))
      .catch(() => setAuthMode("dev"));
  }, []);

  useEffect(() => {
    if (authMode !== "dev") return;
    const existing = getDevUserId();
    if (existing) {
      setUserId(existing);
      return;
    }
    fetch("/api/dev/config")
      .then((r) => r.json())
      .then((cfg: { defaultUserId?: string | null }) => {
        if (cfg.defaultUserId) {
          setDevUserId(cfg.defaultUserId);
          setUserId(cfg.defaultUserId);
          notifyDevAuthReady();
        }
      })
      .catch(() => undefined);
  }, [authMode]);

  if (authMode !== "dev") return null;
  if (hidden && userId) return null;

  return (
    <div className="dev-banner" role="status">
      {userId ? (
        <p>
          Dev session: <code>{userId.slice(0, 8)}…</code>{" "}
          <button
            type="button"
            className="btn-link"
            onClick={() => setHidden(true)}
          >
            Sembunyikan
          </button>
        </p>
      ) : (
        <form
          className="dev-banner-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            setDevUserId(draft.trim());
            setUserId(draft.trim());
            notifyDevAuthReady();
          }}
        >
          <label htmlFor="dev-user-id">
            Dev user ID (dari <code>npm run db:seed</code>):
          </label>
          <input
            id="dev-user-id"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="uuid…"
            className="input input-sm"
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            Simpan
          </button>
        </form>
      )}
    </div>
  );
}

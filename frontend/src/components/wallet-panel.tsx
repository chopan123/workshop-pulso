"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import type { AuthMeResponse, WalletResponse } from "@workshop-pulso/shared";

const panelStyle = {
  marginTop: "2rem",
  padding: "1rem 1.25rem",
  border: "1px solid #ddd",
  borderRadius: 8,
} as const;

/**
 * The wallet card. Privy is used here for one thing only: login. Everything
 * else — the Stellar address, and confirming the session — comes from our own
 * `/api/*`, with the Privy access token sent as a Bearer token. The browser
 * never talks to Privy for wallet operations.
 */
export function WalletPanel() {
  const { ready, authenticated, user, login, logout, getAccessToken } =
    usePrivy();

  const [address, setAddress] = useState<string | null>(null);
  const [verified, setVerified] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authenticated fetch against our API, carrying the Privy access token.
  const apiGet = useCallback(
    async <T,>(path: string): Promise<T> => {
      const token = await getAccessToken();
      const res = await fetch(path, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    },
    [getAccessToken],
  );

  // Once logged in, load the verified session and the server-provisioned wallet.
  useEffect(() => {
    if (!authenticated) {
      setAddress(null);
      setVerified(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      apiGet<AuthMeResponse>("/api/auth/me"),
      apiGet<WalletResponse>("/api/wallet"),
    ])
      .then(([me, wallet]) => {
        if (cancelled) return;
        setVerified(me.user.userId);
        setAddress(wallet.wallet.address);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "request failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authenticated, apiGet]);

  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    return (
      <section style={panelStyle}>
        <strong>Wallet:</strong> set <code>NEXT_PUBLIC_PRIVY_APP_ID</code> in your
        environment to enable login.
      </section>
    );
  }

  if (!ready) {
    return (
      <section style={panelStyle}>
        <span>Loading…</span>
      </section>
    );
  }

  if (!authenticated) {
    return (
      <section style={panelStyle}>
        <strong>Not signed in.</strong>
        <p>Sign in with your email to get a Stellar wallet.</p>
        <button onClick={login}>Log in</button>
      </section>
    );
  }

  return (
    <section style={panelStyle}>
      <strong>Signed in</strong>
      <p style={{ margin: "0.5rem 0" }}>
        {user?.email?.address ?? "(email on file)"}
      </p>

      <div style={{ margin: "0.5rem 0" }}>
        <span style={{ color: "#666" }}>Stellar address: </span>
        {address ? (
          <code style={{ wordBreak: "break-all" }}>{address}</code>
        ) : (
          <span>{loading ? "loading…" : "—"}</span>
        )}
      </div>

      {verified && (
        <p style={{ margin: "0.5rem 0", color: "#070" }}>
          server verified ✓ <code>{verified}</code>
        </p>
      )}

      {error && <p style={{ color: "#c00" }}>error — {error}</p>}

      <button onClick={logout}>Log out</button>
    </section>
  );
}

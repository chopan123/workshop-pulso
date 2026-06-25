"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import type {
  AuthMeResponse,
  BalanceResponse,
  FundResponse,
  PaymentPrepareResponse,
  PaymentSubmitResponse,
  WalletResponse,
} from "@workshop-pulso/shared";

const panelStyle = {
  marginTop: "1.5rem",
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
  const { signRawHash } = useSignRawHash();

  const [address, setAddress] = useState<string | null>(null);
  const [verified, setVerified] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Send-form state.
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState<null | "fund" | "send">(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  // Authenticated POST against our API, carrying the Privy access token.
  const apiPost = useCallback(
    async <T,>(path: string, body?: unknown): Promise<T> => {
      const token = await getAccessToken();
      const res = await fetch(path, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = (await res.json()) as T & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      return data;
    },
    [getAccessToken],
  );

  // Pull just the native XLM balance from our balance endpoint.
  const refreshBalance = useCallback(async () => {
    const { balances } = await apiGet<BalanceResponse>("/api/wallet/balance");
    const xlm = balances.find((b) => b.asset === "XLM");
    setBalance(xlm ? xlm.amount : "0");
  }, [apiGet]);

  // Once logged in, load the verified session and the server-provisioned wallet.
  useEffect(() => {
    if (!authenticated) {
      setAddress(null);
      setVerified(null);
      setBalance(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      apiGet<AuthMeResponse>("/api/auth/me"),
      apiGet<WalletResponse>("/api/wallet"),
      refreshBalance(),
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
  }, [authenticated, apiGet, refreshBalance]);

  // Fund the wallet on testnet via Friendbot, then refresh the balance.
  const onFund = useCallback(async () => {
    setBusy("fund");
    setNotice(null);
    setError(null);
    try {
      await apiPost<FundResponse>("/api/wallet/fund");
      await refreshBalance();
      setNotice("Funded on testnet ✓");
    } catch (err) {
      setError(err instanceof Error ? err.message : "funding failed");
    } finally {
      setBusy(null);
    }
  }, [apiPost, refreshBalance]);

  // Send a native XLM payment. Non-custodial: the server builds the transaction,
  // the user's own wallet signs the hash here in the browser, the server submits.
  const onSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!address) return;
      setBusy("send");
      setNotice(null);
      setError(null);
      try {
        // 1. Server builds the unsigned transaction.
        const prepared = await apiPost<PaymentPrepareResponse>(
          "/api/payments/prepare",
          { destination, amount },
        );
        // 2. The user signs the tx hash with their own wallet (server can't).
        const { signature } = await signRawHash({
          address,
          chainType: "stellar",
          hash: prepared.hash as `0x${string}`,
        });
        // 3. Server attaches the signature and broadcasts.
        const { hash } = await apiPost<PaymentSubmitResponse>(
          "/api/payments/submit",
          { xdr: prepared.xdr, signature },
        );
        setDestination("");
        setAmount("");
        await refreshBalance();
        setNotice(`Sent ✓ tx ${hash.slice(0, 12)}…`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "payment failed");
      } finally {
        setBusy(null);
      }
    },
    [apiPost, signRawHash, refreshBalance, address, destination, amount],
  );

  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    return (
      <section className="df-card" style={panelStyle}>
        <strong>Wallet:</strong> set <code>NEXT_PUBLIC_PRIVY_APP_ID</code> in your
        environment to enable login.
      </section>
    );
  }

  if (!ready) {
    return (
      <section className="df-card" style={panelStyle}>
        <span className="df-label">Loading…</span>
      </section>
    );
  }

  if (!authenticated) {
    return (
      <section className="df-card" style={panelStyle}>
        <span className="df-badge df-badge-off">● Not signed in</span>
        <p style={{ margin: "0.75rem 0" }}>
          Sign in with your email to get a Stellar wallet.
        </p>
        <button className="df-btn df-btn-primary" onClick={login}>
          Log in
        </button>
      </section>
    );
  }

  // A plain-language hint for what the user should do next, derived from state.
  const nextAction =
    balance === null
      ? "Loading your wallet…"
      : Number(balance) === 0
        ? "Your wallet is empty — fund it on testnet to get started."
        : "You're funded — send a payment, or deposit into a DeFindex vault below.";

  return (
    <section className="df-card" style={panelStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <span className="df-badge df-badge-on">● Signed in</span>
        <button className="df-btn df-btn-secondary" onClick={logout}>
          Log out
        </button>
      </div>

      <p style={{ margin: "0.6rem 0 1rem", color: "var(--df-muted)" }}>
        {user?.email?.address ?? "(email on file)"}
      </p>

      <div style={{ margin: "0.6rem 0" }}>
        <div className="df-label">Stellar address</div>
        {address ? (
          <code style={{ wordBreak: "break-all" }}>{address}</code>
        ) : (
          <span>{loading ? "loading…" : "—"}</span>
        )}
      </div>

      <div style={{ margin: "0.6rem 0" }}>
        <div className="df-label">Balance</div>
        {balance !== null ? (
          <code style={{ fontSize: "1.1rem" }}>{balance} XLM</code>
        ) : (
          <span>—</span>
        )}
      </div>

      <p
        style={{
          margin: "0.75rem 0",
          padding: "0.6rem 0.8rem",
          borderRadius: 10,
          background: "rgba(211, 255, 180, 0.4)",
          fontSize: "0.9rem",
        }}
      >
        Next: {nextAction}
      </p>

      <div style={{ margin: "0.75rem 0" }}>
        <button
          className="df-btn df-btn-primary"
          onClick={onFund}
          disabled={busy !== null}
        >
          {busy === "fund" ? "Funding…" : "Fund on testnet"}
        </button>
      </div>

      <form onSubmit={onSend} style={{ margin: "1rem 0 0.25rem" }}>
        <div style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Send XLM</div>
        <input
          className="df-input"
          type="text"
          placeholder="Destination address (G…)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          style={{ marginBottom: "0.5rem" }}
          required
        />
        <input
          className="df-input"
          type="text"
          inputMode="decimal"
          placeholder="Amount (XLM)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ marginBottom: "0.5rem" }}
          required
        />
        <button
          className="df-btn df-btn-primary"
          type="submit"
          disabled={busy !== null}
        >
          {busy === "send" ? "Sending…" : "Send"}
        </button>
      </form>

      {verified && (
        <p style={{ margin: "0.75rem 0 0", color: "var(--df-success)" }}>
          server verified ✓ <code>{verified}</code>
        </p>
      )}

      {notice && (
        <p style={{ color: "var(--df-success)", margin: "0.5rem 0 0" }}>
          {notice}
        </p>
      )}
      {error && (
        <p style={{ color: "var(--df-error)", margin: "0.5rem 0 0" }}>
          error — {error}
        </p>
      )}
    </section>
  );
}

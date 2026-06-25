"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import type {
  VaultPositionResponse,
  VaultPrepareResponse,
  VaultSubmitResponse,
  WalletResponse,
} from "@workshop-pulso/shared";

const panelStyle = {
  marginTop: "1.5rem",
} as const;

/**
 * The DeFindex vault card (Stage 3). Deposit idle XLM into a single fixed vault,
 * see your position (shares + value + APY), and withdraw. Like the wallet card,
 * the browser only authenticates and signs; deposit/withdraw transactions are
 * built and submitted server-side via our `/api/vaults/*` (DeFindex + RPC).
 */
export function VaultPanel() {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const { signRawHash } = useSignRawHash();

  const [address, setAddress] = useState<string | null>(null);
  const [position, setPosition] = useState<VaultPositionResponse["position"] | null>(
    null,
  );
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [busy, setBusy] = useState<null | "deposit" | "withdraw">(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const refreshPosition = useCallback(async () => {
    const { position } = await apiGet<VaultPositionResponse>(
      "/api/vaults/position",
    );
    setPosition(position);
  }, [apiGet]);

  // Once logged in, load the wallet address (needed to sign) and the position.
  useEffect(() => {
    if (!authenticated) {
      setAddress(null);
      setPosition(null);
      return;
    }
    let cancelled = false;
    setError(null);
    Promise.all([apiGet<WalletResponse>("/api/wallet"), refreshPosition()])
      .then(([wallet]) => {
        if (!cancelled) setAddress(wallet.wallet.address);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "request failed");
      });
    return () => {
      cancelled = true;
    };
  }, [authenticated, apiGet, refreshPosition]);

  // Run a two-step vault action: prepare (server builds) → sign (browser) →
  // submit (server broadcasts via RPC), then refresh the position.
  const runAction = useCallback(
    async (action: "deposit" | "withdraw", amount: string) => {
      if (!address) return;
      setBusy(action);
      setNotice(null);
      setError(null);
      try {
        const prepared = await apiPost<VaultPrepareResponse>(
          `/api/vaults/${action}/prepare`,
          { amount },
        );
        const { signature } = await signRawHash({
          address,
          chainType: "stellar",
          hash: prepared.hash as `0x${string}`,
        });
        const { hash } = await apiPost<VaultSubmitResponse>(
          `/api/vaults/${action}/submit`,
          { xdr: prepared.xdr, signature },
        );
        if (action === "deposit") setDepositAmount("");
        else setWithdrawAmount("");
        await refreshPosition();
        setNotice(
          `${action === "deposit" ? "Deposited" : "Withdrew"} ✓ tx ${hash.slice(0, 12)}…`,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : `${action} failed`);
      } finally {
        setBusy(null);
      }
    },
    [address, apiPost, signRawHash, refreshPosition],
  );

  // Hidden until the user is signed in — the wallet card handles login.
  if (!ready || !authenticated || !process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    return null;
  }

  const hasPosition = position !== null && Number(position.dfTokens) > 0;

  return (
    <section className="df-card" style={panelStyle}>
      <div style={{ marginBottom: "0.5rem", fontWeight: 600 }}>
        DeFindex vault
      </div>
      <p style={{ margin: "0 0 1rem", color: "var(--df-muted)", fontSize: "0.9rem" }}>
        Put idle XLM to work in a yield vault. The server builds the transaction,
        you sign it, and it settles on Stellar.
      </p>

      <div style={{ margin: "0.6rem 0" }}>
        <div className="df-label">Vault APY (7-day)</div>
        <code style={{ fontSize: "1.1rem" }}>
          {position ? `${position.apy.toFixed(2)}%` : "—"}
        </code>
      </div>

      <div style={{ margin: "0.6rem 0" }}>
        <div className="df-label">Your position</div>
        {hasPosition ? (
          <code style={{ fontSize: "1.1rem" }}>
            {position!.underlyingXlm} XLM
            <span style={{ color: "var(--df-muted)", fontSize: "0.85rem" }}>
              {" "}
              ({position!.dfTokens} shares)
            </span>
          </code>
        ) : (
          <span style={{ color: "var(--df-muted)" }}>
            No position yet — deposit XLM to start earning.
          </span>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runAction("deposit", depositAmount);
        }}
        style={{ margin: "1rem 0 0.5rem" }}
      >
        <div style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Deposit XLM</div>
        <input
          className="df-input"
          type="text"
          inputMode="decimal"
          placeholder="Amount (XLM)"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          style={{ marginBottom: "0.5rem" }}
          required
        />
        <button
          className="df-btn df-btn-primary"
          type="submit"
          disabled={busy !== null}
        >
          {busy === "deposit" ? "Depositing…" : "Deposit"}
        </button>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runAction("withdraw", withdrawAmount);
        }}
        style={{ margin: "0.75rem 0 0.25rem" }}
      >
        <div style={{ marginBottom: "0.5rem", fontWeight: 600 }}>
          Withdraw XLM
        </div>
        <input
          className="df-input"
          type="text"
          inputMode="decimal"
          placeholder="Amount (XLM)"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          style={{ marginBottom: "0.5rem" }}
          required
        />
        <button
          className="df-btn df-btn-secondary"
          type="submit"
          disabled={busy !== null || !hasPosition}
        >
          {busy === "withdraw" ? "Withdrawing…" : "Withdraw"}
        </button>
      </form>

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

import type { StellarNetwork } from "@workshop-pulso/shared";

/**
 * DeFindex API client — the one place the `DEFINDEX_API_KEY` is used.
 *
 * The frontend never talks to DeFindex; it calls our `/api/vaults/*`, and these
 * helpers reach out to `api.defindex.io` on the server. We work with a single,
 * fixed vault (XLM only) pinned via `DEFINDEX_VAULT_ADDRESS`.
 */

const API_BASE = "https://api.defindex.io";

/** Testnet vault used for the workshop when `DEFINDEX_VAULT_ADDRESS` is unset. */
const DEFAULT_VAULT = "CCLV4H7WTLJQ7ATLHBBQV2WW3OINF3FOY5XZ7VPHZO7NH3D2ZS4GFSF6";

/** A DeFindex failure carrying a human-readable, caller-safe message. */
export class DefindexError extends Error {}

/** The pinned vault address (env override, else the workshop default). */
export function vaultAddress(): string {
  return process.env.DEFINDEX_VAULT_ADDRESS ?? DEFAULT_VAULT;
}

/** The user's vault balance: shares (dfTokens) and underlying value (stroops). */
export interface VaultBalance {
  dfTokens: number;
  underlyingBalance: number[];
}

/** Read the caller's share balance and underlying value from DeFindex. */
export async function getVaultBalance(
  network: StellarNetwork,
  from: string,
): Promise<VaultBalance> {
  const url = `${API_BASE}/vault/${vaultAddress()}/balance?from=${encodeURIComponent(
    from,
  )}&network=${network}`;
  const data = await request<Partial<VaultBalance>>("GET", url);
  return {
    dfTokens: Number(data.dfTokens ?? 0),
    underlyingBalance: Array.isArray(data.underlyingBalance)
      ? data.underlyingBalance.map(Number)
      : [],
  };
}

/** Read the vault's 7-day APY (percentage). */
export async function getVaultApy(network: StellarNetwork): Promise<number> {
  const url = `${API_BASE}/vault/${vaultAddress()}/apy?network=${network}`;
  const data = await request<{ apy?: number }>("GET", url);
  return Number(data.apy ?? 0);
}

/** Build an unsigned deposit XDR. `amounts` are stroops (XLM, 7 decimals). */
export async function buildDeposit(
  network: StellarNetwork,
  caller: string,
  amounts: number[],
): Promise<string> {
  const url = `${API_BASE}/vault/${vaultAddress()}/deposit?network=${network}`;
  const data = await request<{ xdr?: string }>("POST", url, {
    amounts,
    caller,
    invest: true,
    slippageBps: 50,
  });
  if (!data.xdr) throw new DefindexError("DeFindex did not return a deposit transaction");
  return data.xdr;
}

/** Build an unsigned withdraw XDR. `amounts` are stroops (XLM, 7 decimals). */
export async function buildWithdraw(
  network: StellarNetwork,
  caller: string,
  amounts: number[],
): Promise<string> {
  const url = `${API_BASE}/vault/${vaultAddress()}/withdraw?network=${network}`;
  const data = await request<{ xdr?: string }>("POST", url, {
    amounts,
    caller,
    slippageBps: 50,
  });
  if (!data.xdr) throw new DefindexError("DeFindex did not return a withdraw transaction");
  return data.xdr;
}

/** Authenticated DeFindex request; throws `DefindexError` on any failure. */
async function request<T>(
  method: "GET" | "POST",
  url: string,
  body?: unknown,
): Promise<T> {
  const apiKey = process.env.DEFINDEX_API_KEY;
  if (!apiKey) throw new DefindexError("DEFINDEX_API_KEY is not configured");

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        authorization: `Bearer ${apiKey}`,
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new DefindexError(
      `Could not reach DeFindex: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new DefindexError(
      `DeFindex returned ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
  }

  return (await res.json()) as T;
}

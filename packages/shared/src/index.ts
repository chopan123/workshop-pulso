/**
 * Types shared between the Next.js frontend and the Netlify Functions backend.
 *
 * Keeping these in one place means the API contract is defined once and both
 * sides stay in sync at compile time.
 */

/** Stellar network the app is pointed at. */
export type StellarNetwork = "testnet" | "mainnet";

/** Response shape for `GET /api/health`. */
export interface HealthResponse {
  status: "ok";
  /** Network the backend is configured for. */
  network: StellarNetwork;
}

/**
 * A user authenticated by Privy, as the *server* sees them.
 *
 * This is derived from a verified Privy access token — never from values the
 * browser sends — so the backend can trust it.
 */
export interface AuthUser {
  /** Privy DID, e.g. `did:privy:abc123`. The stable user identifier. */
  userId: string;
}

/**
 * Response shape for `GET /api/auth/me`.
 *
 * Proves the server verified the caller's Privy session. Returns the user the
 * token belongs to; the function responds 401 when the token is missing or
 * invalid (no body of this shape in that case).
 */
export interface AuthMeResponse {
  user: AuthUser;
}

/** A user's Stellar wallet, as provisioned and read server-side via Privy. */
export interface WalletInfo {
  /** Stellar public address (`G…`). */
  address: string;
  /** Network this wallet operates on. */
  network: StellarNetwork;
}

/**
 * Response shape for `GET /api/wallet`.
 *
 * The backend provisions the wallet on first call (idempotently) and returns it.
 * Responds 401 when the caller isn't authenticated.
 */
export interface WalletResponse {
  wallet: WalletInfo;
}

/** Static per-network Stellar configuration. */
export interface StellarNetworkConfig {
  /** Horizon REST base URL for balance reads and transaction submission. */
  horizonUrl: string;
  /** Friendbot faucet URL; `null` on networks without a faucet (mainnet). */
  friendbotUrl: string | null;
  /** Network passphrase used when signing transactions. */
  networkPassphrase: string;
}

/**
 * Static config for each Stellar network, imported by both the frontend and the
 * functions so the two sides agree on Horizon, Friendbot, and the passphrase.
 */
export const STELLAR_NETWORKS: Record<StellarNetwork, StellarNetworkConfig> = {
  testnet: {
    horizonUrl: "https://horizon-testnet.stellar.org",
    friendbotUrl: "https://friendbot.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  },
  mainnet: {
    horizonUrl: "https://horizon.stellar.org",
    friendbotUrl: null,
    networkPassphrase: "Public Global Stellar Network ; September 2017",
  },
};

/** A single asset balance on a Stellar wallet. */
export interface AssetBalance {
  /** Asset code; `"XLM"` for the native asset. */
  asset: string;
  /** Human-readable amount, e.g. `"100.0000000"`. */
  amount: string;
}

/** Response shape for `GET /api/wallet/balance`. */
export interface BalanceResponse {
  balances: AssetBalance[];
  network: StellarNetwork;
}

/** Response shape for `POST /api/wallet/fund`. */
export interface FundResponse {
  funded: boolean;
  network: StellarNetwork;
}

/**
 * Payment is a two-step, non-custodial flow: the backend *builds* the unsigned
 * transaction, the user's browser *signs* its hash with their own wallet (the
 * server can never sign), and the backend *submits* the signed transaction.
 */

/** Request body for `POST /api/payments/prepare`. */
export interface PaymentPrepareRequest {
  /** Destination Stellar address (`G…`). */
  destination: string;
  /** Amount of native XLM as a string, e.g. `"1.5"`. */
  amount: string;
}

/** Response shape for `POST /api/payments/prepare`. */
export interface PaymentPrepareResponse {
  /** The unsigned transaction, base64 XDR — handed back at submit time. */
  xdr: string;
  /** The transaction hash to sign, `0x`-prefixed hex (for `signRawHash`). */
  hash: string;
  network: StellarNetwork;
}

/** Request body for `POST /api/payments/submit`. */
export interface PaymentSubmitRequest {
  /** The unsigned transaction XDR returned by `/prepare`. */
  xdr: string;
  /** The user's signature over the tx hash, `0x`-prefixed hex. */
  signature: string;
}

/** Response shape for `POST /api/payments/submit`. */
export interface PaymentSubmitResponse {
  /** Stellar transaction hash once broadcast. */
  hash: string;
  network: StellarNetwork;
}

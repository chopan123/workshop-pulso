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

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

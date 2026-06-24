import type { Handler } from "@netlify/functions";
import type { HealthResponse, StellarNetwork } from "@workshop-pulso/shared";

/**
 * GET /api/health — wiring smoke test.
 *
 * Exercises the function runtime, the shared types package, and the /api/*
 * redirect in a single path. Returns no secrets.
 */
export const handler: Handler = async () => {
  const network = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ??
    "testnet") as StellarNetwork;

  const body: HealthResponse = { status: "ok", network };

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
};

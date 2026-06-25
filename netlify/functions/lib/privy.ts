import type { HandlerEvent, HandlerResponse } from "@netlify/functions";
import { PrivyClient } from "@privy-io/node";

/**
 * Shared helpers for the Privy-backed functions.
 *
 * The frontend authenticates with Privy in the browser and sends us the
 * resulting access token as `Authorization: Bearer <token>`. Here we verify
 * that token server-side (using PRIVY_APP_SECRET, which never reaches the
 * browser) and expose a single Privy client for wallet operations.
 */

let client: PrivyClient | null = null;

/** A lazily-created, reused Privy server client. */
export function getPrivyClient(): PrivyClient {
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("PRIVY_APP_ID / PRIVY_APP_SECRET are not configured");
  }
  if (!client) client = new PrivyClient({ appId, appSecret });
  return client;
}

/** Build a JSON HandlerResponse. */
export function json(statusCode: number, body: unknown): HandlerResponse {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

/** The authenticated user, or a ready-to-return error response. */
export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; response: HandlerResponse };

/**
 * Verify the caller's Privy access token. On success returns their user id; on
 * failure returns the HandlerResponse the function should return directly.
 */
export async function authenticate(event: HandlerEvent): Promise<AuthResult> {
  const token = bearerToken(event.headers.authorization);
  if (!token) {
    return { ok: false, response: json(401, { error: "Missing Bearer access token" }) };
  }

  let privy: PrivyClient;
  try {
    privy = getPrivyClient();
  } catch {
    return {
      ok: false,
      response: json(500, { error: "Privy server credentials are not configured" }),
    };
  }

  try {
    const claims = await privy.utils().auth().verifyAccessToken(token);
    return { ok: true, userId: claims.user_id };
  } catch {
    return {
      ok: false,
      response: json(401, { error: "Invalid or expired access token" }),
    };
  }
}

/** Pull the token out of an `Authorization: Bearer <token>` header. */
function bearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && value ? value : null;
}

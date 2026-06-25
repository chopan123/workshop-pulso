import type { Handler } from "@netlify/functions";
import type { AuthMeResponse } from "@workshop-pulso/shared";
import { authenticate, json } from "./lib/privy";

/**
 * GET /api/auth/me — server-side proof that the caller's Privy session is real.
 *
 * The frontend sends the user's Privy access token as a Bearer token. We verify
 * it server-side and echo back the user it belongs to. Returns 401 when the
 * token is missing or invalid.
 */
export const handler: Handler = async (event) => {
  const auth = await authenticate(event);
  if (!auth.ok) return auth.response;

  const body: AuthMeResponse = { user: { userId: auth.userId } };
  return json(200, body);
};

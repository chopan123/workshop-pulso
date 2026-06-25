import type { Handler } from "@netlify/functions";
import type { WalletResponse } from "@workshop-pulso/shared";
import { authenticate, getPrivyClient, json } from "./lib/privy";
import { activeNetwork, getStellarWallet } from "./lib/stellar";

/**
 * GET /api/wallet — the caller's Stellar wallet, provisioned server-side.
 *
 * All wallet work happens here, not in the browser: we verify the Privy access
 * token, then look up (or create) a Stellar wallet owned by that user via the
 * Privy server SDK. Creation is idempotent — an existing wallet is reused.
 */
export const handler: Handler = async (event) => {
  const auth = await authenticate(event);
  if (!auth.ok) return auth.response;

  const { network } = activeNetwork();
  const privy = getPrivyClient();

  try {
    const { address } = await getStellarWallet(privy, auth.userId);
    const body: WalletResponse = { wallet: { address, network } };
    return json(200, body);
  } catch {
    return json(502, { error: "Could not provision the Stellar wallet" });
  }
};

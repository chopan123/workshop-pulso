import type { Handler } from "@netlify/functions";
import type { StellarNetwork, WalletResponse } from "@workshop-pulso/shared";
import { authenticate, getPrivyClient, json } from "./lib/privy";

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

  const network = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ??
    "testnet") as StellarNetwork;
  const privy = getPrivyClient();

  try {
    const address = await getOrCreateStellarAddress(privy, auth.userId);
    const body: WalletResponse = { wallet: { address, network } };
    return json(200, body);
  } catch {
    return json(502, { error: "Could not provision the Stellar wallet" });
  }
};

/**
 * Return the address of the user's Stellar wallet, creating one if they don't
 * have it yet. Reuses the first existing Stellar wallet to stay idempotent
 * across calls.
 */
async function getOrCreateStellarAddress(
  privy: ReturnType<typeof getPrivyClient>,
  userId: string,
): Promise<string> {
  for await (const wallet of privy
    .wallets()
    .list({ user_id: userId, chain_type: "stellar" })) {
    return wallet.address;
  }

  const created = await privy
    .wallets()
    .create({ chain_type: "stellar", owner: { user_id: userId } });
  return created.address;
}

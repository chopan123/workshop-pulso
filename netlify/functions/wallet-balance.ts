import type { Handler } from "@netlify/functions";
import type { BalanceResponse } from "@workshop-pulso/shared";
import { authenticate, getPrivyClient, json } from "./lib/privy";
import { activeNetwork, getBalances, getStellarWallet } from "./lib/stellar";

/**
 * GET /api/wallet/balance — the caller's Stellar balances.
 *
 * Privy holds the wallet but has no Stellar balance API, so we resolve the
 * address via Privy and read balances from Horizon. Native XLM is the asset the
 * UI cares about this stage; others pass through unchanged.
 */
export const handler: Handler = async (event) => {
  const auth = await authenticate(event);
  if (!auth.ok) return auth.response;

  const { network, config } = activeNetwork();
  const privy = getPrivyClient();

  try {
    const { address } = await getStellarWallet(privy, auth.userId);
    const balances = await getBalances(config, address);
    const body: BalanceResponse = { balances, network };
    return json(200, body);
  } catch {
    return json(502, { error: "Could not read the Stellar balance" });
  }
};

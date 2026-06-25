import type { Handler } from "@netlify/functions";
import type {
  VaultPosition,
  VaultPositionResponse,
} from "@workshop-pulso/shared";
import { authenticate, getPrivyClient, json } from "./lib/privy";
import { activeNetwork, getStellarWallet, stroopsToXlm } from "./lib/stellar";
import { DefindexError, getVaultApy, getVaultBalance } from "./lib/defindex";

/**
 * GET /api/vaults/position — the caller's position in the fixed DeFindex vault.
 *
 * Reads share balance + underlying value and the vault APY from DeFindex (XLM
 * only). A wallet with no shares returns a zeroed position, not an error.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const auth = await authenticate(event);
  if (!auth.ok) return auth.response;

  const { network } = activeNetwork();
  const privy = getPrivyClient();

  try {
    const { address } = await getStellarWallet(privy, auth.userId);
    const [balance, apy] = await Promise.all([
      getVaultBalance(network, address),
      getVaultApy(network),
    ]);

    const underlyingStroops = balance.underlyingBalance[0] ?? 0;
    const position: VaultPosition = {
      dfTokens: String(balance.dfTokens),
      underlyingXlm: stroopsToXlm(underlyingStroops),
      apy,
    };
    const body: VaultPositionResponse = { position, network };
    return json(200, body);
  } catch (err) {
    if (err instanceof DefindexError) return json(502, { error: err.message });
    return json(502, { error: "Could not read your vault position" });
  }
};

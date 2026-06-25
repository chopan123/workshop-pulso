import type { Handler } from "@netlify/functions";
import type { FundResponse } from "@workshop-pulso/shared";
import { authenticate, getPrivyClient, json } from "./lib/privy";
import { activeNetwork, getStellarWallet } from "./lib/stellar";

/**
 * POST /api/wallet/fund — fund the caller's wallet on testnet via Friendbot.
 *
 * Friendbot is the one piece that doesn't go through Privy: it's a plain testnet
 * faucet, so we call it directly. Mainnet has no faucet, so funding is rejected
 * there.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const auth = await authenticate(event);
  if (!auth.ok) return auth.response;

  const { network, config } = activeNetwork();
  if (!config.friendbotUrl) {
    return json(400, { error: "Funding is testnet-only — no faucet on mainnet" });
  }

  const privy = getPrivyClient();

  try {
    const { address } = await getStellarWallet(privy, auth.userId);
    const res = await fetch(
      `${config.friendbotUrl}?addr=${encodeURIComponent(address)}`,
    );

    // Friendbot returns 400 when the account is already funded — that's fine.
    if (!res.ok && res.status !== 400) {
      return json(502, { error: "Friendbot could not fund the wallet" });
    }

    const body: FundResponse = { funded: true, network };
    return json(200, body);
  } catch {
    return json(502, { error: "Friendbot could not fund the wallet" });
  }
};

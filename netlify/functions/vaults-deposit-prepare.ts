import type { Handler } from "@netlify/functions";
import type {
  VaultPrepareRequest,
  VaultPrepareResponse,
} from "@workshop-pulso/shared";
import { authenticate, getPrivyClient, json } from "./lib/privy";
import {
  activeNetwork,
  getStellarWallet,
  hashOfSorobanXdr,
  PaymentError,
  xlmToStroops,
} from "./lib/stellar";
import { buildDeposit, DefindexError } from "./lib/defindex";

/**
 * POST /api/vaults/deposit/prepare — build an unsigned vault deposit.
 *
 * Step one of the non-custodial deposit: DeFindex builds the Soroban XDR from
 * the caller's wallet, we return the XDR + hash, and the browser signs the hash
 * with the user's own wallet. The server never signs. XLM only.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const auth = await authenticate(event);
  if (!auth.ok) return auth.response;

  const parsed = parseAmount(event.body);
  if (!parsed.ok) return json(400, { error: parsed.error });

  const { network, config } = activeNetwork();
  const privy = getPrivyClient();

  try {
    const { address } = await getStellarWallet(privy, auth.userId);
    const stroops = xlmToStroops(parsed.amount);
    const txXdr = await buildDeposit(network, address, [stroops]);
    const { xdr, hash } = hashOfSorobanXdr(config, txXdr);
    const body: VaultPrepareResponse = { xdr, hash, network };
    return json(200, body);
  } catch (err) {
    if (err instanceof PaymentError) return json(400, { error: err.message });
    if (err instanceof DefindexError) return json(502, { error: err.message });
    return json(502, { error: "Could not prepare the deposit" });
  }
};

type ParseResult = { ok: true; amount: string } | { ok: false; error: string };

/** Validate the request body: a positive XLM amount. */
function parseAmount(raw: string | null): ParseResult {
  let body: Partial<VaultPrepareRequest>;
  try {
    body = JSON.parse(raw ?? "{}") as Partial<VaultPrepareRequest>;
  } catch {
    return { ok: false, error: "Invalid JSON body" };
  }
  const { amount } = body;
  if (typeof amount !== "string" || !(Number(amount) > 0)) {
    return { ok: false, error: "Amount must be a positive number" };
  }
  return { ok: true, amount };
}

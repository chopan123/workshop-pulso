import type { Handler } from "@netlify/functions";
import type {
  VaultSubmitRequest,
  VaultSubmitResponse,
} from "@workshop-pulso/shared";
import { authenticate, getPrivyClient, json } from "./lib/privy";
import {
  activeNetwork,
  getStellarWallet,
  PaymentError,
  submitSorobanTx,
} from "./lib/stellar";

/**
 * POST /api/vaults/deposit/submit — sign-bind and broadcast a vault deposit.
 *
 * Step two of the non-custodial deposit: the browser signed the prepared tx hash
 * with the user's own wallet; here we bind that signature to the caller's key
 * (resolved server-side) and submit the Soroban transaction through Stellar RPC.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const auth = await authenticate(event);
  if (!auth.ok) return auth.response;

  const parsed = parseRequest(event.body);
  if (!parsed.ok) return json(400, { error: parsed.error });

  const { network, config } = activeNetwork();
  const privy = getPrivyClient();

  try {
    const { address } = await getStellarWallet(privy, auth.userId);
    const hash = await submitSorobanTx(
      config,
      address,
      parsed.xdr,
      parsed.signature,
    );
    const body: VaultSubmitResponse = { hash, network };
    return json(200, body);
  } catch (err) {
    if (err instanceof PaymentError) return json(502, { error: err.message });
    return json(502, { error: "Could not submit the deposit" });
  }
};

type ParseResult =
  | { ok: true; xdr: string; signature: string }
  | { ok: false; error: string };

/** Validate the request body: a transaction XDR and a hex signature. */
function parseRequest(raw: string | null): ParseResult {
  let body: Partial<VaultSubmitRequest>;
  try {
    body = JSON.parse(raw ?? "{}") as Partial<VaultSubmitRequest>;
  } catch {
    return { ok: false, error: "Invalid JSON body" };
  }
  const { xdr, signature } = body;
  if (typeof xdr !== "string" || !xdr) {
    return { ok: false, error: "Missing transaction XDR" };
  }
  if (typeof signature !== "string" || !/^(0x)?[0-9a-fA-F]+$/.test(signature)) {
    return { ok: false, error: "Missing or malformed signature" };
  }
  return { ok: true, xdr, signature };
}

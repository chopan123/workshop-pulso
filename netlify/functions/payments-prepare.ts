import type { Handler } from "@netlify/functions";
import type {
  PaymentPrepareRequest,
  PaymentPrepareResponse,
} from "@workshop-pulso/shared";
import { StrKey } from "@stellar/stellar-sdk";
import { authenticate, getPrivyClient, json } from "./lib/privy";
import {
  activeNetwork,
  buildNativePayment,
  getStellarWallet,
  PaymentError,
} from "./lib/stellar";

/**
 * POST /api/payments/prepare — build an unsigned native XLM payment.
 *
 * Step one of the non-custodial send: the server builds the transaction from the
 * caller's wallet and returns the XDR + hash. The browser signs the hash with
 * the user's own wallet; the server never signs. Native XLM only this stage.
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
    const { xdr, hash } = await buildNativePayment(
      config,
      address,
      parsed.destination,
      parsed.amount,
    );
    const body: PaymentPrepareResponse = { xdr, hash, network };
    return json(200, body);
  } catch (err) {
    if (err instanceof PaymentError) return json(502, { error: err.message });
    return json(502, { error: "Could not prepare the payment" });
  }
};

type ParseResult =
  | { ok: true; destination: string; amount: string }
  | { ok: false; error: string };

/** Validate the request body: a valid `G…` destination and a positive amount. */
function parseRequest(raw: string | null): ParseResult {
  let body: Partial<PaymentPrepareRequest>;
  try {
    body = JSON.parse(raw ?? "{}") as Partial<PaymentPrepareRequest>;
  } catch {
    return { ok: false, error: "Invalid JSON body" };
  }

  const { destination, amount } = body;
  if (typeof destination !== "string" || !StrKey.isValidEd25519PublicKey(destination)) {
    return { ok: false, error: "Destination must be a valid Stellar address" };
  }
  if (typeof amount !== "string" || !(Number(amount) > 0)) {
    return { ok: false, error: "Amount must be a positive number" };
  }
  return { ok: true, destination, amount };
}

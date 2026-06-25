import type { Handler } from "@netlify/functions";
import type {
  PaymentSubmitRequest,
  PaymentSubmitResponse,
} from "@workshop-pulso/shared";
import { authenticate, getPrivyClient, json } from "./lib/privy";
import {
  activeNetwork,
  getStellarWallet,
  PaymentError,
  submitSignedPayment,
} from "./lib/stellar";

/**
 * POST /api/payments/submit — attach the user's signature and broadcast.
 *
 * Step two of the non-custodial send: the browser signed the prepared tx hash
 * with the user's own wallet; here we bind that signature to the caller's key
 * (resolved server-side, so a forged signer can't be slipped in) and submit to
 * Horizon.
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
    const hash = await submitSignedPayment(
      config,
      address,
      parsed.xdr,
      parsed.signature,
    );
    const body: PaymentSubmitResponse = { hash, network };
    return json(200, body);
  } catch (err) {
    if (err instanceof PaymentError) return json(502, { error: err.message });
    return json(502, { error: "Could not submit the payment" });
  }
};

type ParseResult =
  | { ok: true; xdr: string; signature: string }
  | { ok: false; error: string };

/** Validate the request body: a transaction XDR and a hex signature. */
function parseRequest(raw: string | null): ParseResult {
  let body: Partial<PaymentSubmitRequest>;
  try {
    body = JSON.parse(raw ?? "{}") as Partial<PaymentSubmitRequest>;
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

import {
  STELLAR_NETWORKS,
  type AssetBalance,
  type StellarNetwork,
  type StellarNetworkConfig,
} from "@workshop-pulso/shared";
import {
  Asset,
  Horizon,
  Keypair,
  NotFoundError,
  Operation,
  Transaction,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import type { PrivyClient } from "@privy-io/node";

/**
 * Stellar helpers shared by the wallet/payment functions.
 *
 * The hybrid model holds here too: Privy owns the key and is the *only* thing
 * that can sign, but Privy has no Stellar balance/submit API — so reads and
 * transaction submission go through Horizon, while signing goes through Privy's
 * `raw_sign` (ed25519). The private key never leaves Privy.
 */

/** The user's Stellar wallet as Privy sees it. */
export interface StellarWallet {
  /** Privy wallet id — needed to sign via the server SDK. */
  id: string;
  /** Stellar public address (`G…`). */
  address: string;
}

/** The active network (from env) and its static config. */
export function activeNetwork(): {
  network: StellarNetwork;
  config: StellarNetworkConfig;
} {
  const network = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ??
    "testnet") as StellarNetwork;
  return { network, config: STELLAR_NETWORKS[network] };
}

/**
 * Find the user's Stellar wallet (id + address), creating one idempotently if
 * they don't have it yet — the same lookup `GET /api/wallet` uses.
 */
export async function getStellarWallet(
  privy: PrivyClient,
  userId: string,
): Promise<StellarWallet> {
  for await (const wallet of privy
    .wallets()
    .list({ user_id: userId, chain_type: "stellar" })) {
    return { id: wallet.id, address: wallet.address };
  }

  const created = await privy
    .wallets()
    .create({ chain_type: "stellar", owner: { user_id: userId } });
  return { id: created.id, address: created.address };
}

/** Read native + non-native balances for an address from Horizon. */
export async function getBalances(
  config: StellarNetworkConfig,
  address: string,
): Promise<AssetBalance[]> {
  const server = new Horizon.Server(config.horizonUrl);
  try {
    const account = await server.loadAccount(address);
    return account.balances.map((b) => ({
      asset: b.asset_type === "native" ? "XLM" : (b as { asset_code: string }).asset_code,
      amount: b.balance,
    }));
  } catch (err) {
    // A brand-new wallet has no on-chain account yet (404) → zero balance.
    if (err instanceof NotFoundError) {
      return [{ asset: "XLM", amount: "0" }];
    }
    throw err;
  }
}

/**
 * Build an unsigned single-operation native payment from `address`. Returns the
 * transaction as XDR plus its `0x`-prefixed hash for the client to sign. The
 * server never signs — that's the user's browser via `signRawHash`.
 */
export async function buildNativePayment(
  config: StellarNetworkConfig,
  address: string,
  destination: string,
  amount: string,
): Promise<{ xdr: string; hash: string }> {
  const server = new Horizon.Server(config.horizonUrl);

  let source: Awaited<ReturnType<typeof server.loadAccount>>;
  try {
    source = await server.loadAccount(address);
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw new PaymentError(
        "Your wallet has no on-chain account yet — fund it on testnet first",
      );
    }
    throw new PaymentError(`Could not load your account: ${messageOf(err)}`);
  }

  // A plain `payment` fails with `op_no_destination` if the destination account
  // doesn't exist yet. For an unfunded destination, `createAccount` creates it
  // with the sent amount as its starting balance instead.
  const destinationExists = await accountExists(server, destination);
  const operation = destinationExists
    ? Operation.payment({ destination, asset: Asset.native(), amount })
    : Operation.createAccount({ destination, startingBalance: amount });

  const tx = new TransactionBuilder(source, {
    fee: (await server.fetchBaseFee()).toString(),
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  return { xdr: tx.toXDR(), hash: `0x${tx.hash().toString("hex")}` };
}

/**
 * Attach the user's signature to the prepared transaction and submit it to
 * Horizon. `signatureHex` is the ed25519 signature the browser produced over the
 * tx hash; we bind it to the user's own key (the hint comes from `address`), so
 * a tampered XDR or wrong signer is rejected by the network.
 */
export async function submitSignedPayment(
  config: StellarNetworkConfig,
  address: string,
  txXdr: string,
  signatureHex: string,
): Promise<string> {
  const server = new Horizon.Server(config.horizonUrl);

  let tx: Transaction;
  try {
    tx = new Transaction(txXdr, config.networkPassphrase);
  } catch (err) {
    throw new PaymentError(`Invalid transaction: ${messageOf(err)}`);
  }

  const signature = Buffer.from(signatureHex.replace(/^0x/, ""), "hex");
  const hint = Keypair.fromPublicKey(address).signatureHint();
  tx.signatures.push(new xdr.DecoratedSignature({ hint, signature }));

  try {
    const result = await server.submitTransaction(tx);
    return result.hash;
  } catch (err) {
    throw new PaymentError(describeSubmitError(err));
  }
}

/** Whether a Stellar account already exists on the network. */
async function accountExists(
  server: Horizon.Server,
  address: string,
): Promise<boolean> {
  try {
    await server.loadAccount(address);
    return true;
  } catch (err) {
    if (err instanceof NotFoundError) return false;
    throw err;
  }
}

/** A payment failure carrying a human-readable, caller-safe message. */
export class PaymentError extends Error {}

/**
 * Turn a Horizon submit failure into a readable message. Horizon returns the
 * real cause in `extras.result_codes` (e.g. `tx_insufficient_balance`,
 * `op_no_destination`); without it the error is an opaque "Bad Request".
 */
function describeSubmitError(err: unknown): string {
  const extras = (
    err as { response?: { data?: { extras?: ResultCodeExtras } } }
  )?.response?.data?.extras;
  const codes = extras?.result_codes;
  if (codes) {
    const parts = [
      codes.transaction && `transaction: ${codes.transaction}`,
      codes.operations?.length && `operations: ${codes.operations.join(", ")}`,
    ].filter(Boolean);
    if (parts.length) return `Stellar rejected the transaction (${parts.join("; ")})`;
  }
  return `Stellar rejected the transaction: ${messageOf(err)}`;
}

interface ResultCodeExtras {
  result_codes?: { transaction?: string; operations?: string[] };
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

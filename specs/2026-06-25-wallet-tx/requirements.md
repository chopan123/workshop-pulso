# Requirements — Stage 1: Balance, Fund & Send (P1.5–P1.7)

Continues Stage 1 on branch `step-1`. Builds directly on the wallet provisioned
in P1.4 (`GET /api/wallet`). Same hybrid architecture: Privy authenticates in the
browser; **all** Stellar work happens server-side through our `/api/*`.

## Scope

| Phase | Endpoint | UI | What it does |
| ----- | -------- | -- | ------------ |
| **P1.5** | `GET /api/wallet/balance` | Balance line in the wallet panel | Reads the user's Stellar balance server-side and returns native XLM. |
| **P1.6** | `POST /api/wallet/fund` | "Fund on testnet" button | Calls Friendbot to fund the user's address on testnet, then signals success. |
| **P1.7** | `POST /api/payments/prepare` + `POST /api/payments/submit` | Simple send form (destination + amount) | Server builds the tx; the user's browser signs the hash; server broadcasts. Non-custodial native XLM payment. |

### In scope

- **Native XLM only.** Balance shows the native asset; the send form sends native
  XLM to a single `G…` destination with a string amount. No memo, no other assets,
  no trustlines.
- Friendbot funding on **testnet only** — the button is disabled / hidden on mainnet.
- Server-side verification of the Privy access token on every endpoint (reuse
  `authenticate()` from `lib/privy.ts`).

### Out of scope

- Multi-asset / USDC / trustlines (deferred; Stage 2 introduces vault assets).
- Memos, fee-bump, multi-op transactions, path payments.
- Transaction history / activity feed.
- Mainnet funding (no Friendbot on mainnet).

### Data shapes (added to `packages/shared`)

```ts
/** A single asset balance on a Stellar wallet. */
export interface AssetBalance {
  /** Asset code; "XLM" for the native asset. */
  asset: string;
  /** Human-readable amount, e.g. "100.0000000". */
  amount: string;
}

/** Response for GET /api/wallet/balance. */
export interface BalanceResponse {
  balances: AssetBalance[];
  network: StellarNetwork;
}

/** Response for POST /api/wallet/fund. */
export interface FundResponse {
  funded: boolean;
  network: StellarNetwork;
}

/** Request for POST /api/payments/prepare. */
export interface PaymentPrepareRequest {
  /** Destination Stellar address (G…). */
  destination: string;
  /** Amount of native XLM as a string, e.g. "1.5". */
  amount: string;
}

/** Response for POST /api/payments/prepare. */
export interface PaymentPrepareResponse {
  /** Unsigned transaction, base64 XDR. */
  xdr: string;
  /** Transaction hash to sign, 0x-prefixed hex. */
  hash: string;
  network: StellarNetwork;
}

/** Request for POST /api/payments/submit. */
export interface PaymentSubmitRequest {
  xdr: string;
  /** User's signature over the tx hash, 0x-prefixed hex. */
  signature: string;
}

/** Response for POST /api/payments/submit. */
export interface PaymentSubmitResponse {
  /** Stellar transaction hash once broadcast. */
  hash: string;
  network: StellarNetwork;
}
```

## Decisions

- **Non-custodial: the user's browser signs; the server only builds & submits.**
  Reads and transaction submission go through Horizon; balance reads stay
  server-side. For *signing*, the server is deliberately kept out of the loop —
  the user's own wallet produces the signature in the browser, so the backend can
  never sign on the user's behalf (which would be effectively custodial).
  - **Balance (P1.5):** read from Horizon (`loadAccount`), mapped to
    `AssetBalance[]`; a not-yet-created account returns `0 XLM`.
  - **Send (P1.7) — two-step:**
    1. `POST /api/payments/prepare` → backend builds the native-payment
       transaction with `@stellar/stellar-sdk` from the caller's wallet and
       returns the unsigned `xdr` + the `0x`-prefixed `hash`. If the destination
       account doesn't exist yet, the backend uses a `createAccount` operation
       (amount = starting balance) instead of `payment`, which would otherwise
       fail with `op_no_destination`. (A new account needs ≥ the base reserve,
       ~1 XLM, or Stellar returns `op_low_reserve`.)
    2. Browser signs the hash with the user's own wallet via
       `useSignRawHash({ address, chainType: 'stellar', hash })` from
       `@privy-io/react-auth/extended-chains`.
    3. `POST /api/payments/submit` (`{ xdr, signature }`) → backend re-parses the
       XDR, attaches the decorated signature bound to the caller's key (the hint
       is derived from the address it resolves server-side, so a forged signer is
       rejected by the network), and submits to Horizon.
  - **Fund (P1.6):** Friendbot is a plain testnet faucet, called directly over
    HTTP (`GET {friendbotUrl}?addr=…`).
- **Why client-side signing (decision).** An earlier attempt signed server-side
  via the Privy `user_jwts` flow (`wallets().rawSign` with
  `authorization_context`). Privy frames that as self-custodial (a live user
  access token is required), but it lets the server sign while any user session
  exists — too custodial for this app. We moved signing to the user's device.
  This also sidesteps the `/v1/wallets/authenticate` JWT exchange that was
  failing with `Invalid JWT token provided`.
  Ref: [Privy — signing on the server](https://docs.privy.io/controls/authorization-keys/using-owners/sign/signing-on-the-server)
- **Dependency (approved):** `@stellar/stellar-sdk` in the functions workspace
  (build/parse the transaction, read Horizon). Client signing uses
  `@privy-io/react-auth/extended-chains`, already part of the installed
  `@privy-io/react-auth`.
- **Shared network config map.** Add a typed, network-keyed config to
  `packages/shared` so both sides import the same values:

  ```ts
  export const STELLAR_NETWORKS: Record<StellarNetwork, StellarNetworkConfig> = {
    testnet: {
      horizonUrl: "https://horizon-testnet.stellar.org",
      friendbotUrl: "https://friendbot.stellar.org",
      networkPassphrase: "Test SDF Network ; September 2015",
    },
    mainnet: {
      horizonUrl: "https://horizon.stellar.org",
      friendbotUrl: null, // no faucet on mainnet
      networkPassphrase: "Public Global Stellar Network ; September 2017",
    },
  };
  ```

  The active network stays `NEXT_PUBLIC_STELLAR_NETWORK` (default `testnet`), as
  already used in `wallet.ts`.
- **Idempotent wallet lookup reused.** All three endpoints resolve the user's
  Stellar wallet the same way `wallet.ts` does (`privy.wallets().list({ chain_type:
  "stellar" })`), so they operate on the wallet P1.4 provisioned. Extract this into
  a shared helper in `lib/` to avoid duplication.
- **Validation server-side.** `POST /api/payments` validates the destination is a
  well-formed `G…` address and the amount is a positive decimal before submitting;
  return `400` with a clear message otherwise.
- **Explanatory payment errors.** A failed send must return *why* it failed, not a
  generic message. The function surfaces the actual cause:
  - **Horizon rejection** → the transaction/operation `result_codes` from
    `extras.result_codes` (e.g. `tx_insufficient_balance`, `op_no_destination`),
    formatted into a readable sentence.
  - **Unfunded sender** (source account not yet on-chain) → "fund it on testnet
    first".
  - **Signing failure** → "Privy could not sign the transaction: …".

  These messages are caller-safe (no secrets / stack traces) and flow through to
  the send form's error line. Unknown/unexpected errors still fall back to a
  generic `502`.

## Context

- **Tone / copy.** Teaching project — copy is plain and instructional, matching the
  existing wallet panel ("Fund on testnet", "Send XLM"). No marketing polish.
- **Patterns to follow.** Mirror `netlify/functions/wallet.ts`: `authenticate()`
  guard first, `json()` helper for responses, `502` when an upstream (Privy /
  Friendbot / Horizon) call fails, typed responses from `@workshop-pulso/shared`.
- **Frontend.** Extend `frontend/src/components/wallet-panel.tsx` rather than adding
  new pages. Add a POST helper alongside the existing `apiGet`. Keep the inline-style
  approach already used in the panel.
- **netlify.toml.** Add flat-name redirects for the new functions ahead of the
  `/api/*` catch-all, matching how `/api/auth/me` was wired in P1.3.
- **No new dependencies without approval.** Prefer the Privy SDK + `fetch`. If
  building the payment XDR requires `@stellar/stellar-sdk`, flag it for approval
  before adding (it is the one likely new dep, used only to construct/serialize the
  transaction handed to Privy for signing).

# Plan — Stage 1: Balance, Fund & Send (P1.5–P1.7)

> Hybrid architecture continues: Privy authenticates in the browser; the backend
> verifies the token and does all Stellar work via the Privy API — **except**
> Friendbot funding, which is a direct testnet faucet call. Native XLM only.

## 1. Shared types & network config

1. Add to `packages/shared`: `AssetBalance`, `BalanceResponse`, `FundResponse`,
   `PaymentRequest`, `PaymentResponse` (shapes in `requirements.md`).
2. Add `StellarNetworkConfig` + the `STELLAR_NETWORKS` map keyed by
   `StellarNetwork`, with `friendbotUrl: "https://friendbot.stellar.org"` on
   testnet and `null` on mainnet, plus `horizonUrl` and `networkPassphrase`.
3. Re-export everything from the package index so both sides import it.

## 2. Backend — shared wallet helper

1. Extract the "find the user's Stellar wallet" logic (currently inline in
   `wallet.ts`) into `lib/` (e.g. `getStellarWallet(privy, userId)` returning the
   wallet `id` + `address`). Refactor `wallet.ts` to use it.
2. Add a small `activeNetwork()` helper that reads
   `NEXT_PUBLIC_STELLAR_NETWORK` (default `testnet`) and returns the matching
   `STELLAR_NETWORKS` entry — used by all three new functions.

## 3. Balance endpoint (P1.5)

1. Add `GET /api/wallet/balance` (`netlify/functions/wallet-balance.ts`):
   `authenticate()` → resolve the wallet via Privy → read balances from Horizon
   (`loadAccount`) → map to `AssetBalance[]` (native asset coded as `"XLM"`; an
   uncreated account returns `0 XLM`).
2. Return `BalanceResponse`. `401` unauthenticated; `502` on upstream failure.
3. Add the `/api/wallet/balance` redirect ahead of `/api/*` in `netlify.toml`.

## 4. Fund endpoint (P1.6)

1. Add `POST /api/wallet/fund` (`netlify/functions/wallet-fund.ts`):
   `authenticate()` → resolve the address → if the active network has no
   `friendbotUrl` (mainnet) return `400` ("funding is testnet-only") → else
   `GET {friendbotUrl}?addr={address}` via `fetch`.
2. Return `FundResponse { funded: true }` on a 2xx Friendbot response; `502` on
   faucet failure. Treat "account already funded" responses as a clear,
   non-fatal message.
3. Add the `/api/wallet/fund` redirect to `netlify.toml`.

## 5. Payments — two-step, non-custodial (P1.7)

1. **Prepare** — `POST /api/payments/prepare`
   (`netlify/functions/payments-prepare.ts`): `authenticate()` → parse + validate
   `PaymentPrepareRequest` (valid `G…` destination, positive decimal amount) →
   resolve the wallet → build a single-op native payment with
   `@stellar/stellar-sdk` (source = user's address) → return
   `PaymentPrepareResponse { xdr, hash, network }` (`hash` is `0x`-prefixed).
2. **Client signs** — the browser signs `hash` with the user's own wallet (no
   server involvement); see §6.
3. **Submit** — `POST /api/payments/submit`
   (`netlify/functions/payments-submit.ts`): `authenticate()` → validate
   `PaymentSubmitRequest { xdr, signature }` → re-parse the XDR → attach a
   decorated signature whose hint is derived from the *server-resolved* wallet
   address (so a forged signer can't be substituted) → submit to Horizon →
   return `PaymentSubmitResponse { hash, network }`.
4. Both return `400` on validation failure, `401` unauthenticated, `502` on
   build/submit failure (with explanatory Horizon `result_codes`).
5. Add `/api/payments/prepare` and `/api/payments/submit` redirects to
   `netlify.toml`.
   Ref: [Privy — signing on the server](https://docs.privy.io/controls/authorization-keys/using-owners/sign/signing-on-the-server)

## 6. Frontend — wallet panel (P1.5–P1.7)

1. Add an authenticated `apiPost` helper beside the existing `apiGet` in
   `wallet-panel.tsx` (Bearer token, JSON body).
2. **Balance (P1.5):** after the wallet loads, call `GET /api/wallet/balance` and
   show the XLM balance; loading + error states.
3. **Fund (P1.6):** "Fund on testnet" button → `POST /api/wallet/fund`; on success
   re-fetch the balance. Hide/disable on mainnet.
4. **Send (P1.7):** a minimal form (destination + amount). On submit:
   `POST /api/payments/prepare` → sign `hash` with
   `useSignRawHash({ address, chainType: 'stellar', hash })` from
   `@privy-io/react-auth/extended-chains` → `POST /api/payments/submit` with
   `{ xdr, signature }`. On success show the tx hash and re-fetch the balance.
   Inline validation/error message on failure.
5. Keep the existing inline-style approach and plain instructional copy.

## 7. Docs

1. Update `.env.example` / README only if env or local-dev steps change
   (`NEXT_PUBLIC_STELLAR_NETWORK` should be documented if not already).
2. Tick P1.5–P1.7 in `specs/roadmap.md` once shipped.

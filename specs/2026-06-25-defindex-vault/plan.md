# Stage 3 — DeFindex vault (plan)

Implement in groups. Groups 1–2 are backend foundations; 3–4 are the endpoints;
5 is the frontend; 6 is tests/docs. Each group is independently shippable.

## 1. Shared contract & config (`packages/shared/src/index.ts`)
1.1 Add `rpcUrl` to `StellarNetworkConfig` and populate `STELLAR_NETWORKS`
    (testnet `https://soroban-testnet.stellar.org`, mainnet a provider URL via
    env or a documented placeholder).
1.2 Add vault types: `VaultPosition` (`dfTokens`, `underlyingXlm`, `apy`),
    `VaultPositionResponse`, `VaultActionPrepareRequest` (`amount: string` XLM
    decimal), `VaultActionPrepareResponse` (`{ xdr, hash, network }`),
    `VaultActionSubmitRequest` (`{ xdr, signature }`),
    `VaultActionSubmitResponse` (`{ hash, network }`). Reuse one prepare/submit
    pair of shapes for both deposit and withdraw.

## 2. Backend libs
2.1 `netlify/functions/lib/defindex.ts` — DeFindex client wrapper:
    - read `DEFINDEX_API_KEY` and `DEFINDEX_VAULT_ADDRESS` (default to the
      testnet vault) from env; `network` from `activeNetwork()`.
    - `getVaultBalance(address)` → `GET /vault/:vault/balance?from&network`.
    - `getVaultApy()` → `GET /vault/:vault/apy?network`.
    - `buildDeposit(caller, amounts)` → `POST /vault/:vault/deposit` → `{ xdr }`.
    - `buildWithdraw(caller, amounts)` → `POST /vault/:vault/withdraw` → `{ xdr }`.
    - a `DefindexError` for caller-safe messages.
2.2 `lib/stellar.ts` — Soroban helpers (RPC, separate from Horizon path):
    - `hashOfXdr(config, xdr)` → parse the DeFindex XDR to a `Transaction`,
      return `{ xdr, hash: 0x… }` for the browser to sign (mirror
      `buildNativePayment`'s return).
    - `submitSorobanTx(config, address, xdr, signatureHex)` — rebuild the tx,
      push the decorated signature bound to `address` (same hint trick as
      payments), then submit via `rpc.Server(config.rpcUrl).sendTransaction`,
      poll `getTransaction` until `SUCCESS`/`FAILED`/timeout, return the hash.
      Surface RPC error/diagnostic info via `PaymentError`-style messages.
    - XLM helpers: `xlmToStroops(decimal): number`, `stroopsToXlm(n): string`.

## 3. Position endpoint
3.1 `netlify/functions/vaults-position.ts` — `GET`. Authenticate, resolve wallet
    via `getStellarWallet`, call `getVaultBalance` + `getVaultApy`, map to
    `VaultPositionResponse` (`underlyingXlm` from `underlyingBalance[0]`).
    Return zeroed/empty position when the account has no shares.

## 4. Deposit & withdraw endpoints (prepare/submit)
4.1 `vaults-deposit-prepare.ts` — `POST`. Validate amount > 0; convert to
    stroops; `buildDeposit`; return `hashOfXdr` result.
4.2 `vaults-deposit-submit.ts` — `POST`. Validate `{ xdr, signature }`;
    `submitSorobanTx`; return `{ hash, network }`.
4.3 `vaults-withdraw-prepare.ts` — like 4.1 with `buildWithdraw`.
4.4 `vaults-withdraw-submit.ts` — identical to 4.2 (shared submit logic).
4.5 `netlify.toml` — add `/api/vaults/*` redirects to the new functions
    (follow the existing `/api/payments/*` mapping convention).

## 5. Frontend vault panel
5.1 API client helpers in the frontend's existing api module: `getVaultPosition`,
    `prepareDeposit`/`submitDeposit`, `prepareWithdraw`/`submitWithdraw`,
    reusing the existing Privy `signRawHash` used by the send flow.
5.2 `VaultPanel` component (brand-styled glass card): shows APY, current position
    (dfToken shares, XLM value), empty state when no position.
5.3 Deposit form: single XLM decimal input + Coral CTA → prepare, sign, submit,
    then refresh position + wallet balance.
5.4 Withdraw form: single XLM decimal input + CTA → same flow.
5.5 Mount the panel in the page below the wallet/send controls; gate on auth +
    funded wallet, with labels so the step is self-describing.

## 6. Tests & docs
6.1 Add/extend tests next to existing ones: amount conversion (`xlmToStroops`/
    `stroopsToXlm`), request validation for the four endpoints, and the position
    mapping. Mock DeFindex `fetch` and the RPC submit.
6.2 Update `.env.example` (if present) and `specs/tech-stack.md` env section with
    `DEFINDEX_VAULT_ADDRESS`; confirm `DEFINDEX_API_KEY` is listed.
6.3 Tick P3.1–P3.4 in `specs/roadmap.md` as they land.

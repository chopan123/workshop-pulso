# Stage 3 — DeFindex vault (validation)

## Automated
- `pnpm -r typecheck` (or `pnpm -r build`) passes — shared `Vault*` types resolve
  on both frontend and functions; `rpcUrl` is present on `StellarNetworkConfig`.
- `pnpm -r test` passes, including:
  - `xlmToStroops` / `stroopsToXlm` round-trip and reject non-positive / NaN
    input.
  - Each endpoint rejects non-POST/GET methods (405), unauthenticated calls
    (401), and malformed bodies (400: bad amount, missing xdr/signature).
  - Position mapping turns a DeFindex balance/apy response into
    `VaultPositionResponse`, and a zero-share account into the empty position.
  - Submit path calls **Stellar RPC** `sendTransaction` (mocked), not Horizon.

## Manual (testnet, `netlify dev`)
1. Sign in, ensure the wallet is funded (Stage 1 fund button).
2. Vault panel shows the vault APY and an **empty position** (0 shares).
3. Deposit e.g. `5` XLM: form → prepare → browser signs → submit succeeds; a tx
   hash is returned. Wallet XLM balance drops; position now shows dfToken shares
   and an XLM value > 0.
4. Reload — position persists (read from DeFindex, not local state).
5. Withdraw e.g. `2` XLM: prepare → sign → submit succeeds; position value drops,
   wallet balance rises.
6. Edge cases:
   - Deposit more XLM than the wallet holds → submit fails with a readable error
     (no crash, no secret leakage).
   - Withdraw more than the position → readable error.
   - Amount `0` / blank / negative → blocked client-side and rejected (400)
     server-side.
   - Unfunded / brand-new account → clear "fund first" guidance, no 500.

## Tx-path check (the explicit requirement)
- Confirm in code and at runtime that deposit/withdraw submission goes through
  `rpc.Server(config.rpcUrl).sendTransaction` + `getTransaction` polling — **not**
  `Horizon.Server.submitTransaction`. Classic payments remain on Horizon.

## Tone check
- Panel copy is plain-language and labels each step (APY, your position,
  deposit, withdraw) so the screen is self-describing, consistent with the
  Stage 2 current-state panel. No jargon-heavy or aggressive "crypto" wording.

## Definition of done
- P3.1–P3.4 implemented and checked in `specs/roadmap.md`.
- Secrets (`DEFINDEX_API_KEY`) never reach the browser; the vault address is
  server config; the frontend only calls `/api/vaults/*`.
- A user can deposit XLM into the fixed vault, see shares + value + APY, and
  withdraw — end to end on testnet — with Soroban txns submitted via RPC.

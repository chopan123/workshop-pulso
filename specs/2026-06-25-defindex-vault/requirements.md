# Stage 3 — DeFindex vault (requirements)

Roadmap phases **P3.1–P3.4**. The app gains the ability to deposit idle funds
into a single fixed DeFindex vault, see the resulting position (shares, value,
APY), and withdraw — all through our own `/api/*`, with secrets server-side.

Branch: `phase-3-defindex-vault`.

## Scope

### Included
- A single, **fixed** vault. No discovery / listing. Vault address is server
  config (testnet): `CCLV4H7WTLJQ7ATLHBBQV2WW3OINF3FOY5XZ7VPHZO7NH3D2ZS4GFSF6`.
- Server-side DeFindex client wrapper (`netlify/functions/lib/defindex.ts`) that
  holds the `DEFINDEX_API_KEY` and the pinned vault address, and calls
  `api.defindex.io`.
- **Deposit** and **withdraw**, each as a two-step non-custodial flow
  (`prepare` → browser signs → `submit`), mirroring the existing payments flow.
- **Position** read: dfToken shares, underlying value, and 7-day APY.
- A vault panel in the frontend with: APY, current position, a deposit form, a
  withdraw form, and an empty state when the user has no position yet.

### Not included
- Listing/choosing among vaults (explicitly dropped from the roadmap).
- Multi-asset deposit/withdraw UI. The vault is treated as **single-asset, XLM
  only**: the forms take one decimal XLM amount.
- Any non-XLM asset handling. This vault's underlying asset is XLM; we do not
  support other tokens.
- Vault administration (roles, rebalance, fees, rescue, upgrade).
- Mainnet rollout work (config supports it; workshop is testnet).

### API endpoints (new)

| Method & path | Purpose |
|---|---|
| `GET  /api/vaults/position` | dfToken shares + underlying value + APY for the caller |
| `POST /api/vaults/deposit/prepare` | DeFindex builds unsigned Soroban XDR; return XDR + hash |
| `POST /api/vaults/deposit/submit` | Attach user signature, submit via **Stellar RPC** |
| `POST /api/vaults/withdraw/prepare` | DeFindex builds unsigned Soroban XDR; return XDR + hash |
| `POST /api/vaults/withdraw/submit` | Attach user signature, submit via **Stellar RPC** |

### Data shape (amount UX)
- Forms accept a **human decimal** XLM amount (e.g. `1.5`).
- Backend converts XLM → **stroops** (integer, 7 decimals) before calling
  DeFindex; `amounts` is sent as a single-element `number[]` (not strings) per the
  DeFindex API.
- Position values returned to the frontend as display-ready strings/numbers.

## Decisions

1. **Fixed vault, no discovery.** Pin the address in env
   (`DEFINDEX_VAULT_ADDRESS`, defaulting to the testnet address above) and read
   it only server-side. Frontend never sees the API key or talks to DeFindex.
   *Why:* matches the revised roadmap and the secrets-server-side principle.

2. **Soroban txns submit through Stellar RPC, not Horizon.** DeFindex returns
   unsigned **Soroban** XDR; classic Horizon `submitTransaction` is not the right
   path for contract invocations. The `submit` endpoints broadcast via Stellar
   RPC `sendTransaction` and poll `getTransaction` for the result. This requires
   adding an `rpcUrl` to `StellarNetworkConfig` in `packages/shared`
   (testnet: `https://soroban-testnet.stellar.org`). Existing classic payments
   keep using Horizon — unchanged.
   *Why:* explicit user requirement; Soroban invocations need RPC.

3. **Two-step prepare/submit, browser signs.** Reuse the exact pattern from
   `payments-prepare` / `payments-submit`: server resolves the wallet via Privy,
   gets/builds the XDR, returns `{ xdr, hash }`; the browser signs the hash with
   the user's own wallet; `submit` binds that signature to the user's key
   (resolved server-side) and broadcasts. The server never signs.
   *Why:* consistency with Stage 1, keeps the flow non-custodial.

4. **Position shows shares + value + APY.** Surface dfTokens, underlying value
   (`GET /vault/:address/balance`), and 7-day APY (`GET /vault/:address/apy`).
   Empty state when `dfTokens` is 0.

5. **XLM only.** The vault's underlying asset is XLM. Amount conversion and
   display use XLM (7 decimals). One decimal input per form; no asset selector.

## Context

- **Tone / copy:** plain-language, teaching-first (see `specs/mission.md`). Label
  each control so the screen is self-describing, matching the Stage 2
  current-state panel. No aggressive "crypto" aesthetics; brand styling
  (Coral CTAs, glassmorphism cards) from Stage 2.
- **Stack:** locked (`specs/tech-stack.md`) — Next.js App Router, Netlify
  Functions (TS), `packages/shared` for the API contract, pnpm. **No new
  dependencies** beyond what's present (`@stellar/stellar-sdk` already includes
  the RPC client; DeFindex is called over `fetch`).
- **Patterns to follow:**
  - Functions: `authenticate` + `getPrivyClient` + `json` from `lib/privy`;
    `activeNetwork` + `getStellarWallet` from `lib/stellar` (see
    `payments-prepare.ts` / `payments-submit.ts`).
  - Shared types: add `Vault*` request/response interfaces to
    `packages/shared/src/index.ts`, one source of truth for both sides.
  - Stellar helpers: add Soroban build/submit helpers to `lib/stellar.ts` (RPC
    `Server`, `sendTransaction`, `getTransaction` polling) alongside the existing
    Horizon ones; add the DeFindex wrapper as a new `lib/defindex.ts`.
  - Reference the `stellar-data` and `defindex-api` skills for RPC and DeFindex
    request/response details.
- **Env vars (new):** `DEFINDEX_API_KEY` (already documented in tech-stack),
  `DEFINDEX_VAULT_ADDRESS`. Document them in `.env.example` / tech-stack if a
  template exists.

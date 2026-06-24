# Roadmap

High-level implementation order, in very small phases. Each phase is one
focused, shippable chunk. Phases map toward the workshop branches:
`main` → `step-1` → `step-2`.

## Stage 0 — Foundation (branch: `main`)

- [x] **P0.1 — Monorepo scaffold.** pnpm workspace, `pnpm-workspace.yaml`,
  `frontend/`, `netlify/functions/`, `packages/shared/`.
- [x] **P0.2 — Next.js app.** Bare Next.js (App Router) frontend that renders a
  landing page.
- [x] **P0.3 — First function.** A `GET /api/health` function + `netlify.toml` with
  the `/api/*` redirect; `netlify dev` runs both.
- [x] **P0.4 — Shared types package.** `packages/shared` wired into both sides.

## Stage 1 — Wallet (branch: `step-1`)

- [ ] **P1.1 — Privy provider.** Wrap the frontend in the Privy React provider using
  `NEXT_PUBLIC_PRIVY_APP_ID`.
- [ ] **P1.2 — Login.** Connect/login button; show authenticated vs. logged-out
  state.
- [ ] **P1.3 — Embedded Stellar wallet.** Enable the embedded Stellar wallet; read
  and display the user's address.
- [ ] **P1.4 — Privy server SDK.** Configure the Privy server SDK in functions
  (`PRIVY_APP_ID` + `PRIVY_APP_SECRET`).
- [ ] **P1.5 — Balance endpoint.** `GET /api/wallet/balance` → frontend shows
  balance.
- [ ] **P1.6 — Fund on testnet.** `POST /api/wallet/fund` (Friendbot) + UI button.
- [ ] **P1.7 — Send payment.** `POST /api/payments` + a simple send form.

## Stage 2 — DeFindex vaults (branch: `step-2`)

- [ ] **P2.1 — DeFindex client.** Configure the DeFindex API key server-side; small
  client wrapper in functions.
- [ ] **P2.2 — List vaults.** `GET /api/vaults` → frontend lists available vaults.
- [ ] **P2.3 — Deposit.** `POST /api/vaults/deposit` + deposit UI.
- [ ] **P2.4 — Position.** `GET /api/vaults/position` → show balance & APY.
- [ ] **P2.5 — Withdraw.** `POST /api/vaults/withdraw` + withdraw UI.

## Stage 3 — Deploy

- [ ] **P3.1 — Netlify site.** Import repo, confirm pnpm auto-detect, set env vars.
- [ ] **P3.2 — Branch previews.** Deploy `step-1` and `step-2` for per-stage preview
  URLs.

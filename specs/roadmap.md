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

Architecture (hybrid): the frontend uses Privy **only to authenticate** (client
email OTP). Every wallet/DeFindex action goes through our `/api/*`; the backend
verifies the Privy access token and operates the user's Stellar wallet
server-side via the `user_jwt` exchange. Secrets stay server-side.

- [x] **P1.1 — Privy provider (auth only).** Wrap the frontend in the Privy React
  provider (`NEXT_PUBLIC_PRIVY_APP_ID`), email login only — no wallet logic in the
  browser.
- [x] **P1.2 — Login.** Email OTP login button; show authenticated vs. logged-out
  state. Frontend obtains the Privy access token to send to `/api/*`.
- [x] **P1.3 — Privy server client.** Configure the Privy server SDK in functions
  (`PRIVY_APP_ID` + `PRIVY_APP_SECRET`); `GET /api/auth/me` verifies the access
  token server-side.
- [x] **P1.4 — Server Stellar wallet.** Backend provisions/reads the user's Stellar
  wallet via the server SDK (`user_jwt` exchange); `GET /api/wallet` → frontend
  displays the address.
- [x] **P1.5 — Balance endpoint.** `GET /api/wallet/balance` → frontend shows
  balance.
- [x] **P1.6 — Fund on testnet.** `POST /api/wallet/fund` (Friendbot) + UI button.
- [x] **P1.7 — Send payment.** `POST /api/payments` + a simple send form.

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

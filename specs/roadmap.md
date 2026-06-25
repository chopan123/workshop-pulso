# Roadmap

High-level implementation order, in very small phases. Each phase is one
focused, shippable chunk. Phases map toward the workshop branches:
`main` → `step-1` → `step-2` → `step-3`.

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

## Stage 2 — Branding & context (branch: `step-2`)

Apply the DeFindex visual identity to the frontend and make the page
self-explanatory: a visitor should understand what the app is and see, at a
glance, the current state of their session. Design follows the DeFindex media
kit (https://docs.defindex.io/contact-us/media-kit).

Brand reference: fonts **Familjen Grotesk** (headlines) + **Inter Tight** (body)
from Google Fonts; palette Dark Green `#014751`, Lavender `#DEC9F4`, Light Green
`#D3FFB4`, Light Cyan `#D3FBFF`, Coral `#FC5B31` (CTAs), White `#FFFFFF`; soft
diffused gradients (cyan → light green → lavender), glassmorphism surfaces;
professional-yet-accessible tone, no aggressive "crypto" aesthetics.

- [x] **P2.1 — Brand theme.** Wire the two Google Fonts and the palette into the
  frontend as design tokens (CSS variables / theme); apply base typography and
  background gradient.
- [x] **P2.2 — DeFindex logo.** Add the DeFindex logo (correct light/dark variant,
  unmodified, min 40px) to the header.
- [x] **P2.3 — Context section.** A hero/intro that explains what the app is and
  what it does (Stellar wallet + DeFindex), in plain language.
- [x] **P2.4 — Current-state panel.** Surface the live state of the front: auth
  status, wallet address, balance, and what the user can do next — each step
  labeled so the screen is self-describing.
- [x] **P2.5 — Restyle existing controls.** Apply the brand styling to the
  existing login / fund / send controls (Coral CTAs, glassmorphism cards).

## Stage 3 — DeFindex vault (branch: `step-3`)

We interact with a single, fixed vault rather than discovering/listing vaults.
Vault address (testnet):
`CCLV4H7WTLJQ7ATLHBBQV2WW3OINF3FOY5XZ7VPHZO7NH3D2ZS4GFSF6`. Configure it
server-side (e.g. `DEFINDEX_VAULT_ADDRESS`) so the API key never reaches the
browser.

- [x] **P3.1 — DeFindex client.** Configure the DeFindex API key server-side; small
  client wrapper in functions. Pin the vault address as config.
- [x] **P3.2 — Deposit.** `POST /api/vaults/deposit` + deposit UI.
- [x] **P3.3 — Position.** `GET /api/vaults/position` → show balance & APY.
- [x] **P3.4 — Withdraw.** `POST /api/vaults/withdraw` + withdraw UI.

## Stage 4 — Deploy

- [ ] **P4.1 — Netlify site.** Import repo, confirm pnpm auto-detect, set env vars.
- [ ] **P4.2 — Branch previews.** Deploy `step-1`, `step-2`, and `step-3` for
  per-stage preview URLs.

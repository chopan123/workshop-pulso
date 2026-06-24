# Requirements — Stage 1: Wallet Auth (P1.1–P1.4)

## Scope

This spec covers the **authentication + wallet-provisioning half** of Stage 1.
The user signs in with Privy (email), the backend verifies that session and
provisions/reads a Stellar wallet for the user, and the frontend displays the
address.

### Architecture — hybrid (non-negotiable boundary)

The frontend uses Privy **only to authenticate**. Privy's email OTP is a
client-SDK-only flow, so login lives in the browser. But **every wallet and
DeFindex action goes through our own `/api/*`** — the frontend never performs
wallet operations, signing, or DeFindex calls directly.

```
                     Privy email OTP (client SDK)
frontend ───login──▶ Privy  ──issues──▶ access token
   │
   └──fetch /api/* (Authorization: Bearer <access token>)──▶ Netlify Functions
                                                                  │
                                          @privy-io/node + user_jwt exchange
                                                                  ▼
                                                Privy server API (wallets)
```

The backend verifies the access token, then uses it as the **`user_jwt`** to
authenticate against the user's wallet (Privy's documented "server-side user
wallets" path, `POST /v1/wallets/authenticate`) and operate it server-side.
`PRIVY_APP_SECRET` never reaches the browser.

### In scope

| Phase | Deliverable |
| ----- | ----------- |
| P1.1 | Privy React provider wrapping the frontend, email login only, configured with `NEXT_PUBLIC_PRIVY_APP_ID`. No wallet logic in the browser. |
| P1.2 | Login: email OTP login/logout button; UI shows authenticated vs. logged-out. Frontend obtains the Privy access token and sends it to `/api/*`. |
| P1.3 | Privy server client in functions (`PRIVY_APP_ID` + `PRIVY_APP_SECRET`); `GET /api/auth/me` verifies the access token server-side and returns the user. |
| P1.4 | Wallet provisioning: backend provisions/reads the user's Stellar wallet via the server SDK (`user_jwt` exchange); `GET /api/wallet` returns the address; frontend displays it. |

### Out of scope (later spec)

- P1.5 balance endpoint, P1.6 Friendbot funding, P1.7 send payment.
  **Decided defaults:** native XLM only, basic client-side validation. Signing is
  mediated server-side via the Privy wallet RPC.
- **Server-side signing delegation.** P1.4 only *provisions and reads* the wallet.
  Whether server-side signing needs a one-time client delegation/consent step is
  an open detail to confirm before P1.6/P1.7 (send) — it does not affect this spec.
- Mainnet flows (workshop is taught on testnet).

## Decisions

- **Privy for auth, our API for everything else.** The frontend imports
  `@privy-io/react-auth` *only* for login. All wallet/DeFindex work is server-side
  behind `/api/*`. Matches the mission: the browser never does value-bearing work
  directly, and secrets stay server-side.
- **Token as `user_jwt`.** The Privy access token the client gets at login is sent
  as a Bearer token and reused server-side as the `user_jwt` to authenticate
  against the user's wallet. No separate app-auth system to build.
- **Server-managed Stellar wallet.** The user's wallet is created/operated via the
  Privy server SDK (`chain_type: 'stellar'`, owner = the user). Stellar is a Privy
  Tier 2 chain: creation + signing are supported, "basic wallet functionality"
  (curve-level signatures) — enough for an address now and balance/fund/send later.
- **Login method: email only.** A single method keeps the workshop focused. Social
  and passkey can be enabled later via dashboard config without code changes.

## Context

- **Tone:** teaching-first. Clear, minimal code and copy.
- **Stack (locked):** Next.js App Router frontend with a thin Privy provider for
  auth, Netlify Functions (TS) backend, `packages/shared` for shared types, pnpm
  workspaces. New deps: `@privy-io/react-auth` (frontend, auth only) and
  `@privy-io/node` (functions).
- **Same-origin API:** the frontend calls `/api/*`, redirected to
  `/.netlify/functions/*`. Follow the existing `GET /api/health` function as the
  pattern. Function names can't contain slashes, so nested paths like
  `/api/auth/me` need an explicit redirect to a flat function name.
- **Env vars:** `NEXT_PUBLIC_PRIVY_APP_ID` (public, frontend login);
  `PRIVY_APP_ID` + `PRIVY_APP_SECRET` (server-only).
- **Shared types:** define the auth/user/wallet response shapes in
  `packages/shared` so frontend and functions agree.

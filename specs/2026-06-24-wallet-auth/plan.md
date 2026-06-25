# Plan — Stage 1: Wallet Auth (P1.1–P1.4)

> Architecture (hybrid): Privy on the **frontend for auth only**; the **backend**
> verifies the access token and does all wallet work via `@privy-io/node` +
> `user_jwt` exchange. No wallet/DeFindex logic in the browser.

## 1. Shared types & env

1. Add auth/wallet response types to `packages/shared`: `AuthUser`,
   `WalletInfo` (Stellar address + network), and the `GET /api/auth/me` and
   `GET /api/wallet` response shapes.
2. `.env.example`: `NEXT_PUBLIC_PRIVY_APP_ID` (public) plus `PRIVY_APP_ID` +
   `PRIVY_APP_SECRET` (server-only) — already present; confirm.

## 2. Privy provider — auth only (P1.1)

1. Add `@privy-io/react-auth` to the frontend.
2. Create a client `PrivyProvider` wrapper configured with
   `NEXT_PUBLIC_PRIVY_APP_ID` and `loginMethods: ['email']`. No embedded-wallet
   config — the browser doesn't manage wallets.
3. Wrap the App Router root layout in the provider (client boundary).

## 3. Login UI (P1.2)

1. Login/logout button using Privy's email OTP login.
2. Render authenticated vs. logged-out state on the landing page.
3. A small client helper that calls `getAccessToken()` and attaches it as a
   Bearer token on `fetch('/api/*')` calls.

## 4. Privy server client + session verify (P1.3)

1. Add `@privy-io/node` to the functions workspace; small wrapper that builds
   `PrivyClient` from `PRIVY_APP_ID` + `PRIVY_APP_SECRET`.
2. Add `GET /api/auth/me`: read the Bearer access token, verify it via
   `privy.utils().auth().verifyAccessToken(token)`, return the user (shared
   `AuthUser`). 401 on missing/invalid token.
3. Add the `/api/auth/me` redirect (flat function name) ahead of the `/api/*`
   catch-all in `netlify.toml`.

## 5. Wallet provisioning (P1.4)

1. Add `GET /api/wallet`: verify the token, then provision/read the user's
   Stellar wallet via the server SDK — exchange the token as `user_jwt`
   (`POST /v1/wallets/authenticate`) and create the wallet
   (`chain_type: 'stellar'`, owner = user) idempotently, reusing an existing one.
2. Return the Stellar address (shared `WalletInfo`). 401 if unauthenticated.

## 6. Frontend wallet display (P1.4)

1. After login, call `GET /api/auth/me` (verified indicator) and `GET /api/wallet`
   (Stellar address), via the Bearer-token fetch helper.
2. Display the address with a copy affordance; handle loading/logged-out states.

## 7. Docs

1. Update README/run instructions if env or local-dev steps change.

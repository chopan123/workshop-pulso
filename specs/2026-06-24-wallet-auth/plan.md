# Plan — Stage 1: Wallet Auth (P1.1–P1.4)

## 1. Shared types & env

1. Add auth/wallet response types to `packages/shared` (e.g. `AuthUser`,
   `WalletInfo`, and the `GET /api/auth/me` response shape).
2. Add `NEXT_PUBLIC_PRIVY_APP_ID`, `PRIVY_APP_ID`, `PRIVY_APP_SECRET` to
   `.env.example` with comments noting which side each belongs to.

## 2. Privy provider (P1.1)

1. Add `@privy-io/react-auth` to the frontend.
2. Create a client `PrivyProvider` wrapper component configured with
   `NEXT_PUBLIC_PRIVY_APP_ID`, email-only login, and embedded Stellar wallet
   enabled (created on login).
3. Wrap the App Router root layout in the provider (client boundary).

## 3. Login UI (P1.2)

1. Add a login/logout button component using Privy's `useLogin` / `useLogout`.
2. Render authenticated vs. logged-out state on the landing page (show a
   signed-in panel when authenticated, a login prompt otherwise).

## 4. Embedded Stellar wallet (P1.3)

1. Read the user's embedded Stellar wallet address via the Privy React hooks.
2. Display the Stellar address in the signed-in panel (with a copy affordance,
   truncated for readability).
3. Handle the loading/provisioning state while the wallet is created.

## 5. Privy server SDK (P1.4)

1. Add `@privy-io/node` to the functions workspace.
2. Create a small server client wrapper (`PrivyClient`) initialised from
   `PRIVY_APP_ID` + `PRIVY_APP_SECRET`.
3. Add `GET /api/auth/me`: read the Privy access token from the request,
   verify it via `privy.utils().auth().verifyAccessToken({ access_token })`,
   return the authenticated user (typed by the shared `AuthUser`). Return 401
   on missing/invalid token.
4. Frontend calls `/api/auth/me` after login to confirm the server recognises
   the session, surfacing a small verified indicator.

## 6. Docs

1. Update the README/run instructions if env setup or local-dev steps change.

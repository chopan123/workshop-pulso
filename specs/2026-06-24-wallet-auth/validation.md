# Validation — Stage 1: Wallet Auth (P1.1–P1.4)

## Automated

- `pnpm install` succeeds with the new Privy deps: `@privy-io/react-auth`
  (frontend) and `@privy-io/node` (functions).
- Typecheck/build passes across frontend, functions, and shared.
- Shared types are imported by both the frontend and the auth/wallet functions
  (no duplicated local types).
- The frontend imports `@privy-io/react-auth` **only for auth** — no wallet/RPC
  or DeFindex calls in the browser.
- `GET /api/auth/me` and `GET /api/wallet` return **401** without a valid Bearer
  token (verifiable without a real login).

## Manual

1. Run `pnpm dlx netlify-cli dev`; frontend + functions serve on `:8888`.
2. Logged-out state: page shows a login prompt and button.
3. Click login → email OTP flow → complete sign-in. UI switches to authenticated.
4. `GET /api/auth/me` succeeds and shows the verified indicator (server verified
   the Privy access token).
5. `GET /api/wallet` returns a valid Stellar (`G…`) address, provisioned
   server-side, and the frontend displays it; copy affordance works.
6. Logout returns the UI to the logged-out state.

### Edge cases

- Wallet still provisioning: UI shows a loading state, not an error or blank.
- Reload while logged in: session persists; authenticated state re-renders
  without a fresh login.
- `/api/auth/me` and `/api/wallet` with a tampered/expired token return 401 and
  the UI degrades gracefully.
- Network tab shows the browser calling Privy **only** for login — all wallet
  data comes from `/api/*`.

## Tone check

- Login copy and the signed-in panel are clear and minimal, teaching-first.
- No secrets in client code or responses; only `NEXT_PUBLIC_PRIVY_APP_ID` is
  present browser-side. `PRIVY_APP_SECRET` never reaches the browser.

## Definition of done

- P1.1–P1.4 checked off in `specs/roadmap.md`.
- A user signs in with Privy email, the backend verifies the session and
  provisions a Stellar wallet, and the frontend shows the address — with all
  wallet work behind `/api/*`.
- Automated checks pass; the frontend uses Privy for auth only.

# Validation — Stage 1: Wallet Auth (P1.1–P1.4)

## Automated

- `pnpm install` succeeds with the new Privy dependencies.
- Typecheck/build passes across frontend, functions, and shared
  (`pnpm -r build` or the project's typecheck command).
- Shared types compile and are imported by both the frontend login UI and the
  `/api/auth/me` function (no duplicated local types).
- `GET /api/auth/me` returns **401** when no/invalid token is supplied
  (verifiable without a real login).

## Manual

1. Run `pnpm dlx netlify-cli dev`; frontend + functions serve on `:8888`.
2. Logged-out state: landing page shows a login prompt and a login button.
3. Click login → email flow → complete sign-in. UI switches to the
   authenticated state.
4. An embedded Stellar wallet address is displayed; copy affordance works and
   the address is a valid Stellar (`G…`) address.
5. After login, the frontend's call to `/api/auth/me` succeeds and shows the
   verified indicator (proves server-side token verification).
6. Logout returns the UI to the logged-out state.

### Edge cases

- Wallet still provisioning: UI shows a loading state, not an error or blank.
- Reload while logged in: session persists and the authenticated state
  re-renders without a fresh login.
- `/api/auth/me` with a tampered/expired token returns 401 and the UI degrades
  gracefully.

## Tone check

- Login copy and the signed-in panel are clear and minimal, teaching-first.
- No secret values appear in client code or network responses; only
  `NEXT_PUBLIC_PRIVY_APP_ID` is present browser-side.

## Definition of done

- P1.1–P1.4 checked off in `specs/roadmap.md`.
- A user can log in with email, see their embedded Stellar address, and the
  server verifies the session via `/api/auth/me`.
- Automated checks pass; no new dependencies beyond the two Privy SDKs.

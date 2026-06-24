# Requirements — Stage 1: Wallet Auth (P1.1–P1.4)

## Scope

This spec covers the **authentication and embedded-wallet half** of Stage 1.
It wires Privy into both the frontend and the functions, lets a user log in,
provisions an embedded Stellar wallet, and displays the wallet address.

### In scope

| Phase | Deliverable |
| ----- | ----------- |
| P1.1 | Privy React provider wrapping the frontend, configured with `NEXT_PUBLIC_PRIVY_APP_ID`. |
| P1.2 | Login / logout button; UI distinguishes authenticated vs. logged-out state. |
| P1.3 | Embedded Stellar wallet enabled; read and display the user's Stellar address. |
| P1.4 | Privy server SDK configured in functions (`PRIVY_APP_ID` + `PRIVY_APP_SECRET`), with a verified-auth endpoint proving server-side token verification works. |

### Out of scope (later spec)

- P1.5 balance endpoint, P1.6 Friendbot funding, P1.7 send payment.
  These are deferred to a follow-up spec. **Decided defaults for that work:**
  native XLM only, with basic client-side validation.
- Mainnet flows (workshop is taught on testnet).

## Decisions

- **Login method: email only.** A single login method keeps the workshop
  focused on the integration, not on OAuth/passkey setup. Social and passkey
  can be enabled later via Privy dashboard config without code changes.
- **Embedded wallet, Stellar.** Privy provisions the embedded wallet on login;
  no external wallet connect. Chain is Stellar testnet for the workshop.
- **Backend/frontend split preserved.** The frontend uses the Privy React SDK
  for the browser-side login/wallet UX only. Any server-side use of Privy
  (token verification, wallet lookups) goes through a function using the Privy
  server SDK. Secrets (`PRIVY_APP_SECRET`) never reach the browser.
- **Server SDK proof point (P1.4).** A function verifies the Privy access token
  and returns the authenticated user, so the server-side wiring is demonstrably
  working before later endpoints (balance/fund/send) depend on it.

## Context

- **Tone:** teaching-first. Code and copy should be clear and minimal; favour
  readability over cleverness so a participant can follow each step.
- **Stack (locked):** Next.js App Router frontend, Netlify Functions (TS)
  backend, `packages/shared` for shared types, pnpm workspaces. No new
  dependencies beyond the Privy SDKs (`@privy-io/react-auth` client,
  `@privy-io/node` server) without approval.
- **Stellar is a Privy Tier 2 chain:** embedded wallets and transaction
  signing are supported, but only "basic wallet functionality" (curve-level
  signatures) — no Tier 1 convenience helpers. This is sufficient for the
  address display in this spec and the later balance/fund/send work.
- **Same-origin API:** the frontend calls `/api/*`, redirected to
  `/.netlify/functions/*`. Follow the existing `GET /api/health` function as
  the pattern for the new auth-check function.
- **Env vars:** `NEXT_PUBLIC_PRIVY_APP_ID` (public), `PRIVY_APP_ID` +
  `PRIVY_APP_SECRET` (server-only). Document in `.env.example`.
- **Shared types:** define the auth/user/wallet response shapes in
  `packages/shared` so frontend and functions agree.

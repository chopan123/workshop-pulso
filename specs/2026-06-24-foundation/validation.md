# Foundation — Validation

How we confirm Stage 0 is done.

## Automated

- `pnpm install` completes cleanly from the repo root (workspaces resolve).
- `pnpm -r typecheck` (or `tsc --noEmit` per package) passes across `frontend`,
  functions, and `packages/shared`.
- `pnpm --filter frontend build` (Next.js production build) succeeds.
- The shared `HealthResponse` type is imported by both the function and the
  frontend without type errors (proves cross-package wiring).

## Manual walkthrough

1. Run `pnpm dlx netlify-cli dev`.
2. Open the app (default <http://localhost:8888>) — the placeholder landing page
   renders.
3. `curl http://localhost:8888/api/health` returns `{"status":"ok"}`.
4. The landing page displays the health status fetched from `/api/health`,
   confirming the same-origin `/api/*` round trip works.

## Edge cases

- `/api/health` reachable via the `/api/*` redirect, not only the raw
  `/.netlify/functions/health` path.
- Missing `.env` does not break the scaffold (no secrets needed yet); only
  `.env.example` is committed.
- A fresh clone + `pnpm install` + `netlify dev` works with no extra steps.

## Definition of done

- All four phases (P0.1–P0.4) implemented and checked off in
  `specs/roadmap.md`.
- `netlify dev` serves the frontend and `/api/health` together.
- Frontend and functions both consume `packages/shared` with no type errors.
- No integration code (Privy/Stellar/DeFindex) introduced — scope stayed on the
  scaffold.

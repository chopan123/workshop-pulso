# Foundation — Plan

Task groups for Stage 0. Each group is independently implementable and maps to a
roadmap phase. Order: Workspace → Frontend → Function → Shared → Wire-up.

## 1. Workspace (P0.1)

1. Initialize a root `package.json` (private, `packageManager: pnpm@9`).
2. Add `pnpm-workspace.yaml` listing `frontend`, `netlify/functions/*`,
   `packages/*`.
3. Add root `.gitignore` (node_modules, `.next`, `.netlify`, env files).
4. Add `.env.example` mirroring `specs/tech-stack.md` env vars.

## 2. Frontend (P0.2)

1. Scaffold a Next.js App Router + TypeScript app in `frontend/`.
2. Replace the default landing page with a minimal placeholder for the wallet.
3. Confirm `pnpm --filter frontend dev` serves the page.

## 3. Function (P0.3)

1. Add `netlify.toml` at the root: build command, `publish = frontend/.next`,
   functions directory `netlify/functions`, and the `/api/*` →
   `/.netlify/functions/:splat` redirect.
2. Create `netlify/functions/health.ts` returning `{ status: "ok" }`.
3. Verify `pnpm dlx netlify-cli dev` serves the frontend and `/api/health`.

## 4. Shared package (P0.4)

1. Create `packages/shared` with its own `package.json` and `tsconfig`.
2. Export a `HealthResponse` type (and a `NETWORK`/env helper stub if useful).
3. Add it as a workspace dependency of both `frontend` and the functions.

## 5. Wire-up & verify

1. Import `HealthResponse` from the shared package in `health.ts` and in a
   small frontend fetch to `/api/health`.
2. Render the health status on the landing page to prove the round trip.
3. Run the full `netlify dev` flow end to end (see `validation.md`).

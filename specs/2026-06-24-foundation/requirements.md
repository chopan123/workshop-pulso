# Foundation — Requirements

Spec for **Stage 0 — Foundation** of the roadmap (phases P0.1–P0.4). Establishes
the pnpm monorepo, the Next.js frontend, the first Netlify Function, and the
shared types package — everything needed to run the app locally with
`netlify dev`.

Branch: `phase-0-foundation`.

## Scope

### Included

| Phase | Deliverable                                                                                                                      |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| P0.1  | pnpm workspace (`pnpm-workspace.yaml`) with `frontend/`, `netlify/functions/`, `packages/shared/`                                |
| P0.2  | Bare Next.js (App Router, TypeScript) app rendering a landing page                                                               |
| P0.3  | `GET /api/health` Netlify Function + `netlify.toml` with the `/api/*` redirect; `netlify dev` runs frontend + functions together |
| P0.4  | `packages/shared` TypeScript package, imported by both frontend and functions                                                    |

### Not included

- No Privy, Stellar, or DeFindex integration (those are Stages 1–2).
- No auth, wallet, or vault UI — the landing page is a placeholder.
- No CI, linting, or test-runner setup beyond what Next.js scaffolds by default.
- No deployment to Netlify (that is Stage 3); local `netlify dev` is the target.

## Decisions

- **Stack matches `specs/tech-stack.md` exactly.** Next.js App Router +
  TypeScript, pnpm workspaces, Netlify Functions, same-origin `/api/*`. No new
  dependencies beyond these.
- **Shared package is types-first.** `packages/shared` exports TypeScript types
  (and any pure helpers) consumed by both sides, proving the workspace wiring
  works. Start with a `HealthResponse` type used by `/api/health`.
- **Health endpoint is the wiring smoke test.** `GET /api/health` returns
  `{ status: "ok" }` typed as the shared `HealthResponse`, exercising
  function + shared-package + redirect in one path.
- **Same-origin in dev.** The frontend calls `/api/health` as a relative path;
  `netlify dev` proxies it. No API URL env var.

## Context

- **Teaching-first.** Keep the scaffold minimal and readable for workshop
  participants — clear structure over cleverness, no code beyond what each phase
  needs.
- **Follow documented architecture.** Mirror the repository layout and decisions
  already written in `specs/tech-stack.md` and the README; consistency matters
  more than novelty.
- **Stack pointers:** pnpm 9+, Node 18+, Next.js App Router, `netlify-cli` via
  `pnpm dlx`. Functions live in `netlify/functions/`, redirect `/api/*` →
  `/.netlify/functions/:splat`.

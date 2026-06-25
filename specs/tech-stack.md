# Tech Stack

These choices are **locked** for the workshop. They are picked so the entire app
deploys to Netlify with one build and uses `pnpm`.

| Concern        | Choice                                          |
| -------------- | ----------------------------------------------- |
| Monorepo       | pnpm workspaces                                 |
| Frontend       | Next.js (App Router)                            |
| Backend        | Netlify Functions (TypeScript, serverless)      |
| Auth + Wallets | Privy                                           |
| Blockchain     | Stellar (testnet + mainnet)                     |
| Yield / Vaults | DeFindex                                         |
| Hosting        | Netlify                                         |
| Language       | TypeScript across frontend, functions, shared   |

## Repository layout

```text
.
├── pnpm-workspace.yaml
├── netlify.toml          # build + functions config
├── frontend/             # Next.js app (the deployed site)
├── netlify/functions/    # backend endpoints → /api/*
└── packages/shared/      # types shared between frontend & functions
```

## Key decisions

- **Netlify Functions, not a standalone server.** Netlify hosts static sites +
  serverless functions, not long-running processes. Each backend endpoint is a
  function, which keeps the modular backend/frontend split while deploying as a
  single site — no second host, no CORS setup, no extra cost.
- **Same-origin API.** The frontend calls the backend at the relative path
  `/api/*`, redirected to `/.netlify/functions/*`. No API URL to configure.
- **Secrets server-side only.** `PRIVY_APP_SECRET` and `DEFINDEX_API_KEY` live
  in functions / Netlify env vars. Only `NEXT_PUBLIC_PRIVY_APP_ID` reaches the
  browser.
- **pnpm everywhere.** Netlify auto-detects pnpm from `pnpm-lock.yaml`; pin with
  `PNPM_VERSION` if needed.

## Local development

```bash
pnpm install
pnpm dlx netlify-cli dev   # serves Next.js + functions, proxies /api/* on :8888
```

## Environment variables

Server-side (functions / Netlify env):

```bash
PRIVY_APP_ID=
PRIVY_APP_SECRET=
DEFINDEX_API_KEY=
DEFINDEX_VAULT_ADDRESS=   # fixed vault; defaults to the workshop testnet vault
```

Public (Next.js frontend):

```bash
NEXT_PUBLIC_PRIVY_APP_ID=
```

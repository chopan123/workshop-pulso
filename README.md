# Workshop Pulso — Stellar Wallet + DeFindex

A hands-on workshop for the **Pulso Hackathon**. You'll build a web wallet on
**Stellar** using **Privy** for authentication and embedded wallets, then add
yield-earning vaults with **DeFindex**.

🔗 **Live demo:** https://resilient-churros-c913d4.netlify.app/

The workshop is split into two steps:

1. **Step 1 — Wallet:** A web app that lets users sign in and manage a Stellar
   wallet powered by Privy.
2. **Step 2 — DeFindex:** Add DeFindex vaults so users can deposit funds and
   earn yield directly from the wallet.

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 9+ (`npm install -g pnpm`)
- A [Privy](https://dashboard.privy.io/) account and App ID
- A [DeFindex](https://defindex.io/) account / API key (Step 2)
- A [Netlify](https://www.netlify.com/) account for deployment
- Basic familiarity with React and Stellar (testnet for the workshop, mainnet for production)

## Architecture

The app is split into a **backend** and a **frontend** for modularity. The
frontend never talks to Privy or DeFindex directly — it calls our own backend
API, which holds the secrets (API keys) and orchestrates the integrations. This
keeps concerns separated and makes each piece easy to swap or test.

The backend runs as **Netlify Functions** (serverless), so the whole app — UI
and API — deploys to Netlify as a single site with no separate server to host.

```text
┌──────────┐   /api/* (HTTP)   ┌────────────────────┐      ┌──────────────────┐
│ Frontend │ ────────────────▶ │  Backend           │ ───▶ │ Privy / DeFindex │
│ (Next.js)│ ◀──────────────── │ (Netlify Functions)│ ◀─── │   Stellar RPC    │
└──────────┘                   └────────────────────┘      └──────────────────┘
        └────────── one Netlify site ──────────┘
```

## Tech Stack

Chosen so the whole app deploys to Netlify with one build and `pnpm`.

| Concern        | Tool                                                                           |
| -------------- | ------------------------------------------------------------------------------ |
| Monorepo       | [pnpm workspaces](https://pnpm.io/workspaces)                                  |
| Frontend       | [Next.js](https://nextjs.org/) (App Router)                                    |
| Backend        | [Netlify Functions](https://docs.netlify.com/functions/overview/) (TypeScript) |
| Auth + Wallets | [Privy](https://www.privy.io/)                                                 |
| Blockchain     | [Stellar](https://stellar.org/) (testnet + mainnet)                            |
| Yield / Vaults | [DeFindex](https://defindex.io/)                                               |
| Hosting        | [Netlify](https://www.netlify.com/)                                            |

> **Why Netlify Functions instead of a standalone Express server?** Netlify
> hosts static sites + serverless functions, not long-running processes. Making
> each endpoint a function keeps the modular backend/frontend split while
> deploying as one site — no second host, no CORS setup, no extra cost.

---

## Step 1 — Build the Wallet with Privy on Stellar

Goal: a web app where a user logs in (email / social / passkey) and gets an
embedded Stellar wallet they can fund and send from.

### Wallet backend

1. **Scaffold the functions** and configure the Privy server SDK with your App
   ID and secret.
2. **Expose endpoints** the frontend needs, e.g. `GET /api/wallet/balance`,
   `POST /api/wallet/fund` (testnet), `POST /api/payments`.
3. **Keep secrets server-side** — only the public App ID reaches the browser.

### Wallet frontend

1. **Scaffold the app** and install the Privy React SDK.
2. **Add login** — wrap the app in the Privy provider and add a connect button.
3. **Show the wallet** — read the user's Stellar address and call the backend
   for balance.
4. **Fund on testnet** and **send a test payment** through the backend.

> By the end of Step 1 a user can sign in and see/use their Stellar wallet.

## Step 2 — Add DeFindex Vaults

Goal: let users deposit into a DeFindex vault from the wallet and track their
yield.

### Vaults backend

1. **Get DeFindex API access** and store the API key server-side.
2. **Wrap the DeFindex API** behind your own endpoints, e.g.
   `GET /api/vaults`, `POST /api/vaults/deposit`, `GET /api/vaults/position`,
   `POST /api/vaults/withdraw`.

### Vaults frontend

1. **List vaults** by calling the backend.
2. **Deposit** funds from the user's wallet into a vault.
3. **Show balance & APY** for the user's position.
4. **Withdraw** funds back to the wallet.

> By the end of Step 2 the wallet can put idle funds to work earning yield.

---

## Branches — Start From Any Stage

Each stage of the workshop lives on its own branch, so you can check out the
point you want to start from and follow along.

| Branch   | Where you start                                            |
| -------- | ---------------------------------------------------------- |
| `main`   | Empty scaffold — build everything yourself                 |
| `step-1` | Completed wallet (Privy + Stellar); start Step 2 from here |
| `step-2` | Completed wallet **and** DeFindex vaults (final result)    |

```bash
# e.g. begin Step 2 with the wallet already built
git checkout step-1
```

## Project Layout

A single pnpm-workspace monorepo so Netlify builds the whole site at once:

```text
.
├── pnpm-workspace.yaml
├── netlify.toml          # build + functions config
├── frontend/             # Next.js app (the deployed site)
├── netlify/functions/    # backend endpoints → /api/*
└── packages/shared/      # types shared between frontend & functions
```

## Getting Started

```bash
# install all workspaces
pnpm install

# set up environment (see below)
cp .env.example .env

# run Next.js + Functions together via the Netlify CLI
pnpm dlx netlify-cli dev
```

`netlify dev` serves the frontend and proxies `/api/*` to your functions, so the
app at <http://localhost:8888> behaves exactly like production.

## Environment Variables

Set these in `.env` locally, and in **Netlify → Site settings → Environment
variables** for deployment.

Server-side secrets (used by functions, never sent to the browser):

```bash
PRIVY_APP_ID=        # from the Privy dashboard
PRIVY_APP_SECRET=    # from the Privy dashboard
DEFINDEX_API_KEY=    # from DeFindex (Step 2)
```

Public values (exposed to the Next.js frontend):

```bash
NEXT_PUBLIC_PRIVY_APP_ID=   # public App ID for the Privy React SDK
NEXT_PUBLIC_STELLAR_NETWORK=testnet   # "testnet" or "mainnet"
```

> Use `testnet` to follow the workshop with Friendbot-funded accounts. Switch to
> `mainnet` for a production deployment — same code, real funds. Note Friendbot
> funding only exists on testnet.
>
> The frontend calls the backend at the relative path `/api/*`, so there's no
> API URL to configure — same origin in dev and in production.

## Deploying to Netlify

1. Push the repo to GitHub and **import the site** in Netlify (or run
   `netlify init`).
2. Netlify auto-detects `pnpm` from `pnpm-lock.yaml`. Pin the version with a
   `PNPM_VERSION` env var if you want a specific one.
3. The build config lives in `netlify.toml`:

   ```toml
   [build]
     command = "pnpm build"
     publish = "frontend/.next"

   [functions]
     directory = "netlify/functions"
     node_bundler = "esbuild"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```

4. Add the environment variables (above) in the Netlify dashboard.
5. Deploy a branch (e.g. `step-1`) to get a preview URL for that stage.

## Resources

- [Privy Docs](https://docs.privy.io/)
- [Stellar Developers](https://developers.stellar.org/)
- [Stellar Testnet Friendbot](https://friendbot.stellar.org/)
- [DeFindex Docs](https://docs.defindex.io/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [pnpm Workspaces](https://pnpm.io/workspaces)

## License

MIT

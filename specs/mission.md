# Mission

## Why this project exists

Workshop Pulso is a teaching project for the **Pulso Hackathon**. Its purpose is
to show participants how to combine three pieces into one working web app:

- **Privy** — authentication and embedded wallets
- **Stellar** — the underlying blockchain (testnet for the workshop, mainnet for production)
- **DeFindex** — yield-earning vaults

The app itself is the teaching vehicle. Success is measured by how clearly a
participant can follow along and understand each integration, not by product
polish.

## What we're building

A web wallet where a user can:

1. Sign in (email / social / passkey) and receive an embedded Stellar wallet.
2. View their address and balance, fund on testnet, and send a payment.
3. Deposit idle funds into a DeFindex vault, track balance and APY, and withdraw.

## Guiding principles

- **Backend/frontend split for modularity.** The frontend never talks to Privy
  or DeFindex directly; it calls our own API. Secrets stay server-side.
- **Learnable in small steps.** The work is broken into tiny phases so each one
  can be understood and shipped on its own. See [roadmap](./roadmap.md).
- **Start from any stage.** Each workshop step lives on its own branch
  (`main`, `step-1`, `step-2`) so a participant can begin wherever they like.
- **One deployable site.** Frontend and backend deploy together to Netlify with
  a single build.

## Out of scope

- Custody or production-grade key management (the app supports mainnet via
  config, but the workshop is taught on testnet).
- Multi-chain support beyond Stellar.
- Anything that distracts from teaching the Privy + Stellar + DeFindex flow.

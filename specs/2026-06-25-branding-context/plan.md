# Branding & Context — Plan

Maps to roadmap P2.1–P2.5 plus the education disclaimer. Groups are ordered so
each is independently shippable.

## 1. Design tokens & fonts (P2.1)

1. Add `frontend/src/app/theme.css` (or `globals.css`) with a `:root` block:
   palette custom properties (`--df-dark-green`, `--df-lavender`,
   `--df-light-green`, `--df-light-cyan`, `--df-coral`, `--df-white`) and
   semantic tokens (`--df-bg`, `--df-surface`, `--df-text`, `--df-cta`,
   `--df-border`).
2. Define the page background as a soft diffused gradient
   (cyan → light green → lavender) and a glassmorphism surface token
   (translucent white, blur, soft border, rounded corners).
3. In `layout.tsx`, load `Familjen_Grotesk` and `Inter_Tight` via
   `next/font/google`, expose them as CSS variables
   (`--font-heading`, `--font-body`) on `<body>`, and import the stylesheet.
4. Apply base typography: body uses Inter Tight + Dark Green text; `h1`–`h3`
   use Familjen Grotesk. Remove the inline `fontFamily` hack.

## 2. Logo & header (P2.2)

1. Official logo SVGs are already in `frontend/public/brand/` (documented in its
   `README.md`). Render `/brand/logo-horizontal-light.svg` at ≥40px,
   unmodified — via `next/image` or a plain `<img>` in a small `SiteHeader`
   component.
2. Build a header (in `layout.tsx` or a `SiteHeader` component) showing the
   logo on the brand background. Optionally set the favicon from a brand SVG.

## 3. Context hero (P2.3)

1. Rewrite `page.tsx` hero: headline + 2–3 sentence plain-language explanation
   of what the app is (sign in with Privy → embedded Stellar wallet → DeFindex
   vaults) and that vaults come in a later step.
2. Optional: a short 3-step "how it works" list (Sign in → Fund → Send), styled
   as glass cards, to set expectations.

## 4. Current-state panel (P2.4)

1. Restyle `wallet-panel.tsx` as a glassmorphism card using tokens. Do **not**
   change any hooks, fetches, or signing logic.
2. Make each state explicit and labeled so the screen self-describes:
   - Auth status (Signed in / Not signed in) as a clear badge.
   - Wallet address with a "Stellar address" label (keep break-all).
   - Balance with label and units.
   - A "what you can do next" hint that reflects state (e.g. fund when balance
     is 0, send when funded).
3. Keep the server-verified indicator and notice/error lines, restyled to brand
   colors (success = dark/light green, error = coral).

## 5. Restyle controls (P2.5)

1. Add reusable button styles via tokens: primary CTA = Coral background, white
   text; secondary = outline. Apply to Log in / Fund / Send / Log out.
2. Style the send-form inputs (brand border, focus state, rounded) via tokens.
3. Ensure disabled/busy states remain visually distinct.

## 6. Education disclaimer

1. Add a persistent footer note (in `layout.tsx`) — always visible — stating the
   app is for **education only**, runs on **testnet**, is **not a financial
   service**, and to **not send real funds**.
2. Style it muted but legible (Dark Green on light surface).

## 7. Verify

1. `pnpm install` if needed; `pnpm --filter frontend build` (or repo typecheck)
   passes.
2. Manual walkthrough per `validation.md`.

# Branding & Context — Validation

## Automated

- [ ] `pnpm --filter frontend build` succeeds (Next.js compiles; fonts resolve
      via `next/font/google`).
- [ ] TypeScript typecheck passes for the frontend (no new type errors in
      `layout.tsx`, `page.tsx`, `wallet-panel.tsx`, `defindex-logo.tsx`).
- [ ] No new runtime dependency added to `frontend/package.json` (Google Fonts
      come through `next/font`, not a package).

## Manual

Run `pnpm dlx netlify-cli dev` and open the site.

- [ ] **Theme applied:** background shows the soft cyan→green→lavender gradient;
      body text is Inter Tight in Dark Green; headings are Familjen Grotesk.
- [ ] **Logo:** official `/brand/logo-horizontal-light.svg` renders in the
      header at ≥40px, unmodified colors, not rotated.
- [ ] **Context hero:** explains in plain language what the app is (Privy +
      Stellar + DeFindex) and that vaults come later.
- [ ] **Current-state panel — logged out:** shows a clear "Not signed in" state
      and a Coral "Log in" CTA.
- [ ] **Current-state panel — logged in:** shows labeled auth badge, Stellar
      address, balance with units, and a next-action hint; server-verified line
      visible.
- [ ] **Controls restyled:** Log in / Fund / Send / Log out use brand button
      styles (Coral primary CTA); inputs have brand styling and focus state;
      disabled/busy states are visibly distinct.
- [ ] **Behaviour unchanged:** login, fund-on-testnet, and send-payment flows
      still work end-to-end (sign + submit). No regression in
      `wallet-panel.tsx` logic.
- [ ] **Disclaimer:** a persistent footer states education-only / testnet / not
      a financial service / do not send real funds, and stays visible while
      scrolling/interacting.
- [ ] **Asset README:** `frontend/public/brand/README.md` documents the brand
      SVGs and the media-kit → web-safe filename mapping.

## Tone check

- [ ] Hero and disclaimer copy is plain, instructional, and non-hyped (matches
      `specs/mission.md` teaching tone).
- [ ] Disclaimer is unambiguous that no real funds should be used.
- [ ] No aggressive "crypto" aesthetic; colors stay within the DeFindex palette.

## Definition of done

- All automated checks pass.
- All manual checks pass with no behavioural regression in the wallet flows.
- Visual identity matches the DeFindex media kit (palette, fonts, glassmorphism,
  gradient, logo usage).
- Roadmap P2.1–P2.5 items can be checked off.

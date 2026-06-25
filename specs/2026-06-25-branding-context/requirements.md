# Branding & Context — Requirements

Roadmap phase: **Stage 2 — Branding & context** (`specs/roadmap.md`, branch
`step-2`). Feature branch: `phase-2-branding-context`.

## Scope

Apply the DeFindex visual identity to the existing frontend and make the page
self-explanatory. A first-time visitor should understand what the app is, see
the live state of their session, and know it is an educational demo.

### In scope

| Item | What it covers |
| ---- | -------------- |
| **Brand theme** | DeFindex palette + the two brand fonts wired in as CSS variables / design tokens. Base typography + page background gradient. |
| **DeFindex logo** | Official horizontal logo in the header (correct light/dark variant, unmodified, min 40px). |
| **Context hero** | Intro section explaining what the app is and does — Privy auth + Stellar wallet + DeFindex vaults — in plain language. |
| **Current-state panel** | The wallet panel restated so the screen is self-describing: auth status, wallet address, balance, and the next action available, each labeled. |
| **Restyle existing controls** | Login / fund / send controls styled to brand (Coral CTAs, glassmorphism cards). Behaviour unchanged. |
| **Education disclaimer** | Clear notice that this repo is for education only and is **not** a financial service / not for real funds. |

### Out of scope

- Any change to backend functions, API contracts, or wallet/payment behaviour.
- DeFindex vault features (that is Stage 3).
- New runtime dependencies beyond Google Fonts via `next/font`.
- Dark/light mode toggle (pick one background treatment).

## Decisions

- **Theme via CSS variables / tokens** (user choice). No Tailwind in the project
  today; the frontend uses inline styles. Introduce a global stylesheet with
  `:root` custom properties for palette + font families and convert the inline
  styles to use them. Keep it framework-free.
- **Fonts via `next/font/google`** — Familjen Grotesk (headlines) and Inter
  Tight (body). Exposed as CSS variables on `<body>` and referenced from tokens.
- **Logo asset handling.** The official media-kit logo SVGs were added manually
  to `frontend/public/brand/` (see its `README.md` for the full mapping). They
  are renamed to web-safe names (the media-kit names contain spaces and `#`).
  - Header uses `/brand/logo-horizontal-light.svg` (Lavender symbol + Dark Green
    wordmark) — the light-background variant, correct for the brand gradient.
  - Use the SVG unmodified (no recolor/rotate), rendered at ≥40px via an
    `<img>` or inline `<Image>`. No recreated/placeholder logo needed.
  - No white/dark-background lockup was supplied; if a dark placement is added
    later, drop the white-wordmark variant in and switch by background.
- **Disclaimer is persistent**, not a dismissible toast — a fixed footer note so
  it is always visible (educational integrity for a workshop).

## Context

### Brand reference (DeFindex media kit)

- **Fonts:** Familjen Grotesk (headlines), Inter Tight (body) — both Google Fonts.
- **Palette:**
  - Dark Green `#014751` — primary text / dark surfaces
  - Lavender `#DEC9F4` — logo symbol / accents
  - Light Green `#D3FFB4` — highlights / soft backgrounds
  - Light Cyan `#D3FBFF` — backgrounds / graphics
  - Coral `#FC5B31` — strong accent / CTAs
  - White `#FFFFFF`
- **Style:** glassmorphism surfaces (translucent, soft borders), soft diffused
  gradients (cyan → light green → lavender). Professional yet accessible. **No**
  aggressive "crypto" aesthetics; do not recolor or rotate the logo.

### Tone (user-facing copy)

- Plain, welcoming, instructional — this is a teaching app (see
  `specs/mission.md`). Explain, don't hype.
- Disclaimer copy must be unambiguous: educational use only, testnet, not a
  financial service, do not send real funds.

### Patterns to follow

- `frontend/src/app/layout.tsx` — currently inline body styles; this is where
  fonts + global stylesheet get wired.
- `frontend/src/app/page.tsx` — hero copy lives here.
- `frontend/src/components/wallet-panel.tsx` — the current-state panel; restyle
  via tokens, keep all hooks/behaviour intact (login, fund, send, signing).
- Stack is **locked** (`specs/tech-stack.md`): Next.js App Router, pnpm,
  TypeScript, no new deps.

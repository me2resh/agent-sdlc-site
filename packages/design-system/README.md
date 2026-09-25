# Standards design system — Option A: "RFC Register"

This package contains the shared visual tokens used by the Agent SDLC, ORBIT, and AgDR sites. It is the **only** source of color, font, type scale, spacing, radius, and light/dark theme values for the three standards sites. No file under `apps/site` may hold a literal color value — every color comes from a custom property defined in `tokens.css`. `scripts/validate-design-tokens.mjs` (wired into `npm run validate`) fails the build if one slips in.

Decision record: `docs/design/2026-09-25-option-a-rfc-register.md`. This tokens file replaces the ApexYard "paper" tokens from PR #9, which the maintainer rejected (rule 1 in #17 forbids a "paper" neutral).

## What the tokens give you

- **Type** — Spectral (Google Fonts) for text and display, set upright only; Courier Prime (Google Fonts) for mono and code.
- **Neutrals** — cool blue-gray tokens (`--bg`, `--surface`, `--text`, `--muted`, `--rule`, `--focus`). Each token holds its light and dark value once, as `light-dark(<light>, <dark>)`. No beige, cream, or stone tint.
- **Accents** — one per standard: indigo for Agent SDLC, teal for ORBIT, violet for AgDR. `.agentsdlc-site` / `.orbit-site` / `.agdr-site` on `<body>` map the standard's own accent onto the shared `--accent` property, so the same component CSS works on all three sites.
- **Theme method** — `color-scheme` on `<html>`. The inline script in `StandardLayout.astro`'s `<head>` sets `data-theme="light"` or `data-theme="dark"` before first paint (saved choice first, then `prefers-color-scheme`). With JavaScript off, `:root { color-scheme: light dark }` makes the page follow the OS setting. `light-dark()` needs Chrome 123, Firefox 120, or Safari 17.5 or later.

Import `@agent-sdlc/design-system/tokens.css` once, from the shared layout. Bump the package version when the shared visual contract changes.

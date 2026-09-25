# Standards design system — Option A: "RFC Register"

This package contains the shared visual tokens used by the Agent SDLC, ORBIT, and AgDR sites. It is the **only** source of color, font, type scale, spacing, radius, and light/dark theme values for the three standards sites. No file under `apps/site` may hold a literal color value — every color comes from a custom property defined in `tokens.css`. `scripts/validate-design-tokens.mjs` (wired into `npm run validate`) fails the build if one slips in.

Decision record: `docs/design/2026-09-25-option-a-rfc-register.md`. This tokens file replaces the ApexYard "paper" tokens from PR #9, which the maintainer rejected (rule 1 in #17 forbids a "paper" neutral).

## What the tokens give you

- **Type** — Spectral (Google Fonts) for text and display, set upright only; Courier Prime (Google Fonts) for mono and code.
- **Neutrals** — cool blue-gray tokens (`--bg`, `--surface`, `--text`, `--muted`, `--rule`, `--focus`). Each token holds its light and dark value once, as `light-dark(<light>, <dark>)`. No beige, cream, or stone tint.
- **Accents** — one per standard: indigo for Agent SDLC, teal for ORBIT, violet for AgDR. `.agentsdlc-site` / `.orbit-site` / `.agdr-site` on `<body>` map the standard's own accent onto the shared `--accent` property, so the same component CSS works on all three sites.
- **Theme method** — `color-scheme` on `<html>`. The inline script in `StandardLayout.astro`'s `<head>` sets `data-theme="light"` or `data-theme="dark"` before first paint (saved choice first, then `prefers-color-scheme`). With JavaScript off, `:root { color-scheme: light dark }` makes the page follow the OS setting.
- **Older browsers** — `light-dark()` needs Chrome 123, Firefox 120, or Safari 17.5 or later. For older browsers (for example Safari 13 to 17.4 and Firefox 96 to 119), `tokens.css` has an `@supports not (color: light-dark(#000, #fff))` block with the same 18 values as plain hex: light on `:root`, dark on `html[data-theme='dark']`, and dark inside `@media (prefers-color-scheme: dark)` on `html:not([data-theme='light'])`. These browsers get the full design in light mode, dark mode, forced light, and forced dark. Current browsers skip the block. If you change a color, change it in both places: `npm run validate` fails when the fallback and the `light-dark()` pairs differ.
- **What the build check does not cover** — `scripts/validate-design-tokens.mjs` does not read the values in `tokens.css` itself. Rules 1 and 2 of #17 (no warm neutral, no brown or orange accent) have no build check. The UI Designer design review is the control for those rules.

Import `@agent-sdlc/design-system/tokens.css` once, from the shared layout. Bump the package version when the shared visual contract changes.

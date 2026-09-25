# Design decision: Option A, "RFC Register"

Date: 2026-09-25
Ticket: me2resh/agent-sdlc-site#17
Reverses: [PR #9](https://github.com/me2resh/agent-sdlc-site/pull/9) ("feat(#1): share ApexYard design system across standards sites")

## Decision

The maintainer chose Option A, "RFC Register", from the three options in
`docs/design/neutral-options-proposal.md`. This is the design system for
agentsdlc.ai, orbitspec.dev, and agdr.dev.

## Why

[PR #9](https://github.com/me2resh/agent-sdlc-site/pull/9) added the ApexYard "paper" tokens to the three standards sites. The
maintainer reviewed the result and rejected it. The maintainer said the
site looked "Claude-designed." The paper tokens used a "paper"
background color, which rule 1 below forbids. This did not meet the maintainer's bar for a vendor-neutral
standards site.

## The rules this decision follows

The maintainer set four rules for the new design. Every value in
`packages/design-system/tokens.css` follows all four:

1. No beige, cream, paper, parchment, or stone background or surface
   color. Every neutral in Option A is a cool, blue-gray tone.
2. No terracotta, rust, ochre, burnt orange, amber-brown, or brown
   accent color, in light mode or in dark mode. Option A uses three
   accents: indigo for Agent SDLC, teal for ORBIT, and violet for AgDR.
3. No callout with a thick colored left border on a tinted background.
   Option A's callout is a full 1px outline in the standard's accent
   color, on the plain background, with no tint.
4. No italic serif display type on a cream background, and no
   small-caps eyebrow label in the accent color. Option A's display
   and text face, Spectral, is set upright only.

## What Option A gives the build

- Type: Spectral (text and display) and Courier Prime (mono), both from
  Google Fonts.
- Neutrals: cool blue-gray tokens (`--bg`, `--surface`, `--text`,
  `--muted`, `--rule`, `--focus`). Each token holds its light mode value
  and its dark mode value once, in `light-dark()`.
- Older browsers: a browser without `light-dark()` (for example Safari
  13 to 17.4, or Firefox 96 to 119) reads an
  `@supports not (color: light-dark(#000, #fff))` block in `tokens.css`.
  That block holds the same values as plain hex. The build fails if the
  two copies differ.
- Theme method: the `color-scheme` property. The `data-theme` attribute
  on `<html>` sets it. With no attribute (JavaScript off), the page
  follows the OS setting.
- Accents: `--accent-agent-sdlc` (indigo), `--accent-orbit` (teal),
  `--accent-agdr` (violet). Each site maps its own accent onto the
  shared `--accent` property through a body class
  (`.agentsdlc-site`, `.orbit-site`, `.agdr-site`).
- Marks: a ring for Agent SDLC, an ellipse with a dot for ORBIT, and a
  tag shape for AgDR. Each mark is an inline SVG that inherits
  `--accent` through `currentColor`.

Every value, and the full WCAG contrast table for both light and dark
mode, is in `docs/design/neutral-options-proposal.md`.

## Enforcement

`packages/design-system/tokens.css` is the only source of color, font,
type scale, spacing, radius, and the light/dark method for the three
sites. `scripts/validate-design-tokens.mjs`, wired into `npm run
validate`, fails the build if a file under `apps/site` holds a literal
color value, or uses a CSS custom property that `tokens.css` does not
define.

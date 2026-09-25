# Standards palette options — design proposal

Ticket: me2resh/agent-sdlc-site#17
Author: Nour, UI Designer
Date: 2026-09-25 (revised same day, after maintainer feedback)

## Rules applied to this revision

The maintainer reviewed the first version of this proposal and
rejected it. The maintainer said it looked "Claude-designed." The
maintainer gave four rules. This revision follows all four rules.

1. No warm-tinted neutral color for a background or a surface. This
   means no beige, no cream, no paper color, no parchment color, and
   no stone color. Every neutral in this revision is one of two
   kinds: true gray, with zero color tint, or cool gray, with a
   slight blue tint or a slight green tint only.
2. No terracotta, rust, ochre, burnt orange, amber-brown, or brown
   accent color, in light mode or in dark mode. No single warm orange
   color as a brand color. Every accent in this revision comes from
   one of six hue families: blue, indigo, teal, green, violet, or
   magenta. Red is not used as a standard's accent color in this
   revision. Red stays reserved for an error state, which this
   revision does not need to show.
3. No callout with a thick colored left border on a tinted
   background. The maintainer named this pattern directly: a cream
   box with a brown-orange left rule. This revision uses three
   different callout shapes instead, one per option: a full 1px
   outline, a top rule, and an icon next to a plain label. This
   revision also removes every italic serif heading and every
   small-caps label set in an accent color.
4. Three distinct options remain. Each option keeps one accent per
   standard. This document computes every contrast pair and every
   pair passes WCAG AA. No option reuses ApexYard's blue accent or
   ApexYard's type pair.

## Purpose

This document proposes three neutral design-system options for
agentsdlc.ai, orbitspec.dev, and agdr.dev. The maintainer must pick
one option before the build starts. This satisfies the first
acceptance criterion of #17.

Each option gives one text face, one mono face, a neutral palette for
light mode, a neutral palette for dark mode, and one accent color per
standard. Each option also gives a mark idea for each standard.

The visual comparison for these options is at:
`/private/tmp/claude-501/-Users-ahmed-Projects-Apex-apexyard/d63746da-e97e-436f-bcd6-a888579359ad/scratchpad/neutral-options/index.html`

## A note on the attribute name in the tokens below

The tokens below use the selector `[data-theme='light']` and
`[data-theme='dark']`. This matches the attribute the real site
already uses, in `StandardLayout.astro`. Use this attribute in the
build.

The comparison page, `index.html`, uses a different attribute,
`data-demo-mode`, only on its own preview cards. It uses a different
name so its own light/dark toggle button does not fight with the
attribute a real browser or a real site might set. Read
`data-demo-mode` in `index.html` as a stand-in for `data-theme` in
the real site.

## How this document computed contrast

Every ratio in this document comes from the WCAG relative-luminance
formula, computed from the real hex values. No ratio is a guess. WCAG
2.2 AA needs 4.5:1 for normal text and 3:1 for a UI border or a
non-text component boundary.

## Option A — RFC Register

### Character and risk

Character: this option reads like an archived internet standard. It
uses typewriter code, a cool gray bulletin background, and three
plain ink-colored accents — indigo, teal, and violet — that mark
which standard is which.

Risk: the typewriter mono face is a strong, specific choice. Read a
full page of running prose in it, not only a short code sample, to
confirm it stays comfortable to read.

### Type

Text face: Spectral (Google Fonts), set upright, not italic. Mono
face: Courier Prime (Google Fonts). Courier Prime is a typewriter-
style face. RFCs, the original internet standards, were plain-text
documents, read in a typewriter face. This face ties the option to
that history.

Type scale (rem, applies at desktop width; scale ratio 1.333):

| Role | Size | Line height |
|---|---|---|
| Body | 1rem | 1.65 |
| Small / mono label | 0.8rem | 1.5 |
| H3 | 1.375rem | 1.3 |
| H2 | 1.875rem | 1.25 |
| H1 | 2.75rem | 1.1 |
| Display (home page name) | clamp(2.5rem, 6vw, 4.25rem) | 1.05 |

Line length target: 68 characters for body text.

### Marks

- Agent SDLC: two concentric circle rings, like a plain stamp
  outline. No fill, no text inside.
- ORBIT: one ellipse ring with a single dot on the ring path.
- AgDR: a tag shape (a plain outline pointing left, with one small
  hole near the point), like a record tag on a filed decision.

### Callout shape

A full 1px outline in the standard's own accent color, around the
option's plain background — not a tinted surface. A small label,
"Note," in the mono face, in the muted neutral color, sits above the
callout text. The label is not set in small caps and is not colored
in the accent.

### Tokens

```css
/* Option A — RFC Register */
.opt-a {
  --font-display: 'Spectral', Georgia, 'Times New Roman', serif;
  --font-mono: 'Courier Prime', 'Courier New', monospace;
}

/* light mode */
.opt-a[data-theme='light'] {
  --bg: #F1F3F6;
  --surface: #E4E7EC;
  --text: #16181C;
  --muted: #555A62;
  --rule: #7B808A;
  --focus: #2A4B8C;
  --accent-agent-sdlc: #3B4FA0;
  --accent-orbit: #166A63;
  --accent-agdr: #6A3E96;
}

/* dark mode */
.opt-a[data-theme='dark'] {
  --bg: #14161B;
  --surface: #1D2026;
  --text: #ECEEF1;
  --muted: #A5AAB2;
  --rule: #6C7280;
  --focus: #7C9CE0;
  --accent-agent-sdlc: #8C9BDD;
  --accent-orbit: #4FC7BC;
  --accent-agdr: #B78FDE;
}
```

### Contrast — Option A, light mode

| Pair | Ratio | Needs | Result |
|---|---|---|---|
| text on bg | 15.99:1 | 4.5:1 | Pass |
| muted text on bg | 6.24:1 | 4.5:1 | Pass |
| text on surface | 14.34:1 | 4.5:1 | Pass |
| muted text on surface | 5.60:1 | 4.5:1 | Pass |
| rule (border) on bg | 3.57:1 | 3:1 | Pass |
| rule (border) on surface | 3.20:1 | 3:1 | Pass |
| focus ring on bg | 7.61:1 | 3:1 | Pass |
| Agent SDLC accent on bg | 6.72:1 | 4.5:1 | Pass |
| Agent SDLC accent on surface | 6.02:1 | 4.5:1 | Pass |
| ORBIT accent on bg | 5.77:1 | 4.5:1 | Pass |
| ORBIT accent on surface | 5.17:1 | 4.5:1 | Pass |
| AgDR accent on bg | 6.89:1 | 4.5:1 | Pass |
| AgDR accent on surface | 6.18:1 | 4.5:1 | Pass |

### Contrast — Option A, dark mode

| Pair | Ratio | Needs | Result |
|---|---|---|---|
| text on bg | 15.57:1 | 4.5:1 | Pass |
| muted text on bg | 7.75:1 | 4.5:1 | Pass |
| text on surface | 14.04:1 | 4.5:1 | Pass |
| muted text on surface | 6.99:1 | 4.5:1 | Pass |
| rule (border) on bg | 3.75:1 | 3:1 | Pass |
| rule (border) on surface | 3.39:1 | 3:1 | Pass |
| focus ring on bg | 6.63:1 | 3:1 | Pass |
| Agent SDLC accent on bg | 6.76:1 | 4.5:1 | Pass |
| Agent SDLC accent on surface | 6.10:1 | 4.5:1 | Pass |
| ORBIT accent on bg | 8.81:1 | 4.5:1 | Pass |
| ORBIT accent on surface | 7.95:1 | 4.5:1 | Pass |
| AgDR accent on bg | 6.89:1 | 4.5:1 | Pass |
| AgDR accent on surface | 6.21:1 | 4.5:1 | Pass |

## Option B — Schema Register

### Character and risk

Character: this option reads like a civic or engineering standards
body. It uses a true neutral gray, plain grotesk type, and one plain
accent color for each standard.

Risk: a plain sans-serif face on a true gray is the most common
pattern for a documentation site. This option's identity depends on
Public Sans's civic origin and the three accent colors. It does not
depend on an unusual layout. Test it next to other technical docs
sites to confirm it still reads as distinct.

### Type

Text face: Public Sans (Google Fonts). Mono face: Red Hat Mono
(Google Fonts). The U.S. federal government built Public Sans for its
own plain, neutral, civic communication. This origin fits a
vendor-neutral standards site.

Type scale (rem, applies at desktop width; scale ratio 1.25):

| Role | Size | Line height |
|---|---|---|
| Body | 1rem | 1.55 |
| Small / mono label | 0.8125rem | 1.45 |
| H3 | 1.25rem | 1.3 |
| H2 | 1.75rem | 1.25 |
| H1 | 2.5rem | 1.15 |
| Display (home page name) | clamp(2.25rem, 5vw, 3.75rem) | 1.1 |

Line length target: 72 characters for body text.

### Marks

- Agent SDLC: the plain lowercase word "agent_sdlc," set in Public
  Sans, with one rule under the baseline — like a schema property
  name. Not italic. Not small caps.
- ORBIT: a circle ring with one small filled square on the ring path
  — a node marker.
- AgDR: three flat horizontal bars, each shorter than the last, like
  three ledger lines.

### Callout shape

A top rule, 2px tall, in the standard's own accent color. No side
border and no bottom border. The background stays the option's plain
background, not a tinted surface. A small label, "Note," in the mono
face, in the muted neutral color, sits above the callout text.

### Tokens

```css
/* Option B — Schema Register */
.opt-b {
  --font-display: 'Public Sans', -apple-system, sans-serif;
  --font-mono: 'Red Hat Mono', 'SFMono-Regular', monospace;
}

/* light mode */
.opt-b[data-theme='light'] {
  --bg: #FAFAFA;
  --surface: #EFEFEF;
  --text: #1A1A1A;
  --muted: #5C5C5C;
  --rule: #767676;
  --focus: #23324A;
  --accent-agent-sdlc: #4A5578;
  --accent-orbit: #1F7A6C;
  --accent-agdr: #8A2F72;
}

/* dark mode */
.opt-b[data-theme='dark'] {
  --bg: #171717;
  --surface: #212121;
  --text: #F2F2F2;
  --muted: #ABABAB;
  --rule: #757575;
  --focus: #7C93B8;
  --accent-agent-sdlc: #8993BE;
  --accent-orbit: #4FC2AE;
  --accent-agdr: #D98FC4;
}
```

Note on the AgDR accent: the first version of this proposal used a
gold/ochre color, `#7A5E1A` in light mode and `#D9AE55` in dark mode,
for the AgDR accent in this option. The maintainer's rule 2 forbids
ochre. This revision replaces both values with a magenta color,
`#8A2F72` in light mode and `#D98FC4` in dark mode. No other token in
Option B changed.

### Contrast — Option B, light mode

| Pair | Ratio | Needs | Result |
|---|---|---|---|
| text on bg | 16.67:1 | 4.5:1 | Pass |
| muted text on bg | 6.41:1 | 4.5:1 | Pass |
| text on surface | 15.14:1 | 4.5:1 | Pass |
| muted text on surface | 5.82:1 | 4.5:1 | Pass |
| rule (border) on bg | 4.35:1 | 3:1 | Pass |
| rule (border) on surface | 3.95:1 | 3:1 | Pass |
| focus ring on bg | 12.37:1 | 3:1 | Pass |
| Agent SDLC accent on bg | 7.03:1 | 4.5:1 | Pass |
| Agent SDLC accent on surface | 6.38:1 | 4.5:1 | Pass |
| ORBIT accent on bg | 4.96:1 | 4.5:1 | Pass |
| ORBIT accent on surface | 4.50:1 | 4.5:1 | Pass (at the line) |
| AgDR accent on bg | 7.37:1 | 4.5:1 | Pass |
| AgDR accent on surface | 6.69:1 | 4.5:1 | Pass |

### Contrast — Option B, dark mode

| Pair | Ratio | Needs | Result |
|---|---|---|---|
| text on bg | 16.01:1 | 4.5:1 | Pass |
| muted text on bg | 7.81:1 | 4.5:1 | Pass |
| text on surface | 14.38:1 | 4.5:1 | Pass |
| muted text on surface | 7.01:1 | 4.5:1 | Pass |
| rule (border) on bg | 3.89:1 | 3:1 | Pass |
| rule (border) on surface | 3.49:1 | 3:1 | Pass |
| focus ring on bg | 5.74:1 | 3:1 | Pass |
| Agent SDLC accent on bg | 5.96:1 | 4.5:1 | Pass |
| Agent SDLC accent on surface | 5.35:1 | 4.5:1 | Pass |
| ORBIT accent on bg | 8.25:1 | 4.5:1 | Pass |
| ORBIT accent on surface | 7.41:1 | 4.5:1 | Pass |
| AgDR accent on bg | 7.41:1 | 4.5:1 | Pass |
| AgDR accent on surface | 6.65:1 | 4.5:1 | Pass |

Note on the ORBIT accent on surface in light mode: the ratio is
4.50:1. This is the WCAG AA line itself, not a rounded-up estimate.
If the maintainer wants a safety margin, darken `--accent-orbit` in
light mode by a few percent. This document computed the ratio at
exactly 4.50:1, with no rounding in the option's favor.

## Option C — Registry Ledger

### Character and risk

Character: this option reads like a printed technical standard
binder. It uses a sturdy slab serif, a cool green-gray page color,
and a colored filing tab for each standard.

Risk: a slab serif at a large display size can look heavy. Test the
display size against real, longer page titles, not only against the
word "ORBIT" or "AgDR," before this option ships.

### Type

Text face: Zilla Slab (Google Fonts). Mono face: Overpass Mono
(Google Fonts). Zilla Slab is a slab serif built for a technical
documentation product. It carries a sturdy, structured character
that fits a registry of specifications.

Type scale (rem, applies at desktop width; scale ratio 1.3):

| Role | Size | Line height |
|---|---|---|
| Body | 1rem | 1.6 |
| Small / mono label | 0.8125rem | 1.5 |
| H3 | 1.3rem | 1.3 |
| H2 | 1.8rem | 1.25 |
| H1 | 2.6rem | 1.15 |
| Display (home page name) | clamp(2.4rem, 5.5vw, 4rem) | 1.08 |

Line length target: 70 characters for body text.

### Marks

- Agent SDLC: a file-folder tab shape (a rectangle with a notch cut
  into the top-right corner), with the letters "SDLC" set inside it
  in the mono face.
- ORBIT: a hexagon ring, like a certification seal.
- AgDR: a square with one corner folded down, like an index card.

### Callout shape

A small filled-circle icon, in the standard's own accent color, next
to a plain label, "Note," and the callout text. The whole block sits
inside a full 1px outline in the neutral rule color — not the
accent color, and not a tinted background.

### Tokens

```css
/* Option C — Registry Ledger */
.opt-c {
  --font-display: 'Zilla Slab', Georgia, serif;
  --font-mono: 'Overpass Mono', 'SFMono-Regular', monospace;
}

/* light mode */
.opt-c[data-theme='light'] {
  --bg: #F1F4F1;
  --surface: #E4E8E4;
  --text: #181B18;
  --muted: #565A56;
  --rule: #7D8280;
  --focus: #33456B;
  --accent-agent-sdlc: #2E5FA3;
  --accent-orbit: #276A40;
  --accent-agdr: #8A3D74;
}

/* dark mode */
.opt-c[data-theme='dark'] {
  --bg: #141816;
  --surface: #1F2320;
  --text: #E9ECE9;
  --muted: #A3A8A3;
  --rule: #727870;
  --focus: #8C9FD1;
  --accent-agent-sdlc: #7FA8E0;
  --accent-orbit: #6FBE8C;
  --accent-agdr: #D19BC1;
}
```

### Contrast — Option C, light mode

| Pair | Ratio | Needs | Result |
|---|---|---|---|
| text on bg | 15.68:1 | 4.5:1 | Pass |
| muted text on bg | 6.33:1 | 4.5:1 | Pass |
| text on surface | 14.03:1 | 4.5:1 | Pass |
| muted text on surface | 5.67:1 | 4.5:1 | Pass |
| rule (border) on bg | 3.52:1 | 3:1 | Pass |
| rule (border) on surface | 3.15:1 | 3:1 | Pass |
| focus ring on bg | 8.60:1 | 3:1 | Pass |
| Agent SDLC accent on bg | 5.77:1 | 4.5:1 | Pass |
| Agent SDLC accent on surface | 5.17:1 | 4.5:1 | Pass |
| ORBIT accent on bg | 5.88:1 | 4.5:1 | Pass |
| ORBIT accent on surface | 5.26:1 | 4.5:1 | Pass |
| AgDR accent on bg | 6.32:1 | 4.5:1 | Pass |
| AgDR accent on surface | 5.65:1 | 4.5:1 | Pass |

### Contrast — Option C, dark mode

| Pair | Ratio | Needs | Result |
|---|---|---|---|
| text on bg | 15.05:1 | 4.5:1 | Pass |
| muted text on bg | 7.41:1 | 4.5:1 | Pass |
| text on surface | 13.37:1 | 4.5:1 | Pass |
| muted text on surface | 6.58:1 | 4.5:1 | Pass |
| rule (border) on bg | 3.96:1 | 3:1 | Pass |
| rule (border) on surface | 3.51:1 | 3:1 | Pass |
| focus ring on bg | 6.82:1 | 3:1 | Pass |
| Agent SDLC accent on bg | 7.32:1 | 4.5:1 | Pass |
| Agent SDLC accent on surface | 6.50:1 | 4.5:1 | Pass |
| ORBIT accent on bg | 8.04:1 | 4.5:1 | Pass |
| ORBIT accent on surface | 7.14:1 | 4.5:1 | Pass |
| AgDR accent on bg | 7.82:1 | 4.5:1 | Pass |
| AgDR accent on surface | 6.95:1 | 4.5:1 | Pass |

## Confirmation — rules 1 and 2, checked value by value

Rule 1 (no warm-tinted neutral; true gray or cool gray only):

| Token | Option A | Option B | Option C |
|---|---|---|---|
| Light bg | #F1F3F6 — blue-highest channel, cool | #FAFAFA — equal channels, true gray | #F1F4F1 — green-highest channel, cool |
| Light surface | #E4E7EC — blue-highest, cool | #EFEFEF — true gray | #E4E8E4 — green-highest, cool |
| Dark bg | #14161B — blue-highest, cool | #171717 — true gray | #141816 — green-highest, cool |
| Dark surface | #1D2026 — blue-highest, cool | #212121 — true gray | #1F2320 — green-highest, cool |

No beige, cream, paper, parchment, or stone value appears in any
option. Every value above is either a true gray (equal R, G, and B)
or a cool gray (the highest of the three channels is blue or green,
never red).

Rule 2 (accent hue families; no orange or brown; red reserved for
errors):

| Standard | Option A | Option B | Option C |
|---|---|---|---|
| Agent SDLC | indigo | indigo/slate | blue |
| ORBIT | teal | teal | green |
| AgDR | violet | magenta | magenta |
| Focus ring (shared UI token, not a standard accent) | blue | navy blue | blue-indigo |

Every accent and every focus color above comes from one of the six
allowed families: blue, indigo, teal, green, violet, magenta. No
option uses orange, brown, terracotta, rust, ochre, or amber-brown,
in either light mode or dark mode. No option uses red as a standard's
accent color.

## How the tokens map to the current CSS problem

Issue #17 lists two contrast bugs in the current tokens.css: the
theme-toggle border at 1.66:1 in light mode, and the fixed ink color
on the dark background at 1.10:1. Both bugs are pairs of "a border
color on a background" and "a text color on a background." Every
option above computes both kinds of pair, for every token, in both
modes. None of the three options can reproduce either bug, because
each option defines its border color and its text color as one token
per mode, with a computed ratio, instead of a fixed hex value that
never changes with the mode.

## Recommendation

Recommendation: Option B, Schema Register.

Reason: Option B best serves the stated goal in #17, "look like a
standards body, not a product brand." Public Sans is a real,
documented civic typeface, built by a government body for
plain-language communication. This is a strong, literal fit for
"vendor-neutral." Option B's true neutral gray also carries zero
color tint, the plainest possible choice under rule 1. After
replacing the AgDR accent with magenta, Option B's contrast ratios
also carry the most margin above the AA line, except for the
ORBIT-on-surface edge case noted above, which the maintainer can fix
by darkening one token a few percent.

If the maintainer wants more visual character, Option A (cool,
typewriter-flavored) and Option C (cool, slab-serif, editorial) are
both solid second choices. Both pass every contrast pair in this
document and both follow every rule in this revision.

## Files

- Visual comparison (HTML, light/dark toggle):
  `/private/tmp/claude-501/-Users-ahmed-Projects-Apex-apexyard/d63746da-e97e-436f-bcd6-a888579359ad/scratchpad/neutral-options/index.html`
- This proposal:
  `/private/tmp/claude-501/-Users-ahmed-Projects-Apex-apexyard/d63746da-e97e-436f-bcd6-a888579359ad/scratchpad/neutral-options/proposal.md`

No file in the `agent-sdlc-site` repository was changed to produce
this proposal. The maintainer must approve one option before the
build ticket starts, per the acceptance criteria in #17.

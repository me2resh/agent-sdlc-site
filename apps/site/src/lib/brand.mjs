// Brand assets for the three standards sites (agent-sdlc-site#15): the
// favicon SVG and the Open Graph image SVG.
//
// This module holds NO color value. Every color comes from the design-system
// tokens (packages/design-system/tokens.css), which the caller reads and
// passes in as text. So the design-token check stays green, and a token
// change goes into the icons automatically:
//   - src/pages/favicon.svg.ts renders the SVG favicon at build time.
//   - scripts/generate-brand-assets.mjs rasterizes the same SVGs to the
//     PNG and ICO fallbacks in src/assets/brand/<site>/. The build fails
//     when those files are older than the tokens or the marks (see
//     src/lib/brand-files.ts).
//
// The mark geometry is the same as the header marks in
// src/layouts/StandardLayout.astro (agentsdlc: two rings; orbit: a tilted
// ellipse with a dot; agdr: a tag shape with a dot), on a 32 x 32 grid.
// Colors are set with classes in a <style> element, not with paint
// attributes, because a paint attribute cannot hold a token.

/** @typedef {'agentsdlc' | 'orbit' | 'agdr'} BrandKey */
/** @typedef {{ bg: string, surface: string, text: string, muted: string, rule: string, accent: string }} Palette */
/** @typedef {{ light: Palette, dark: Palette, fontDisplay: string, fontMono: string }} BrandTokens */

/** @type {Record<BrandKey, string>} */
const ACCENT_TOKEN = { agentsdlc: '--accent-agent-sdlc', orbit: '--accent-orbit', agdr: '--accent-agdr' };

/**
 * Read the values this module needs from the text of tokens.css.
 * @param {string} css
 * @param {BrandKey} key
 * @returns {BrandTokens}
 */
export function readBrandTokens(css, key) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, ' ');
  /** @param {string} name */
  const pair = name => {
    const m = text.match(new RegExp(`${name}\\s*:\\s*light-dark\\(\\s*([^,()]+?)\\s*,\\s*([^,()]+?)\\s*\\)`));
    if (!m) throw new Error(`tokens.css has no light-dark() value for ${name}`);
    return { light: m[1], dark: m[2] };
  };
  /** @param {string} name */
  const plain = name => {
    const m = text.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
    if (!m) throw new Error(`tokens.css has no value for ${name}`);
    return m[1].trim();
  };
  const names = /** @type {const} */ (['bg', 'surface', 'text', 'muted', 'rule']);
  /** @type {Record<string, { light: string, dark: string }>} */
  const pairs = {};
  for (const name of names) pairs[name] = pair(`--${name}`);
  pairs.accent = pair(ACCENT_TOKEN[key]);
  /** @param {'light' | 'dark'} mode @returns {Palette} */
  const palette = mode => ({
    bg: pairs.bg[mode],
    surface: pairs.surface[mode],
    text: pairs.text[mode],
    muted: pairs.muted[mode],
    rule: pairs.rule[mode],
    accent: pairs.accent[mode]
  });
  return { light: palette('light'), dark: palette('dark'), fontDisplay: plain('--font-display'), fontMono: plain('--font-mono') };
}

/**
 * The mark on a 32 x 32 grid. Strokes use class "g-line", dots use class
 * "g-dot". `weight` scales the stroke width (1 = the header mark).
 * @param {BrandKey} key
 * @param {number} weight
 */
export function markElements(key, weight) {
  /** @param {number} w */
  const sw = w => (w * weight).toFixed(2);
  if (key === 'orbit') {
    return `<ellipse class="g-line" cx="16" cy="16" rx="13" ry="7" stroke-width="${sw(2)}" transform="rotate(-18 16 16)"/><circle class="g-dot" cx="26.5" cy="9" r="${(2.1 * Math.sqrt(weight)).toFixed(2)}"/>`;
  }
  if (key === 'agdr') {
    return `<path class="g-line" d="M4 16 L13 6 H27 V26 H13 Z" stroke-width="${sw(1.8)}" stroke-linejoin="round"/><circle class="g-dot" cx="18" cy="16" r="${(2 * Math.sqrt(weight)).toFixed(2)}"/>`;
  }
  return `<circle class="g-line" cx="16" cy="16" r="12" stroke-width="${sw(2)}"/><circle class="g-line" cx="16" cy="16" r="6.5" stroke-width="${sw(1.4)}"/>`;
}

/**
 * Favicon: the mark in the page background color on a rounded tile in the
 * site accent. In dark mode the tile and the mark use the dark tokens.
 * `square` drops the rounded corners (for apple-touch-icon.png: iOS adds
 * its own mask).
 * @param {BrandKey} key
 * @param {BrandTokens} tokens
 * @param {{ square?: boolean }} [options]
 */
export function faviconSvg(key, tokens, options = {}) {
  const lt = tokens.light;
  const dk = tokens.dark;
  const style =
    `.tile{fill:${lt.accent}}.g-line{fill:none;stroke:${lt.bg}}.g-dot{fill:${lt.bg}}` +
    `@media (prefers-color-scheme: dark){.tile{fill:${dk.accent}}.g-line{stroke:${dk.bg}}.g-dot{fill:${dk.bg}}}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">` +
    `<style>${style}</style>` +
    `<rect class="tile" width="32" height="32" rx="${options.square ? 0 : 7}"/>` +
    `<g transform="translate(16 16) scale(0.74) translate(-16 -16)">${markElements(key, 1.45)}</g>` +
    `</svg>`
  );
}

/** @param {string} value */
function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Open Graph and Twitter Card image, 1200 x 630, light theme.
 * @param {BrandKey} key
 * @param {BrandTokens} tokens
 * @param {{ name: string, kicker: string, domain: string, family: string }} copy
 */
export function socialImageSvg(key, tokens, copy) {
  const p = tokens.light;
  const style =
    `.bg{fill:${p.bg}}.frame{fill:none;stroke:${p.rule}}.line{fill:none;stroke:${p.rule}}` +
    `.g-line{fill:none;stroke:${p.accent}}.g-dot{fill:${p.accent}}` +
    `.name{fill:${p.text};font-family:${tokens.fontDisplay};font-weight:700;font-size:120px}` +
    `.kicker{fill:${p.muted};font-family:${tokens.fontMono};font-size:34px}` +
    `.domain{fill:${p.accent};font-family:${tokens.fontMono};font-weight:700;font-size:34px}` +
    `.family{fill:${p.muted};font-family:${tokens.fontMono};font-size:28px}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">` +
    `<style>${style}</style>` +
    `<rect class="bg" width="1200" height="630"/>` +
    `<rect class="frame" x="40" y="40" width="1120" height="550" rx="8" stroke-width="2"/>` +
    `<g transform="translate(96 92) scale(3.4)">${markElements(key, 1)}</g>` +
    `<text class="name" x="96" y="340">${escapeXml(copy.name)}</text>` +
    `<text class="kicker" x="100" y="408">${escapeXml(copy.kicker)}</text>` +
    `<line class="line" x1="96" y1="470" x2="1104" y2="470" stroke-width="2"/>` +
    `<text class="domain" x="100" y="532">${escapeXml(copy.domain)}</text>` +
    `<text class="family" x="1104" y="532" text-anchor="end">${escapeXml(copy.family)}</text>` +
    `</svg>`
  );
}

/**
 * The text on the social image for one site.
 * @param {BrandKey} key
 * @param {{ name: string, kicker: string, canonicalUrl: string }} site
 */
export function socialImageCopy(key, site) {
  return {
    name: site.name,
    kicker: site.kicker,
    domain: site.canonicalUrl.replace(/^https?:\/\//, ''),
    family: key === 'agentsdlc' ? 'ORBIT · AgDR' : 'Part of Agent SDLC'
  };
}

/** Sizes in the favicon.ico file. */
export const ICO_SIZES = [16, 32, 48];
/** Size of apple-touch-icon.png. */
export const TOUCH_ICON_SIZE = 180;

/**
 * Pack PNG images into one ICO file (PNG-compressed entries, supported by
 * every current browser).
 * @param {{ size: number, png: Uint8Array }[]} images
 * @returns {Uint8Array}
 */
export function packIco(images) {
  const headerSize = 6 + 16 * images.length;
  const total = headerSize + images.reduce((sum, img) => sum + img.png.length, 0);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);
  let offset = headerSize;
  images.forEach((img, i) => {
    const entry = 6 + 16 * i;
    view.setUint8(entry, img.size >= 256 ? 0 : img.size);
    view.setUint8(entry + 1, img.size >= 256 ? 0 : img.size);
    view.setUint8(entry + 2, 0);
    view.setUint8(entry + 3, 0);
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, img.png.length, true);
    view.setUint32(entry + 12, offset, true);
    out.set(img.png, offset);
    offset += img.png.length;
  });
  return out;
}

// Enforces agent-sdlc-site#17: packages/design-system/tokens.css is the
// ONLY source of color for the standards sites. This script fails the
// build when either of these is true:
//
//   1. A file under apps/site holds a literal color value (#hex, rgb(),
//      rgba(), hsl(), or hsla()) instead of a design-system token.
//   2. A file under apps/site uses a CSS custom property, `var(--foo)`,
//      that tokens.css does not define.
//
// Run standalone with `node scripts/validate-design-tokens.mjs`, or as
// part of `npm run validate` (wired from the root package.json).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const siteDir = join(root, 'apps/site');
const tokensFile = join(root, 'packages/design-system/tokens.css');

const SCAN_EXTENSIONS = new Set(['.astro', '.ts', '.tsx', '.mjs', '.js', '.css']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.astro']);

/** @type {(dir: string) => string[]} */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      out.push(...walk(full));
    } else if (SCAN_EXTENSIONS.has(extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(siteDir);

// --- Check 1: no literal color value under apps/site ---------------------
//
// Only the actual CSS surface counts: a whole .css file, a <style> block
// inside an .astro file, or an inline style="" attribute. Scanning raw
// .ts/.js text for a "#xxx" pattern also matches things that are not
// colors at all -- a URL fragment (#120), a markdown anchor, a git SHA --
// so this check extracts CSS-context text first and scans only that.

/** @type {(file: string, content: string) => string[]} */
function cssRegionsOf(file, content) {
  if (extname(file) === '.css') return [content];
  const regions = [];
  for (const match of content.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) regions.push(match[1]);
  for (const match of content.matchAll(/\sstyle=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/gi)) {
    regions.push(match[1] ?? match[2] ?? match[3] ?? '');
  }
  return regions;
}

const LITERAL_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
const literalColorHits = [];
for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const region of cssRegionsOf(file, content)) {
    for (const match of region.matchAll(LITERAL_COLOR)) {
      literalColorHits.push(`${file.slice(root.length)}: ${match[0]}`);
    }
  }
}

// --- Check 2: every var(--foo) used under apps/site is defined in tokens.css ---

const tokensContent = readFileSync(tokensFile, 'utf8');
const definedTokens = new Set([...tokensContent.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map(m => m[1]));

const VAR_USE = /var\((--[a-z0-9-]+)/gi;
const undefinedTokenHits = [];
for (const file of files) {
  if (file === tokensFile) continue;
  const content = readFileSync(file, 'utf8');
  for (const match of content.matchAll(VAR_USE)) {
    if (!definedTokens.has(match[1])) {
      undefinedTokenHits.push(`${file.slice(root.length)}: var(${match[1]})`);
    }
  }
}

if (literalColorHits.length > 0) {
  console.error('Literal color values found under apps/site (must use a design-system token instead):');
  for (const hit of literalColorHits) console.error(`  ${hit}`);
}
if (undefinedTokenHits.length > 0) {
  console.error('CSS custom properties used under apps/site but not defined in packages/design-system/tokens.css:');
  for (const hit of undefinedTokenHits) console.error(`  ${hit}`);
}
if (literalColorHits.length > 0 || undefinedTokenHits.length > 0) {
  throw new Error(
    `design-token validation failed: ${literalColorHits.length} literal color(s), ${undefinedTokenHits.length} undefined token reference(s)`
  );
}

console.log(
  `design-token validation passed: 0 literal colors and 0 undefined token references across ${files.length} files under apps/site`
);

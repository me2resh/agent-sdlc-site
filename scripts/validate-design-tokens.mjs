// Enforces agent-sdlc-site#17: packages/design-system/tokens.css is the
// ONLY source of color for the standards sites. This script fails the
// build when any of these is true:
//
//   1. A file under apps/site (src and public), or a file under packages/
//      other than tokens.css, holds a literal color value.
//      See scripts/lib/design-token-scan.mjs for what counts and which
//      file types are scanned.
//   2. A file under apps/site uses a CSS custom property, `var(--foo)`,
//      that tokens.css does not define.
//   3. In tokens.css, the plain-hex fallback for browsers without
//      light-dark() does not equal the light-dark() pairs exactly.
//
// scripts/validate-design-tokens.selftest.mjs proves the scanner catches
// each escape route. Both run in `npm run validate`.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  scanText,
  definedCustomProperties,
  checkLightDarkFallback,
  SITE_EXTENSIONS,
  PACKAGE_EXTENSIONS
} from './lib/design-token-scan.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const tokensFile = join(root, 'packages/design-system/tokens.css');
const SKIP_DIRS = new Set(['node_modules', 'dist', '.astro']);

/** @type {(dir: string, extensions: Set<string>) => string[]} */
function walk(dir, extensions) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, extensions));
    else if (extensions.has(extname(entry))) out.push(full);
  }
  return out;
}

const siteFiles = walk(join(root, 'apps/site'), SITE_EXTENSIONS);
const packageFiles = walk(join(root, 'packages'), PACKAGE_EXTENSIONS).filter(file => file !== tokensFile);
const tokensCss = readFileSync(tokensFile, 'utf8');
const defined = definedCustomProperties(tokensCss);

const literalHits = [];
const undefinedHits = [];
for (const file of [...siteFiles, ...packageFiles]) {
  const { literals, varRefs } = scanText(file, readFileSync(file, 'utf8'));
  const rel = file.slice(root.length);
  for (const literal of literals) literalHits.push(`${rel}: ${literal}`);
  for (const name of varRefs) if (!defined.has(name)) undefinedHits.push(`${rel}: var(${name})`);
}
const fallbackProblems = checkLightDarkFallback(tokensCss);

if (literalHits.length > 0) {
  console.error('Literal color values found (use a design-system token from packages/design-system/tokens.css instead):');
  for (const hit of literalHits) console.error(`  ${hit}`);
}
if (undefinedHits.length > 0) {
  console.error('CSS custom properties used but not defined in packages/design-system/tokens.css:');
  for (const hit of undefinedHits) console.error(`  ${hit}`);
}
if (fallbackProblems.length > 0) {
  console.error('tokens.css: the older-browser fallback does not match the light-dark() tokens:');
  for (const problem of fallbackProblems) console.error(`  ${problem}`);
}
if (literalHits.length > 0 || undefinedHits.length > 0 || fallbackProblems.length > 0) {
  throw new Error(
    `design-token validation failed: ${literalHits.length} literal color(s), ${undefinedHits.length} undefined token reference(s), ${fallbackProblems.length} fallback mismatch(es)`
  );
}

console.log(
  `design-token validation passed: 0 literal colors and 0 undefined token references across ${siteFiles.length + packageFiles.length} files; light-dark() fallback matches`
);

// Generate the binary brand files for the three standards sites
// (agent-sdlc-site#15):
//
//   apps/site/src/assets/brand/<site>/favicon.ico           16, 32, 48 px
//   apps/site/src/assets/brand/<site>/apple-touch-icon.png  180 px
//   apps/site/src/assets/brand/<site>/og-image.png          1200 x 630
//   apps/site/src/assets/brand/manifest.json                source hashes
//
// Run it after you change a color token, a site mark, or a site name or
// kicker:
//
//   node scripts/generate-brand-assets.mjs
//
// The build fails until you do (apps/site/src/lib/brand-files.ts compares
// the hashes). Requirements: Node 23.6 or later (it imports
// apps/site/src/lib/site.ts with native type stripping), and `sharp`, which
// `npm ci` installs as a dependency of Astro. CI does not run this script;
// it only checks the manifest hash during the build.
//
// These PNG and ICO files are binary, so scripts/validate-design-tokens.mjs
// does not scan them. They are exempt assets: their colors come from
// tokens.css through apps/site/src/lib/brand.mjs, and the hash check keeps
// them in step with the tokens.
//
// Fonts: the social image uses the --font-display and --font-mono stacks
// from tokens.css. The rasterizer uses the first font in each stack that is
// installed. To get Spectral and Courier Prime without installing them,
// put the TTF files (Google Fonts, OFL) in a folder, write a fontconfig
// file that lists that folder, and run:
//
//   FONTCONFIG_FILE=/path/to/fonts.conf node scripts/generate-brand-assets.mjs

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  faviconSvg,
  ICO_SIZES,
  packIco,
  readBrandTokens,
  socialImageCopy,
  socialImageSvg,
  TOUCH_ICON_SIZE
} from '../apps/site/src/lib/brand.mjs';
import { sites } from '../apps/site/src/lib/site.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const tokensCss = readFileSync(join(root, 'packages/design-system/tokens.css'), 'utf8');
const outDir = join(root, 'apps/site/src/assets/brand');

/** @param {string} svg @param {number} width @param {number} height */
async function rasterize(svg, width, height) {
  // A high density keeps thin strokes sharp before the resize.
  return new Uint8Array(
    await sharp(Buffer.from(svg), { density: 384 }).resize(width, height).png({ compressionLevel: 9 }).toBuffer()
  );
}

/** @type {Record<string, { sourceHash: string }>} */
const manifest = {};
for (const key of /** @type {const} */ (['agentsdlc', 'orbit', 'agdr'])) {
  const tokens = readBrandTokens(tokensCss, key);
  const favicon = faviconSvg(key, tokens);
  const social = socialImageSvg(key, tokens, socialImageCopy(key, sites[key]));
  const dir = join(outDir, key);
  mkdirSync(dir, { recursive: true });

  const icoImages = [];
  for (const size of ICO_SIZES) icoImages.push({ size, png: await rasterize(favicon, size, size) });
  writeFileSync(join(dir, 'favicon.ico'), packIco(icoImages));
  writeFileSync(join(dir, 'apple-touch-icon.png'), await rasterize(faviconSvg(key, tokens, { square: true }), TOUCH_ICON_SIZE, TOUCH_ICON_SIZE));
  writeFileSync(join(dir, 'og-image.png'), await rasterize(social, 1200, 630));

  manifest[key] = { sourceHash: createHash('sha256').update(favicon).update('\n').update(social).digest('hex') };
  console.log(`generated brand assets for ${key}`);
}
writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

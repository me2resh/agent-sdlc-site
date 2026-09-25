// Build-time access to the brand assets (agent-sdlc-site#15).
//
// The SVG favicon is rendered from the design tokens on every build. The
// PNG and ICO fallbacks are binary files in src/assets/brand/<site>/, made
// by scripts/generate-brand-assets.mjs from the same SVG sources. The
// manifest there records a hash of those sources. When a token, a mark, or
// the site name changes and nobody runs the generator, the hash differs and
// the build fails, so a stale icon cannot ship.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import tokensCss from '@agent-sdlc/design-system/tokens.css?raw';
import { faviconSvg, readBrandTokens, socialImageCopy, socialImageSvg } from './brand.mjs';
import { sites, type SiteKey } from './site';

export function brandSources(key: SiteKey) {
  const tokens = readBrandTokens(tokensCss, key);
  return { favicon: faviconSvg(key, tokens), social: socialImageSvg(key, tokens, socialImageCopy(key, sites[key])) };
}

export function brandSourceHash(key: SiteKey): string {
  const { favicon, social } = brandSources(key);
  return createHash('sha256').update(favicon).update('\n').update(social).digest('hex');
}

function assetsDir(): string {
  // `astro build` runs in apps/site. Also accept the repository root.
  for (const dir of [join(process.cwd(), 'src/assets/brand'), join(process.cwd(), 'apps/site/src/assets/brand')]) {
    if (existsSync(join(dir, 'manifest.json'))) return dir;
  }
  throw new Error('src/assets/brand/manifest.json not found. Run: node scripts/generate-brand-assets.mjs');
}

export type BrandFile = 'favicon.ico' | 'apple-touch-icon.png' | 'og-image.png';

/** The bytes of one generated brand file. Throws when the file is stale. */
export function readBrandFile(key: SiteKey, file: BrandFile): Uint8Array<ArrayBuffer> {
  const dir = assetsDir();
  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as Record<string, { sourceHash?: string }>;
  const expected = brandSourceHash(key);
  if (manifest[key]?.sourceHash !== expected) {
    throw new Error(
      `Brand assets for "${key}" are out of date with the design tokens or the site registry. Run: node scripts/generate-brand-assets.mjs`
    );
  }
  return new Uint8Array(readFileSync(join(dir, key, file)));
}

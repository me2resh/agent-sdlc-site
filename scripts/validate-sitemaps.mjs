// Checks the built output of all three sites (agent-sdlc-site#15). It fails
// when:
//
//   - a built page is not in its site's sitemap.xml (and its canonical URL
//     does not point to a page on another site),
//   - a sitemap URL has no built page, or that page has a different
//     canonical URL,
//   - a canonical URL, og:url, or sitemap URL is not in the one URL form
//     (no trailing slash, except the site root),
//   - a canonical URL is not on a canonical domain from config/standards.ts
//     (for example a staging host),
//   - og:url differs from the canonical URL,
//   - a page has no favicon links, no og:image, or no Twitter Card tags, or
//     a file they name is missing from the build,
//   - robots.txt names a different sitemap,
//   - a redirect stub is in a sitemap.
//
// A redirect stub (design #18 section 4.3) is a page with both
// <meta name="robots" content="noindex"> and a meta refresh. The page checks
// skip stubs, and scripts/validate-redirects.mjs checks them. A page with
// only one of the two markers is a normal page, so it is still checked.
//
// Run by scripts/validate-site.mjs after `npm run build:all`.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'apps/site/dist');
const SITES = ['agentsdlc', 'orbit', 'agdr'];

// Canonical origins from the standards registry.
const registry = readFileSync(join(root, 'config/standards.ts'), 'utf8');
/** @type {Record<string, string>} */
const origins = {};
for (const key of SITES) {
  const m = registry.match(new RegExp(`\\b${key}\\s*:\\s*\\{[^}]*canonicalUrl\\s*:\\s*'([^']+)'`));
  if (!m) throw new Error(`config/standards.ts has no canonicalUrl for ${key}`);
  origins[key] = new URL(m[1]).origin;
}
const siteByOrigin = Object.fromEntries(Object.entries(origins).map(([key, origin]) => [origin, key]));

/** @type {string[]} */
const problems = [];

/** @param {string} url */
function isOneForm(url) {
  const { pathname } = new URL(url);
  return pathname === '/' || !pathname.endsWith('/');
}

/** Built page path ("/", "/concepts") -> file in dist/<site>. */
function pageFile(key, path) {
  return path === '/' ? join(dist, key, 'index.html') : join(dist, key, path.slice(1), 'index.html');
}

/** @param {string} dir @returns {string[]} */
function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== '_astro') out.push(...htmlFiles(full));
    } else if (entry === 'index.html') out.push(full);
  }
  return out;
}

/** @param {string} html @param {RegExp} re */
function all(html, re) {
  return [...html.matchAll(re)].map(m => m[1]);
}
/** @param {string} html @param {string} attr @param {string} name */
function meta(html, attr, name) {
  return all(html, new RegExp(`<meta ${attr}="${name.replace(/[:.]/g, '\\$&')}" content="([^"]*)"`, 'g'));
}

/** @type {Record<string, Set<string>>} */
const sitemaps = {};
for (const key of SITES) {
  const file = join(dist, key, 'sitemap.xml');
  if (!existsSync(file)) {
    problems.push(`${key}: sitemap.xml is missing`);
    sitemaps[key] = new Set();
    continue;
  }
  const locs = all(readFileSync(file, 'utf8'), /<loc>([^<]*)<\/loc>/g);
  sitemaps[key] = new Set(locs);
  if (locs.length !== sitemaps[key].size) problems.push(`${key}: sitemap.xml lists a URL twice`);
}

let pageCount = 0;
let stubCount = 0;
for (const key of SITES) {
  const origin = origins[key];
  const siteDir = join(dist, key);
  if (!existsSync(siteDir)) {
    problems.push(`${key}: no build output at ${relative(root, siteDir)}`);
    continue;
  }

  // 1. Every sitemap URL is on this site, in the one form, and has a page
  //    whose canonical URL is the same URL.
  for (const loc of sitemaps[key]) {
    const url = new URL(loc);
    if (url.origin !== origin) problems.push(`${key}: sitemap URL ${loc} is not on ${origin}`);
    if (!isOneForm(loc)) problems.push(`${key}: sitemap URL ${loc} has a trailing slash`);
    const file = pageFile(key, url.pathname);
    if (!existsSync(file)) {
      problems.push(`${key}: sitemap URL ${loc} has no built page`);
      continue;
    }
    const canonical = all(readFileSync(file, 'utf8'), /<link rel="canonical" href="([^"]*)"/g)[0];
    if (canonical !== loc) problems.push(`${key}: sitemap URL ${loc} has canonical ${canonical ?? '(none)'}`);
  }

  // 2. Every built page has correct head metadata, and is in a sitemap.
  for (const file of htmlFiles(siteDir)) {
    const rel = relative(siteDir, file).split(sep).join('/');
    const path = rel === 'index.html' ? '/' : `/${rel.replace(/\/index\.html$/, '')}`;
    const where = `${key}${path}`;
    const html = readFileSync(file, 'utf8');

    if (/<meta name="robots" content="noindex">/.test(html) && /<meta http-equiv="refresh"/.test(html)) {
      stubCount++;
      if (sitemaps[key].has(`${origin}${path}`)) problems.push(`${where}: redirect stub is in ${key}/sitemap.xml`);
      continue;
    }
    pageCount++;

    const canonicals = all(html, /<link rel="canonical" href="([^"]*)"/g);
    if (canonicals.length !== 1) {
      problems.push(`${where}: has ${canonicals.length} canonical links, expected 1`);
      continue;
    }
    const canonical = canonicals[0];
    const curl = new URL(canonical);
    const owner = siteByOrigin[curl.origin];
    if (!owner) problems.push(`${where}: canonical ${canonical} is not on a canonical domain from config/standards.ts`);
    if (!isOneForm(canonical)) problems.push(`${where}: canonical ${canonical} has a trailing slash`);
    if (curl.pathname !== path) problems.push(`${where}: canonical ${canonical} names a different path`);
    const ogUrl = meta(html, 'property', 'og:url');
    if (ogUrl.length !== 1 || ogUrl[0] !== canonical) problems.push(`${where}: og:url ${ogUrl.join(', ') || '(none)'} differs from canonical ${canonical}`);

    if (owner === key) {
      if (!sitemaps[key].has(canonical)) problems.push(`${where}: built page is missing from ${key}/sitemap.xml`);
    } else if (owner) {
      // A copy of a page from another site: the owner lists it.
      if (!sitemaps[owner].has(canonical)) problems.push(`${where}: canonical ${canonical} is not in ${owner}/sitemap.xml`);
      if (!existsSync(pageFile(owner, curl.pathname))) problems.push(`${where}: canonical ${canonical} has no built page on ${owner}`);
    }

    // Favicons, Open Graph image, and Twitter Card.
    for (const [rel, href] of [['icon', '/favicon.ico'], ['icon', '/favicon.svg'], ['apple-touch-icon', '/apple-touch-icon.png']]) {
      if (!new RegExp(`<link rel="${rel}" href="${href.replace(/\./g, '\\.')}"`).test(html)) problems.push(`${where}: no <link rel="${rel}" href="${href}">`);
    }
    const ogImage = meta(html, 'property', 'og:image');
    if (ogImage.length !== 1 || ogImage[0] !== `${origin}/og-image.png`) problems.push(`${where}: og:image is ${ogImage.join(', ') || '(none)'}, expected ${origin}/og-image.png`);
    if (meta(html, 'name', 'twitter:card')[0] !== 'summary_large_image') problems.push(`${where}: no twitter:card summary_large_image`);
    const twitterImage = meta(html, 'name', 'twitter:image');
    if (twitterImage[0] !== ogImage[0]) problems.push(`${where}: twitter:image differs from og:image`);
  }

  for (const asset of ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'og-image.png']) {
    const file = join(siteDir, asset);
    if (!existsSync(file) || statSync(file).size === 0) problems.push(`${key}: /${asset} is missing from the build`);
  }
  const robots = existsSync(join(siteDir, 'robots.txt')) ? readFileSync(join(siteDir, 'robots.txt'), 'utf8') : '';
  if (!robots.includes(`Sitemap: ${origin}/sitemap.xml\n`)) problems.push(`${key}: robots.txt does not name ${origin}/sitemap.xml`);
}

if (problems.length > 0) {
  console.error('Sitemap and canonical URL validation failed:');
  for (const problem of problems) console.error(`  ${problem}`);
  throw new Error(`sitemap validation failed: ${problems.length} problem(s)`);
}
const urlCount = SITES.reduce((sum, key) => sum + sitemaps[key].size, 0);
console.log(
  `sitemap validation passed: ${pageCount} built pages and ${urlCount} sitemap URLs agree on 3 sites; ${stubCount} redirect stubs are skipped and not in a sitemap; canonical URLs use the registry domains and no trailing slash; favicon, og:image, and Twitter Card tags are present`
);

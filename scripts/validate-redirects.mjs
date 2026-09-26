// Checks the redirect map in config/redirects.ts against the builds and the
// URL inventory (agent-sdlc-site#31, design #18 section 4.2). Run by
// `npm run validate` after `npm run build:all`.
//
// It fails when:
//   - a key or a target has a trailing slash (except the root "/"),
//   - a key is listed twice, or a key is also a file in the same build,
//   - an internal target is not a file in the same build,
//   - an external target is not on one of the three canonical hosts, or is
//     not an https URL,
//   - an external target is not a built file on its site, and is not in
//     pendingTargets (config/redirects.ts). A pending target that is built,
//     or that no entry uses, also fails, so the list stays current,
//   - a 301 has a Cache-Control other than max-age=3600, or a 302 has a
//     Cache-Control other than no-store,
//   - a target is also a key (a chain or a loop), on the same site or on
//     the site of an external target. The edge slash 301 counts as a hop,
//     so a target with a trailing slash is a chain too,
//   - a code is not 301 or 302,
//   - a URL in config/url-inventory/<site>.txt is not a built file and not
//     a key,
//   - dist/<site>/_redirects.json differs from the map,
//   - an HTML key (a key that is not a file path for the edge) has no stub
//     page in the build, or its stub is not noindex, or the meta refresh,
//     the canonical link, or the visible link of the stub is not the
//     absolute target of the entry,
//   - a build contains a stub (a page with a meta refresh) at a path that
//     is not an HTML key of that site.
//
// Node strips the TypeScript types of the imported config modules.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { builtUrls, urlForFile } from './generate-url-inventory.mjs';
import { cacheControl, htmlRedirects, pendingTargets, redirects, redirectsDocument } from '../config/redirects.ts';

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

/** @param {string} path */
const oneForm = path => path === '/' || !path.endsWith('/');

/** @type {Record<string, Set<string>>} */
const built = {};
/** @type {Record<string, Set<string>>} */
const keys = {};
for (const site of SITES) {
  const siteDir = join(dist, site);
  if (!existsSync(siteDir)) throw new Error(`${site}: no build output at ${relative(root, siteDir)}. Run npm run build:all first.`);
  built[site] = new Set(builtUrls(siteDir));
  keys[site] = new Set();
  for (const entry of redirects[site] ?? []) {
    if (keys[site].has(entry.from)) problems.push(`${site}${entry.from}: key is listed twice`);
    keys[site].add(entry.from);
  }
}

/** @type {Record<string, Set<string>>} */
const htmlKeys = {};
for (const site of SITES) htmlKeys[site] = new Set(htmlRedirects(site).map(entry => entry.from));

let entryCount = 0;
/** @type {Set<string>} */
const usedPending = new Set();
for (const site of SITES) {
  for (const { from, to, code } of redirects[site] ?? []) {
    entryCount++;
    const where = `${site}${from}`;
    if (!from.startsWith('/') || !oneForm(from)) problems.push(`${where}: key is not a path in the one URL form`);
    // An HTML key has its stub at the key path. The stub checks below cover it.
    if (built[site].has(from) && !htmlKeys[site].has(from)) problems.push(`${where}: key is also a file in the ${site} build`);
    if (code !== 301 && code !== 302) problems.push(`${where}: code ${code} is not 301 or 302`);

    let targetSite = site;
    let targetPath = to;
    if (to.startsWith('/')) {
      if (to.startsWith('//')) problems.push(`${where}: target ${to} is protocol-relative`);
      else if (!built[site].has(to.replace(/#.*$/, ''))) problems.push(`${where}: internal target ${to} is not a file in the ${site} build`);
    } else {
      let url;
      try {
        url = new URL(to);
      } catch {
        problems.push(`${where}: target ${to} is not a path or a URL`);
        continue;
      }
      targetSite = siteByOrigin[url.origin];
      targetPath = url.pathname;
      if (url.protocol !== 'https:' || !targetSite) problems.push(`${where}: target ${to} is not on a canonical host (${Object.values(origins).join(', ')})`);
      if (url.search) problems.push(`${where}: target ${to} has a query string`);
      // The target must exist on its site, or be a listed pending target.
      const targetUrl = `${url.origin}${url.pathname}`;
      if (targetSite && !built[targetSite].has(url.pathname) && !keys[targetSite].has(url.pathname) && !pendingTargets[targetUrl]) {
        problems.push(`${where}: external target ${to} is not a built file on ${targetSite}, and pendingTargets in config/redirects.ts does not list it`);
      }
      if (pendingTargets[targetUrl]) usedPending.add(targetUrl);
    }
    const expectedCache = code === 301 ? 'max-age=3600' : 'no-store';
    if (cacheControl[code] !== expectedCache) problems.push(`${where}: code ${code} has Cache-Control ${cacheControl[code]}, expected ${expectedCache}`);
    if (!oneForm(targetPath)) problems.push(`${where}: target ${to} has a trailing slash, so the edge slash 301 adds a second hop`);
    if (targetSite && keys[targetSite]?.has(targetPath.replace(/#.*$/, ''))) problems.push(`${where}: target ${to} is also a redirect key (a chain or a loop)`);
  }
}

// The pending-target list stays current: each URL is used and not built yet.
for (const [url, pr] of Object.entries(pendingTargets)) {
  const parsed = new URL(url);
  const site = siteByOrigin[parsed.origin];
  if (!site) problems.push(`pendingTargets: ${url} is not on a canonical host`);
  else if (built[site].has(parsed.pathname)) problems.push(`pendingTargets: ${url} is now built on ${site}. Remove it from the list (added by ${pr}).`);
  if (!usedPending.has(url)) problems.push(`pendingTargets: ${url} is the target of no redirect entry. Remove it from the list.`);
}

// Every inventory URL still works: a built file or a redirect key.
let inventoryCount = 0;
for (const site of SITES) {
  const file = join(root, 'config/url-inventory', `${site}.txt`);
  if (!existsSync(file)) {
    problems.push(`${site}: ${relative(root, file)} is missing`);
    continue;
  }
  for (const url of readFileSync(file, 'utf8').split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'))) {
    inventoryCount++;
    if (!built[site].has(url) && !keys[site].has(url)) problems.push(`${site}${url}: inventory URL is not a built file and not a redirect key`);
  }
}

// The build wrote the current map.
for (const site of SITES) {
  const file = join(dist, site, '_redirects.json');
  const expected = `${JSON.stringify(redirectsDocument(site), null, 2)}\n`;
  if (!existsSync(file)) problems.push(`${site}: _redirects.json is missing from the build`);
  else if (readFileSync(file, 'utf8') !== expected) problems.push(`${site}: _redirects.json differs from config/redirects.ts. Build again.`);
}

// Each HTML key has one stub that names the absolute target of its entry,
// and each stub in a build belongs to an HTML key (design #18 section 4.3).
/** @param {string} value */
const unescapeHtml = value => value.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
/** @param {string} html @param {RegExp} re */
const matches = (html, re) => [...html.matchAll(re)].map(m => unescapeHtml(m[1]));
/** @param {string} dir @returns {string[]} */
function pageFiles(dir) {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return entry === '_astro' ? [] : pageFiles(full);
    return entry.endsWith('.html') ? [full] : [];
  });
}
let stubCount = 0;
for (const site of SITES) {
  const siteDir = join(dist, site);
  for (const { from, to } of htmlRedirects(site)) {
    const where = `${site}${from}`;
    const file = join(siteDir, from.slice(1), 'index.html');
    if (!existsSync(file)) {
      problems.push(`${where}: HTML key has no stub page at ${relative(root, file)}`);
      continue;
    }
    const html = readFileSync(file, 'utf8');
    const target = new URL(to, origins[site]).href;
    const refresh = matches(html, /<meta http-equiv="refresh" content="0; url=([^"]*)">/g);
    const canonical = matches(html, /<link rel="canonical" href="([^"]*)">/g);
    const links = matches(html, /<a href="([^"]*)">/g);
    if (refresh.length !== 1 || refresh[0] !== target) problems.push(`${where}: stub meta refresh is ${refresh.join(', ') || '(none)'}, expected ${target}`);
    if (canonical.length !== 1 || canonical[0] !== target) problems.push(`${where}: stub canonical link is ${canonical.join(', ') || '(none)'}, expected ${target}`);
    if (links.length !== 1 || links[0] !== target) problems.push(`${where}: stub visible link is ${links.join(', ') || '(none)'}, expected ${target}`);
    if (!/<meta name="robots" content="noindex">/.test(html)) problems.push(`${where}: stub has no <meta name="robots" content="noindex">`);
  }
  for (const file of pageFiles(siteDir)) {
    if (!/<meta http-equiv="refresh"/i.test(readFileSync(file, 'utf8'))) continue;
    stubCount++;
    const url = urlForFile(relative(siteDir, file));
    if (!htmlKeys[site].has(url)) problems.push(`${site}${url}: the build contains a stub, but the map has no HTML key for this path`);
  }
}

if (problems.length > 0) {
  console.error('Redirect map validation failed:');
  for (const problem of problems) console.error(`  ${problem}`);
  throw new Error(`redirect validation failed: ${problems.length} problem(s)`);
}
console.log(`redirect validation passed: ${entryCount} redirect entries on 3 sites have no trailing slash, no chain, and allowed hosts; all ${inventoryCount} inventory URLs are built files or redirect keys; ${stubCount} HTML stubs match their HTML keys and targets`);

// Checks each site build against the route registry (agent-sdlc-site#31,
// design #18 PR 1). Run by `npm run validate` after `npm run build:all`.
//
// It fails when:
//   - a site build contains a file that the registry does not assign to
//     that site (for example an ORBIT page in the AgDR build),
//   - the registry assigns a page or file to a site, and the build of that
//     site does not contain it,
//   - a registry path is not in the one URL form, or is listed twice,
//   - a registry source file does not exist, or a file under src/routes/
//     is in no registry entry,
//   - a canonical owner does not build the page,
//   - an internal link in a built page goes to no file and no redirect key
//     of the same site.
//
// Node strips the TypeScript types of the imported registry modules.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { builtUrls } from './generate-url-inventory.mjs';
import { routes } from '../apps/site/src/lib/routes.ts';
import { redirects } from '../config/redirects.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const siteRoot = join(root, 'apps/site');
const dist = join(siteRoot, 'dist');
const SITES = ['agentsdlc', 'orbit', 'agdr'];

/** @type {string[]} */
const problems = [];

/** @param {string} source */
function sourceFile(source) {
  if (source.startsWith('public/')) return join(siteRoot, source);
  if (source.startsWith('config/')) return join(root, source);
  return join(siteRoot, 'src', source);
}

/** @param {string} dir @returns {string[]} */
function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? filesUnder(full) : [full];
  });
}

// 1. Registry shape.
const usedSources = new Set();
for (const site of SITES) {
  const list = routes[site];
  if (!Array.isArray(list)) {
    problems.push(`${site}: the route registry has no route list`);
    continue;
  }
  const seen = new Set();
  for (const route of list) {
    const where = `${site}${route.path}`;
    if (seen.has(route.path)) problems.push(`${where}: listed twice in the route registry`);
    seen.add(route.path);
    if (!route.path.startsWith('/') || (route.path.length > 1 && route.path.endsWith('/'))) problems.push(`${where}: registry path is not in the one URL form (no trailing slash, except "/")`);
    if (!existsSync(sourceFile(route.source))) problems.push(`${where}: registry source ${route.source} does not exist`);
    usedSources.add(route.source);
    if (route.canonicalOwner) {
      if (!SITES.includes(route.canonicalOwner)) problems.push(`${where}: unknown canonical owner ${route.canonicalOwner}`);
      else if (!routes[route.canonicalOwner].some(other => other.path === route.path)) problems.push(`${where}: canonical owner ${route.canonicalOwner} does not build ${route.path}`);
    }
  }
}
for (const file of filesUnder(join(siteRoot, 'src/routes'))) {
  const source = relative(join(siteRoot, 'src'), file).split(sep).join('/');
  if (!usedSources.has(source)) problems.push(`${source}: no route registry entry injects this file`);
}

// 2. Each build equals its registry list, in the two directions.
/** @type {Record<string, Set<string>>} */
const built = {};
for (const site of SITES) {
  const siteDir = join(dist, site);
  if (!existsSync(siteDir)) {
    problems.push(`${site}: no build output at ${relative(root, siteDir)}. Run npm run build:all first.`);
    continue;
  }
  built[site] = new Set(builtUrls(siteDir));
  const registered = new Map((routes[site] ?? []).map(route => [route.path, route]));
  for (const url of built[site]) {
    if (!registered.has(url)) problems.push(`${site}${url}: the build contains this file, but the route registry does not assign it to ${site}`);
  }
  for (const [path, route] of registered) {
    const file = route.kind === 'page' ? (path === '/' ? join(siteDir, 'index.html') : join(siteDir, path.slice(1), 'index.html')) : join(siteDir, path.slice(1));
    if (!existsSync(file)) problems.push(`${site}${path}: the route registry assigns this ${route.kind} to ${site}, but the build does not contain ${relative(siteDir, file)}`);
  }
}

// 3. Internal links resolve to a built file or a redirect key of the same site.
let linkCount = 0;
for (const site of SITES) {
  if (!built[site]) continue;
  const keys = new Set((redirects[site] ?? []).map(entry => entry.from));
  for (const file of filesUnder(join(dist, site)).filter(f => f.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8');
    const page = `/${relative(join(dist, site), file).split(sep).join('/')}`;
    for (const [, href] of html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
      if (href.startsWith('//') || href.startsWith('/_astro/')) continue;
      let path = href.replace(/[#?].*$/, '') || '/';
      while (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
      linkCount++;
      if (!built[site].has(path) && !keys.has(path)) problems.push(`${site}${page}: link ${href} goes to no built file and no redirect key`);
    }
  }
}

if (problems.length > 0) {
  console.error('Route registry validation failed:');
  for (const problem of problems) console.error(`  ${problem}`);
  throw new Error(`route validation failed: ${problems.length} problem(s)`);
}
const counts = SITES.map(site => `${site} ${built[site].size}`).join(', ');
console.log(`route validation passed: each build equals its route registry list (${counts} files); ${linkCount} internal links resolve`);

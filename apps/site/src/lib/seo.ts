// Canonical URLs, sitemap routes, and social-preview metadata for the three
// standards sites (agent-sdlc-site#15).
//
// One URL form: no trailing slash, except the site root "/". The canonical
// tag, og:url, and sitemap.xml all come from this module, so they cannot
// disagree. scripts/validate-sitemaps.mjs checks the built HTML against the
// built sitemap.xml for all three sites.
//
// The route list comes from the route registry in ./routes (#31). This
// module has no route list of its own.
import { sites, type SiteKey } from './site';
import { routes } from './routes';

/** The path in the one URL form: no trailing slash, except "/". */
export function canonicalPath(pathname: string): string {
  let path = pathname.replace(/\/index\.html$/, '/');
  if (!path.startsWith('/')) path = `/${path}`;
  while (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path;
}

function ownersOf(key: SiteKey): Readonly<Record<string, SiteKey>> {
  const owners: Record<string, SiteKey> = {};
  for (const route of routes[key]) if (route.canonicalOwner && route.canonicalOwner !== key) owners[route.path] = route.canonicalOwner;
  return owners;
}

/**
 * Pages that a build contains, but whose content belongs to a different
 * site. The canonical URL of such a page points to the owning site, so a
 * search engine indexes one copy only. The sitemap of the build that
 * contains the copy does not list it; the owner's sitemap does.
 *
 * We use a cross-domain canonical and not `noindex`: the canonical moves
 * the ranking signals to the one real page, and `noindex` would only drop
 * the copy. Do not combine the two.
 *
 * Since #31 a site builds only the pages that the route registry assigns to
 * it. The one remaining entry is the short /interoperability page on ORBIT
 * and AgDR (#25). It goes away when that page becomes a 301 (design #18, Q12).
 */
export const canonicalOwner: Record<SiteKey, Readonly<Record<string, SiteKey>>> = {
  agentsdlc: ownersOf('agentsdlc'),
  orbit: ownersOf('orbit'),
  agdr: ownersOf('agdr')
};

/** The canonical URL of a page, on the domain from the standards registry. */
export function canonicalUrl(key: SiteKey, pathname: string): string {
  const path = canonicalPath(pathname);
  const owner = canonicalOwner[key][path] ?? key;
  return `${sites[owner].canonicalUrl}${path}`;
}

function sitemapOf(key: SiteKey): readonly string[] {
  return routes[key].filter(route => route.kind === 'page' && route.sitemap !== false && !canonicalOwner[key][route.path]).map(route => route.path);
}

/** The pages each site lists in its sitemap.xml, in the one URL form. */
export const sitemapRoutes: Record<SiteKey, readonly string[]> = {
  agentsdlc: sitemapOf('agentsdlc'),
  orbit: sitemapOf('orbit'),
  agdr: sitemapOf('agdr')
};

/** Social preview image. src/pages/og-image.png.ts serves it for each site. */
export const socialImage = { path: '/og-image.png', width: 1200, height: 630, type: 'image/png' } as const;

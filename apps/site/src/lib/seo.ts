// Canonical URLs, sitemap routes, and social-preview metadata for the three
// standards sites (agent-sdlc-site#15).
//
// One URL form: no trailing slash, except the site root "/". The canonical
// tag, og:url, and sitemap.xml all come from this module, so they cannot
// disagree. scripts/validate-sitemaps.mjs checks the built HTML against the
// built sitemap.xml for all three sites.
import { sites, type SiteKey } from './site';

/** The path in the one URL form: no trailing slash, except "/". */
export function canonicalPath(pathname: string): string {
  let path = pathname.replace(/\/index\.html$/, '/');
  if (!path.startsWith('/')) path = `/${path}`;
  while (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path;
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
 */
export const canonicalOwner: Record<SiteKey, Readonly<Record<string, SiteKey>>> = {
  agentsdlc: {
    '/adopter-guide': 'orbit',
    '/concepts': 'orbit',
    '/quick-start': 'orbit',
    '/specification': 'orbit'
  },
  orbit: {
    // agentsdlc.ai is the home of the interoperability profile (#25).
    '/interoperability': 'agentsdlc',
    '/standards': 'agentsdlc'
  },
  agdr: {
    '/adopter-guide': 'orbit',
    '/interoperability': 'agentsdlc',
    '/standards': 'agentsdlc'
  }
};

/** The canonical URL of a page, on the domain from the standards registry. */
export function canonicalUrl(key: SiteKey, pathname: string): string {
  const path = canonicalPath(pathname);
  const owner = canonicalOwner[key][path] ?? key;
  return `${sites[owner].canonicalUrl}${path}`;
}

/** The pages each site lists in its sitemap.xml, in the one URL form. */
export const sitemapRoutes: Record<SiteKey, readonly string[]> = {
  agentsdlc: ['/', '/standards', '/interoperability', '/governance', '/implementations', '/contribute'],
  orbit: [
    '/',
    '/concepts',
    '/quick-start',
    '/specification',
    '/schemas',
    '/schemas/plan',
    '/schemas/project-snapshot',
    '/schemas/reconciliation',
    '/schemas/execution-slice',
    '/adopter-guide',
    '/reconciliation',
    '/execution-slices',
    '/examples',
    '/examples/plan/minimal',
    '/examples/plan/customer-sso',
    '/examples/project-snapshot/minimal',
    '/examples/project-snapshot/customer-platform',
    '/examples/reconciliation/minimal',
    '/examples/reconciliation/partial-verification',
    '/examples/execution-slice/minimal',
    '/examples/execution-slice/customer-sso',
    '/conformance',
    '/changelog',
    '/contribute'
  ],
  agdr: [
    '/',
    '/concepts',
    '/quick-start',
    '/specification',
    '/schema',
    '/examples',
    '/integrations',
    '/conformance',
    '/related-standards',
    '/changelog'
  ]
};

/** Social preview image. src/pages/og-image.png.ts serves it for each site. */
export const socialImage = { path: '/og-image.png', width: 1200, height: 630, type: 'image/png' } as const;

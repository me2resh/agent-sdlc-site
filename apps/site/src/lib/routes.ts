// Route registry: the one list of the pages and files that each site builds
// (agent-sdlc-site#31, design #18 section 7.2, PR 1).
//
// Rules:
//   - A site build contains a page or file only when this registry assigns
//     it to that site. scripts/validate-routes.mjs compares each build with
//     this list, in the two directions.
//   - seo.ts reads this list for sitemap.xml and for the canonical owner of
//     a page. There is no second route list.
//   - Paths use the one URL form: no trailing slash, except the root "/".
//
// How a route gets built:
//   - `source` names the file that renders the route (see Route.source).
//   - A source under `routes/` is not a file-system route. The site-routes
//     integration in astro.config.mjs injects it only for the sites that
//     list it here.
//   - A dynamic source under `pages/` (for example `pages/[slug].astro`)
//     reads this list in getStaticPaths().
//   - A static source under `pages/` is built for every site, so every site
//     must list it.
//
// This module has no runtime import, so the Node validators can import it.
import type { SiteKey } from './site';

/** The section of a page. The 9 standard sections come from design #18 section 1.1. */
export type Section =
  | 'overview'
  | 'quick-start'
  | 'specification'
  | 'schema'
  | 'examples'
  | 'conformance'
  | 'implementations'
  | 'changelog'
  | 'governance'
  /** Files for browsers, crawlers, and the deploy, not content. */
  | 'site';

export interface Route {
  /** The URL path, in the one URL form. */
  readonly path: string;
  /** `page` is an HTML page (`<path>/index.html`). `file` is any other file. */
  readonly kind: 'page' | 'file';
  readonly section: Section;
  /**
   * The file that renders the route: a path under apps/site/src/ (`pages/...`
   * or `routes/...`), a static file under apps/site/public/ (`public/...`),
   * or the repository file that a generated file comes from (`config/...`).
   */
  readonly source: string;
  /**
   * Another site owns the content of this page. The canonical URL points to
   * that site, and this site's sitemap does not list the page.
   */
  readonly canonicalOwner?: SiteKey;
  /** false: the page is not in sitemap.xml. Default true for a page. */
  readonly sitemap?: boolean;
}

const page = (path: string, section: Section, source: string, extra: Partial<Route> = {}): Route => ({ path, kind: 'page', section, source, ...extra });
const file = (path: string, source: string, section: Section = 'site'): Route => ({ path, kind: 'file', section, source });

/** Files that every site builds. */
const siteFiles: readonly Route[] = [
  file('/404.html', 'public/404.html'),
  file('/apple-touch-icon.png', 'pages/apple-touch-icon.png.ts'),
  file('/favicon.ico', 'pages/favicon.ico.ts'),
  file('/favicon.svg', 'pages/favicon.svg.ts'),
  file('/llms.txt', 'pages/llms.txt.ts'),
  file('/og-image.png', 'pages/og-image.png.ts'),
  file('/robots.txt', 'pages/robots.txt.ts'),
  file('/sitemap.xml', 'pages/sitemap.xml.ts'),
  // The redirect map for the edge (design #18 section 4.3). The site-routes
  // integration writes it from config/redirects.ts after the build.
  file('/_redirects.json', 'config/redirects.ts')
];

// The short interoperability page on ORBIT and AgDR. agentsdlc.ai owns the
// profile (#25, PR #28). The page stays until the edge layer is live (Q12).
const interoperabilityShort = page('/interoperability', 'overview', 'pages/interoperability.astro', { canonicalOwner: 'agentsdlc' });

const orbitExamples: readonly [string, readonly string[]][] = [
  ['plan', ['minimal', 'customer-sso']],
  ['project-snapshot', ['minimal', 'customer-platform']],
  ['reconciliation', ['minimal', 'partial-verification']],
  ['execution-slice', ['minimal', 'customer-sso']]
];

const orbitSchemaRecords = ['plan', 'project-snapshot', 'reconciliation', 'execution-slice'] as const;

/** Pages and files of each site. The sitemap uses this order. */
export const routes: Record<SiteKey, readonly Route[]> = {
  agentsdlc: [
    page('/', 'overview', 'pages/index.astro'),
    page('/standards', 'overview', 'routes/standards.astro'),
    page('/interoperability', 'overview', 'pages/interoperability.astro'),
    page('/governance', 'governance', 'pages/[slug].astro'),
    page('/implementations', 'implementations', 'pages/[slug].astro'),
    page('/contribute', 'governance', 'pages/[slug].astro'),
    ...siteFiles
  ],
  orbit: [
    page('/', 'overview', 'pages/index.astro'),
    page('/concepts', 'overview', 'routes/concepts.astro'),
    page('/quick-start', 'quick-start', 'routes/quick-start.astro'),
    page('/specification', 'specification', 'routes/specification.astro'),
    page('/schemas', 'schema', 'pages/[slug].astro'),
    ...orbitSchemaRecords.map(record => page(`/schemas/${record}`, 'schema', 'pages/schemas/[resource].astro')),
    page('/adopter-guide', 'quick-start', 'routes/adopter-guide.astro'),
    page('/reconciliation', 'overview', 'pages/[slug].astro'),
    page('/execution-slices', 'overview', 'pages/[slug].astro'),
    page('/examples', 'examples', 'pages/[slug].astro'),
    ...orbitExamples.flatMap(([record, slugs]) => slugs.map(slug => page(`/examples/${record}/${slug}`, 'examples', 'pages/examples/[resource]/[example].astro'))),
    page('/conformance', 'conformance', 'pages/[slug].astro'),
    page('/changelog', 'changelog', 'pages/[slug].astro'),
    page('/contribute', 'governance', 'pages/[slug].astro'),
    interoperabilityShort,
    ...orbitExamples.flatMap(([record, slugs]) => slugs.map(slug => file(`/examples/${record}/${slug}.json`, 'pages/examples/[resource]/[example].json.ts', 'examples'))),
    // Legacy schema file names. Design #18 PR 7 moves them to the $id URLs.
    ...orbitSchemaRecords.flatMap(record => [
      file(`/schema/${record === 'plan' ? 'orbit-plan' : record}.json`, 'pages/schema/[name].json.ts', 'schema'),
      file(`/schema/${record}.schema.json`, 'pages/schema/[name].json.ts', 'schema')
    ]),
    ...siteFiles
  ],
  agdr: [
    page('/', 'overview', 'pages/index.astro'),
    page('/concepts', 'overview', 'routes/concepts.astro'),
    page('/quick-start', 'quick-start', 'routes/quick-start.astro'),
    page('/specification', 'specification', 'routes/specification.astro'),
    page('/schema', 'schema', 'pages/[slug].astro'),
    page('/examples', 'examples', 'pages/[slug].astro'),
    page('/integrations', 'implementations', 'pages/[slug].astro'),
    page('/conformance', 'conformance', 'pages/[slug].astro'),
    page('/related-standards', 'overview', 'pages/[slug].astro'),
    page('/changelog', 'changelog', 'pages/[slug].astro'),
    interoperabilityShort,
    file('/agdr-spec.md', 'routes/agdr-spec.md.ts', 'specification'),
    file('/changelog.md', 'routes/changelog.md.ts', 'changelog'),
    file('/schema/agdr.schema.json', 'routes/schema/agdr.schema.json.ts', 'schema'),
    file('/schema/agdr-json.schema.json', 'routes/schema/agdr-json.schema.json.ts', 'schema'),
    ...siteFiles
  ]
};

/** The routes of one site. */
export function siteRoutes(site: SiteKey): readonly Route[] {
  return routes[site];
}

/** The routes of one site that one source file renders. */
export function routesFrom(site: SiteKey, source: string): readonly Route[] {
  return routes[site].filter(route => route.source === source);
}

/** True when the site builds the path. */
export function hasRoute(site: SiteKey, path: string): boolean {
  return routes[site].some(route => route.path === path);
}

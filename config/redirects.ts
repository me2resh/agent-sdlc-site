// Redirect map for the three standards sites (design #18 section 4.2, #31).
//
// Each entry sends an old URL of one site to its new URL. The build writes
// the map of each site to dist/<site>/_redirects.json. The edge layer
// (design #18 section 4.3, PR 2b) serves the entries as HTTP redirects.
// Until then, the entries have no effect on the live sites.
//
// Rules (checked by scripts/validate-redirects.mjs):
//   - No key and no target has a trailing slash, except the root "/".
//   - A key is not also a file in the same build.
//   - An internal target is a file in the same build.
//   - An external target is on one of the three canonical hosts, and is a
//     built file on that site, or is listed in pendingTargets below.
//   - Each 301 has Cache-Control max-age=3600. Each 302 has no-store.
//   - No chain and no loop: a target is never a key, on the same site or on
//     the site of an external target.
//   - Each URL in config/url-inventory/<site>.txt is a file or a key.
//
// Status codes:
//   - 301 when the old URL named one fixed thing, and the new URL names the
//     same thing.
//   - 302 when the old URL means "the current version", or when the target
//     changes in a later PR.
//
// This module has no runtime import, so the Node validators can import it.
import type { StandardKey } from './standards';

export type RedirectCode = 301 | 302;

export interface Redirect {
  /** The old path, in the one URL form. */
  readonly from: string;
  /** A path on the same site, or an absolute URL on a canonical host. */
  readonly to: string;
  readonly code: RedirectCode;
  /** Why the entry exists. Not written to _redirects.json. */
  readonly reason: string;
}

/**
 * Cache-Control for each code. A new 301 has a short cache for the first
 * weeks, because a browser keeps a 301 with no end date (design #18 section
 * 8.1). A 302 is not cached.
 */
export const cacheControl: Record<RedirectCode, string> = {
  301: 'max-age=3600',
  302: 'no-store'
};

const ORBIT = 'https://orbitspec.dev';
const AGDR = 'https://agdr.dev';
const AGENTSDLC = 'https://agentsdlc.ai';

/** The $id URL of each ORBIT schema (design #18 section 1.3). PR 7 serves them. */
const orbitSchemaFiles: readonly Redirect[] = [
  ['orbit-plan.json', 'plan'],
  ['plan.schema.json', 'plan'],
  ['project-snapshot.json', 'project-snapshot'],
  ['project-snapshot.schema.json', 'project-snapshot'],
  ['reconciliation.json', 'reconciliation'],
  ['reconciliation.schema.json', 'reconciliation'],
  ['execution-slice.json', 'execution-slice'],
  ['execution-slice.schema.json', 'execution-slice']
].map(([name, record]) => ({ from: `/schema/${name}`, to: `${ORBIT}/schema/${record}/v0.1.json`, code: 301 as const, reason: 'Soft-404 file: the build of another site served "Not found" with HTTP 200 (#31).' }));

/** The AgDR files that other sites served as "Not found" (design #18 section 4.2). */
const agdrSoftFiles: readonly Redirect[] = [
  { from: '/agdr-spec.md', to: `${AGDR}/spec/1.2.0/spec.md`, code: 301, reason: 'Soft-404 file (#31). PR 4 serves the target.' },
  { from: '/schema/agdr.schema.json', to: `${AGDR}/schema/agdr/v1.2.json`, code: 301, reason: 'Soft-404 file (#31). PR 5 serves the target.' },
  { from: '/schema/agdr-json.schema.json', to: `${AGDR}/schema/agdr-json/draft.json`, code: 301, reason: 'Soft-404 file (#31). PR 5 serves the target.' }
];

export const redirects: Record<StandardKey, readonly Redirect[]> = {
  agentsdlc: [
    // ORBIT pages that the agentsdlc.ai build served, with a canonical URL
    // on orbitspec.dev (#15, #31). PR 7 and PR 8 update these targets when
    // they move the ORBIT pages, so that no chain forms.
    { from: '/concepts', to: `${ORBIT}/concepts`, code: 301, reason: 'ORBIT page, built on the wrong site (#31).' },
    { from: '/quick-start', to: `${ORBIT}/quick-start`, code: 301, reason: 'ORBIT page, built on the wrong site (#31).' },
    { from: '/specification', to: `${ORBIT}/specification`, code: 301, reason: 'ORBIT page, built on the wrong site (#31).' },
    { from: '/adopter-guide', to: `${ORBIT}/adopter-guide`, code: 301, reason: 'ORBIT page, built on the wrong site (#31).' },
    { from: '/changelog.md', to: `${AGDR}/changelog.md`, code: 301, reason: 'Soft-404 file: the AgDR changelog endpoint served "Not found" (#31).' },
    ...agdrSoftFiles,
    ...orbitSchemaFiles
  ],
  orbit: [
    { from: '/standards', to: `${AGENTSDLC}/standards`, code: 301, reason: 'agentsdlc.ai page, built on the wrong site (#31).' },
    // The AgDR changelog endpoint served "Not found" here. PR 7 vendors the
    // ORBIT CHANGELOG.md and serves it at this path, and then removes this
    // entry. So the code is 302, not 301.
    { from: '/changelog.md', to: '/changelog', code: 302, reason: 'Soft-404 file (#31). Temporary until PR 7.' },
    ...agdrSoftFiles
  ],
  agdr: [
    { from: '/adopter-guide', to: '/quick-start', code: 301, reason: 'The page only linked to the ORBIT adopter guide (#31).' },
    { from: '/standards', to: `${AGENTSDLC}/standards`, code: 301, reason: 'agentsdlc.ai page, built on the wrong site (#31).' },
    ...orbitSchemaFiles
  ]
};

/**
 * External redirect targets that no build serves yet, because a later PR of
 * design #18 adds them (section 7.2). scripts/validate-redirects.mjs
 * requires every other external target to be a built file on its site. It
 * fails when a URL in this list is built, so remove the URL in the PR that
 * adds it. Until that PR merges, a redirect to one of these URLs leads to a
 * 404 at the edge (design #18, PR 2b row).
 */
export const pendingTargets: Readonly<Record<string, string>> = {
  [`${AGDR}/spec/1.2.0/spec.md`]: 'PR 4',
  [`${AGDR}/schema/agdr/v1.2.json`]: 'PR 5',
  [`${AGDR}/schema/agdr-json/draft.json`]: 'PR 5',
  [`${ORBIT}/schema/plan/v0.1.json`]: 'PR 7',
  [`${ORBIT}/schema/project-snapshot/v0.1.json`]: 'PR 7',
  [`${ORBIT}/schema/reconciliation/v0.1.json`]: 'PR 7',
  [`${ORBIT}/schema/execution-slice/v0.1.json`]: 'PR 7'
};

/** The site-prefixed key of an entry in the edge KeyValueStore (design #18 section 4.3). */
export function redirectKey(site: StandardKey, path: string): string {
  return `${site}|${path}`;
}

/** The content of dist/<site>/_redirects.json. */
export function redirectsDocument(site: StandardKey) {
  return {
    site,
    entries: redirects[site].map(({ from, to, code }) => ({ key: redirectKey(site, from), from, to, code, cacheControl: cacheControl[code] }))
  };
}

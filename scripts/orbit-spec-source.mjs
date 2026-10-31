// Single source of truth for the ORBIT schema files that orbitspec.dev
// vendors from me2resh/orbit-spec. Modelled on scripts/agdr-spec-source.mjs
// (GH-12 / AgDR sync decision).
//
// - `ref` is the pinned source commit.
// - `sha256` is the hash of each vendored file at that commit.
//
// scripts/check-orbit-spec-sync.mjs compares the local files with these
// hashes. It is offline: `npm run check` and production deploys never
// fetch from the network. scripts/sync-orbit-spec.mjs is the only step that
// fetches. To move the pin: change `ref`, run `npm run sync:orbit-spec`,
// then copy the hashes it prints into this file.
//
// Why a commit and not only the release tag: v0.1.0 does not include the
// optional Plan `revisionNote` field added later on main. The site publishes
// the four schemas at this pin so the published Plan schema matches the
// source repository.
export const ORBIT_SPEC_SOURCE = {
  repo: 'me2resh/orbit-spec',
  ref: '7a024046c7d65d28576a5b175978cd4f70ea91cc',
  files: [
    {
      source: 'schema/plan.schema.json',
      dest: 'apps/site/src/data/orbit/plan.schema.json',
      sha256: '279d4c2b8c1aca4a278f2dc767408b35dd41ecddb9b116bf4fd7526a001dae03'
    },
    {
      source: 'schema/project-snapshot.schema.json',
      dest: 'apps/site/src/data/orbit/project-snapshot.schema.json',
      sha256: 'eede7dbc9b84619af1cdc014514e6407b11a9b68527b99f41c1cc35a68f755ff'
    },
    {
      source: 'schema/reconciliation.schema.json',
      dest: 'apps/site/src/data/orbit/reconciliation.schema.json',
      sha256: '6d54b1638a97d80ecb01431b003abed0f248a9154cc14aa538dc395c4fd8c13f'
    },
    {
      source: 'schema/execution-slice.schema.json',
      dest: 'apps/site/src/data/orbit/execution-slice.schema.json',
      sha256: '02e1b4315f5d82af3a19220eef4c13ddb22c1b48d87d99496ce2105991a96c5b'
    }
  ]
};

const RAW_BASE = process.env.ORBIT_SPEC_RAW_BASE || 'https://raw.githubusercontent.com';
const TIMEOUT_MS = 15_000;
const ATTEMPTS = 2; // one try plus one retry

export function rawUrl(path, ref = ORBIT_SPEC_SOURCE.ref) {
  return `${RAW_BASE}/${ORBIT_SPEC_SOURCE.repo}/${ref}/${path}`;
}

/**
 * Fetches one file with a timeout and one retry. Throws an Error with a
 * short, readable message (no stack trace is needed by callers).
 */
export async function fetchText(path, ref = ORBIT_SPEC_SOURCE.ref) {
  const url = rawUrl(path, ref);
  let lastReason = 'unknown error';
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.ok) return await res.text();
      lastReason = `HTTP ${res.status}`;
      if (res.status >= 400 && res.status < 500) break; // a 404 does not heal on retry
    } catch (error) {
      lastReason = error?.name === 'TimeoutError' ? `timed out after ${TIMEOUT_MS / 1000}s` : (error?.cause?.code || error?.message || String(error));
    }
  }
  throw new Error(`Cannot fetch ${url} (${lastReason}).`);
}

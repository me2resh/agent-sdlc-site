// Single source of truth for the AgDR spec files that agdr.dev vendors
// from me2resh/agent-decision-record (GH-12). Decision record:
// docs/design/2026-09-25-agdr-spec-sync.md.
//
// - `ref` is the pinned source commit.
// - `sha256` is the hash of each vendored file at that commit.
//
// scripts/check-agdr-spec-sync.mjs compares the local files with these
// hashes. It is offline: `npm run check` and production deploys never
// fetch from the network. scripts/sync-agdr-spec.mjs is the only step that
// fetches. To move the pin: change `ref`, run `npm run sync:agdr-spec`,
// then copy the hashes it prints into this file.
//
// Why a commit and not a release tag: the source repository has no tag.
// Its only GitHub Release, v1.2.0, is a draft whose target predates
// section 9 "JSON serialisation" (added on main on 2026-09-20, PR #27).
// The site publishes AgDR 1.2.0 and labels section 9 as unreleased
// (maintainer decision, option b). Move the pin to a release tag when the
// source repository publishes one.
export const AGDR_SPEC_SOURCE = {
  repo: 'me2resh/agent-decision-record',
  ref: 'ddebc6ddb9654fc513e6308f11c5dd529ab72df3',
  files: [
    {
      source: 'SPEC.md',
      dest: 'apps/site/src/data/agdr/SPEC.md',
      sha256: '309add5853803921cfd22937f7406b73d038f9d29c1ef66d9ae47b98d66c3a90'
    },
    {
      source: 'CHANGELOG.md',
      dest: 'apps/site/src/data/agdr/CHANGELOG.md',
      sha256: '049642b5e8209e244ba7aa005bd96d8432bf7db6f20fd4d3d2b2b709a6132792'
    },
    {
      source: 'schema/agdr.schema.json',
      dest: 'apps/site/src/data/agdr/agdr.schema.json',
      sha256: 'f5619b1bf70169f75898d4826ed3ce9896259545be37a895bfab9eea0490a937'
    },
    {
      source: 'schema/agdr-json.schema.json',
      dest: 'apps/site/src/data/agdr/agdr-json.schema.json',
      sha256: 'c86a932cf675a5335eef0913ea9efd7d65e5a34c9db7a410e2efc7deab328e36'
    }
  ]
};

// Base URL for raw file fetches. The environment override exists only so a
// test can point the fetch at an invalid host and prove the offline check
// does not use the network.
const RAW_BASE = process.env.AGDR_SPEC_RAW_BASE || 'https://raw.githubusercontent.com';
const TIMEOUT_MS = 15_000;
const ATTEMPTS = 2; // one try plus one retry

export function rawUrl(path, ref = AGDR_SPEC_SOURCE.ref) {
  return `${RAW_BASE}/${AGDR_SPEC_SOURCE.repo}/${ref}/${path}`;
}

/**
 * Fetches one file with a timeout and one retry. Throws an Error with a
 * short, readable message (no stack trace is needed by callers).
 */
export async function fetchText(path, ref = AGDR_SPEC_SOURCE.ref) {
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

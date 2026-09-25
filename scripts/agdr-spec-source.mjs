// Single source of truth for the AgDR spec files the agdr.dev site vendors
// from me2resh/agent-decision-record. scripts/sync-agdr-spec.mjs and
// scripts/check-agdr-spec-sync.mjs both import this file, so re-pointing
// the site at a newer ref is a one-line change here.
//
// Why a commit SHA and not a release tag (GH-12):
// The source repository has one GitHub Release, v1.2.0. It is a draft
// dated 2026-08-07, and its target commit predates the JSON serialisation
// section (SPEC.md section 9), which landed on main on 2026-09-20 (PR #27)
// without a version bump or CHANGELOG entry. There is no tag that contains
// section 9. The SHA below is the current tip of main and the commit that
// completed the JSON serialisation contract. Move this pin to a release
// tag once the source repository cuts one that includes section 9.
export const AGDR_SPEC_SOURCE = {
  repo: 'me2resh/agent-decision-record',
  ref: 'ddebc6ddb9654fc513e6308f11c5dd529ab72df3',
  files: [
    { source: 'SPEC.md', dest: 'apps/site/src/data/agdr/SPEC.md' },
    { source: 'CHANGELOG.md', dest: 'apps/site/src/data/agdr/CHANGELOG.md' },
    { source: 'schema/agdr.schema.json', dest: 'apps/site/src/data/agdr/agdr.schema.json' },
    { source: 'schema/agdr-json.schema.json', dest: 'apps/site/src/data/agdr/agdr-json.schema.json' }
  ]
};

export function rawUrl(path) {
  return `https://raw.githubusercontent.com/${AGDR_SPEC_SOURCE.repo}/${AGDR_SPEC_SOURCE.ref}/${path}`;
}

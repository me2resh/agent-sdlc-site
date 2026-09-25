#!/usr/bin/env node
// Fetches the AgDR spec files listed in scripts/agdr-spec-source.mjs from
// the pinned ref of me2resh/agent-decision-record and writes them into
// this site's vendored copy under apps/site/src/data/agdr/.
//
// Run this after the source repository's SPEC.md changes and the pin in
// agdr-spec-source.mjs is updated to the new ref. Then run
// `node scripts/check-agdr-spec-sync.mjs` (or `npm run check`) to confirm
// the vendored copy matches.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AGDR_SPEC_SOURCE, rawUrl } from './agdr-spec-source.mjs';

const root = new URL('..', import.meta.url).pathname;

async function fetchText(path) {
  const url = rawUrl(path);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed (${res.status}): ${url}`);
  return res.text();
}

for (const { source, dest } of AGDR_SPEC_SOURCE.files) {
  const content = await fetchText(source);
  writeFileSync(join(root, dest), content);
  console.log(`synced ${source} -> ${dest}`);
}
console.log(`done. Pinned ref: ${AGDR_SPEC_SOURCE.repo}@${AGDR_SPEC_SOURCE.ref}`);

#!/usr/bin/env node
// Fails when this site's vendored AgDR spec files differ from the pinned
// ref of me2resh/agent-decision-record recorded in agdr-spec-source.mjs.
// This is the CI backstop for GH-12: it catches the site's copy going
// stale relative to the source repository again.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AGDR_SPEC_SOURCE, rawUrl } from './agdr-spec-source.mjs';

const root = new URL('..', import.meta.url).pathname;

async function fetchText(path) {
  const url = rawUrl(path);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed (${res.status}): ${url}`);
  return res.text();
}

let failed = false;
for (const { source, dest } of AGDR_SPEC_SOURCE.files) {
  const upstream = await fetchText(source);
  const local = readFileSync(join(root, dest), 'utf8');
  if (upstream !== local) {
    failed = true;
    console.error(`OUT OF SYNC: ${dest}`);
    console.error(`  differs from ${AGDR_SPEC_SOURCE.repo}@${AGDR_SPEC_SOURCE.ref}/${source}`);
  }
}

if (failed) {
  console.error('\nagdr spec sync check failed.');
  console.error('Run: node scripts/sync-agdr-spec.mjs');
  console.error('See scripts/agdr-spec-source.mjs for the pinned ref.');
  process.exit(1);
}
console.log(`agdr spec sync check passed: vendored copy matches ${AGDR_SPEC_SOURCE.repo}@${AGDR_SPEC_SOURCE.ref}`);

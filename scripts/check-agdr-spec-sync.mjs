#!/usr/bin/env node
// Offline check (GH-12): fails when a vendored AgDR spec file differs from
// the SHA-256 recorded for the pinned commit in agdr-spec-source.mjs.
// This check never uses the network, so `npm run check` and production
// deploys do not depend on GitHub availability.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AGDR_SPEC_SOURCE } from './agdr-spec-source.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const problems = [];

for (const { source, dest, sha256 } of AGDR_SPEC_SOURCE.files) {
  const file = join(root, dest);
  if (!existsSync(file)) {
    problems.push(`MISSING: ${dest}`);
    continue;
  }
  const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
  if (actual !== sha256) {
    problems.push(`OUT OF SYNC: ${dest}\n  expected sha256 ${sha256} (${source} at ${AGDR_SPEC_SOURCE.ref})\n  actual   sha256 ${actual}`);
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error('\nagdr spec sync check failed. Do not edit vendored files by hand.');
  console.error('Run `npm run sync:agdr-spec` to restore them from the pinned commit.');
  console.error('See scripts/agdr-spec-source.mjs.');
  process.exit(1);
}
console.log(`agdr spec sync check passed (offline): ${AGDR_SPEC_SOURCE.files.length} vendored files match ${AGDR_SPEC_SOURCE.repo}@${AGDR_SPEC_SOURCE.ref.slice(0, 12)}`);

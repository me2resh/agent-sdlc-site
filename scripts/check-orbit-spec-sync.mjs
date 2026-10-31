#!/usr/bin/env node
// Offline check: fails when a vendored ORBIT schema differs from the
// SHA-256 recorded for the pinned commit in orbit-spec-source.mjs.
// This check never uses the network, so `npm run check` and production
// deploys do not depend on GitHub availability.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORBIT_SPEC_SOURCE } from './orbit-spec-source.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const problems = [];

for (const { source, dest, sha256 } of ORBIT_SPEC_SOURCE.files) {
  const file = join(root, dest);
  if (!existsSync(file)) {
    problems.push(`MISSING: ${dest}`);
    continue;
  }
  const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
  if (actual !== sha256) {
    problems.push(`OUT OF SYNC: ${dest}\n  expected sha256 ${sha256} (${source} at ${ORBIT_SPEC_SOURCE.ref})\n  actual   sha256 ${actual}`);
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error('\norbit spec sync check failed. Do not edit vendored files by hand.');
  console.error('Run `npm run sync:orbit-spec` to restore them from the pinned commit.');
  console.error('See scripts/orbit-spec-source.mjs.');
  process.exit(1);
}
console.log(`orbit spec sync check passed (offline): ${ORBIT_SPEC_SOURCE.files.length} vendored files match ${ORBIT_SPEC_SOURCE.repo}@${ORBIT_SPEC_SOURCE.ref.slice(0, 12)}`);

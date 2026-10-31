#!/usr/bin/env node
// Reports drift between the pinned ORBIT schema files and the source
// repository's main branch. The pin is immutable, so the offline check
// cannot see new upstream text. This report can. It runs on a schedule
// (.github/workflows/orbit-spec-drift.yml), never on pull requests and
// never in a deploy. It fails (exit 1) when upstream differs, so the
// scheduled run shows red and the maintainer can decide to move the pin.
import { createHash } from 'node:crypto';
import { ORBIT_SPEC_SOURCE, fetchText } from './orbit-spec-source.mjs';

const upstreamRef = process.argv[2] || 'main';

try {
  const drifted = [];
  for (const { source, sha256 } of ORBIT_SPEC_SOURCE.files) {
    const upstream = createHash('sha256').update(await fetchText(source, upstreamRef)).digest('hex');
    if (upstream !== sha256) drifted.push(source);
  }
  if (drifted.length > 0) {
    console.error(`ORBIT spec drift: these files on ${ORBIT_SPEC_SOURCE.repo}@${upstreamRef} differ from the pinned commit ${ORBIT_SPEC_SOURCE.ref}:`);
    for (const file of drifted) console.error(`  - ${file}`);
    console.error('To adopt the new text: update `ref` in scripts/orbit-spec-source.mjs, run `npm run sync:orbit-spec`, and update the hashes.');
    process.exit(1);
  }
  console.log(`No drift: ${ORBIT_SPEC_SOURCE.repo}@${upstreamRef} matches the pinned commit for all ${ORBIT_SPEC_SOURCE.files.length} files.`);
} catch (error) {
  console.error(`orbit spec drift report failed: ${error.message}`);
  process.exit(1);
}

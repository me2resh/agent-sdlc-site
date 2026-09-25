#!/usr/bin/env node
// Reports drift between the pinned AgDR spec files and the source
// repository's main branch (GH-12). The pin is immutable, so the offline
// check cannot see new upstream text. This report can. It runs on a
// schedule (.github/workflows/agdr-spec-drift.yml), never on pull requests
// and never in a deploy. It fails (exit 1) when upstream differs, so the
// scheduled run shows red and the maintainer can decide to move the pin.
import { createHash } from 'node:crypto';
import { AGDR_SPEC_SOURCE, fetchText } from './agdr-spec-source.mjs';

const upstreamRef = process.argv[2] || 'main';

try {
  const drifted = [];
  for (const { source, sha256 } of AGDR_SPEC_SOURCE.files) {
    const upstream = createHash('sha256').update(await fetchText(source, upstreamRef)).digest('hex');
    if (upstream !== sha256) drifted.push(source);
  }
  if (drifted.length > 0) {
    console.error(`AgDR spec drift: these files on ${AGDR_SPEC_SOURCE.repo}@${upstreamRef} differ from the pinned commit ${AGDR_SPEC_SOURCE.ref}:`);
    for (const file of drifted) console.error(`  - ${file}`);
    console.error('To adopt the new text: update `ref` in scripts/agdr-spec-source.mjs, run `npm run sync:agdr-spec`, and update the hashes.');
    process.exit(1);
  }
  console.log(`No drift: ${AGDR_SPEC_SOURCE.repo}@${upstreamRef} matches the pinned commit for all ${AGDR_SPEC_SOURCE.files.length} files.`);
} catch (error) {
  console.error(`agdr spec drift report failed: ${error.message}`);
  process.exit(1);
}

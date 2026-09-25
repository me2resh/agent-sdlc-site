#!/usr/bin/env node
// Fetches the AgDR spec files listed in agdr-spec-source.mjs from the
// pinned commit and writes them into apps/site/src/data/agdr/. This is the
// only script that uses the network. Run it by hand (`npm run sync:agdr-spec`)
// after you change the pinned `ref`. It prints the SHA-256 of each file;
// copy changed hashes into agdr-spec-source.mjs so the offline check passes.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AGDR_SPEC_SOURCE, fetchText } from './agdr-spec-source.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

try {
  let changedHashes = 0;
  for (const { source, dest, sha256 } of AGDR_SPEC_SOURCE.files) {
    const content = await fetchText(source);
    writeFileSync(join(root, dest), content);
    const actual = createHash('sha256').update(content).digest('hex');
    const same = actual === sha256;
    if (!same) changedHashes++;
    console.log(`synced ${source} -> ${dest}\n  sha256 ${actual}${same ? '' : '  (differs from the recorded hash)'}`);
  }
  console.log(`done. Pinned ref: ${AGDR_SPEC_SOURCE.repo}@${AGDR_SPEC_SOURCE.ref}`);
  if (changedHashes > 0) {
    console.log(`\n${changedHashes} hash(es) changed. Copy the new sha256 values into scripts/agdr-spec-source.mjs.`);
  }
} catch (error) {
  console.error(`agdr spec sync failed: ${error.message}`);
  console.error('Check your network connection and the pinned ref in scripts/agdr-spec-source.mjs, then run again.');
  process.exit(1);
}

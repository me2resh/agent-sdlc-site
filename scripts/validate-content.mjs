import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { readCurrentAgdrVersion } from './lib/agdr-current-version.mjs';
import { checkAgdrVersionLiterals } from './check-agdr-version-literals.mjs';

const root = new URL('..', import.meta.url).pathname;
const read = file => readFileSync(join(root, file), 'utf8');
for (const file of [
  'apps/site/src/data/agdr/agdr.schema.json',
  'apps/site/src/data/agdr/agdr-json.schema.json',
  'apps/site/src/data/orbit/plan.schema.json',
  'apps/site/src/data/orbit/project-snapshot.schema.json',
  'apps/site/src/data/orbit/reconciliation.schema.json',
  'apps/site/src/data/orbit/execution-slice.schema.json'
]) JSON.parse(read(file));

// No page source may hard-code an AgDR version. See GH-22.
checkAgdrVersionLiterals(root);

for (const site of ['agentsdlc', 'orbit', 'agdr']) {
  const index = join(root, 'apps/site/dist', site, 'index.html');
  if (!existsSync(index)) throw new Error(`Missing build output for ${site}`);
}

// Every built AgDR page shows the current version from
// apps/site/src/lib/agdr-changelog.ts. readCurrentAgdrVersion() re-derives
// that version from CHANGELOG.md; check-agdr-changelog-version.mjs proves
// that the module renders the same value. See GH-22.
const agdrVersion = readCurrentAgdrVersion(root);
const agdrPages = {
  'index.html': `AgDR ${agdrVersion} · OPEN STANDARD`,
  'specification/index.html': `AgDR ${agdrVersion} · Published`,
  'quick-start/index.html': `AgDR ${agdrVersion} · Published`,
  'conformance/index.html': `AgDR ${agdrVersion} · Published`,
  'changelog/index.html': `current published version is ${agdrVersion}.`,
  'schema/index.html': `AgDR ${agdrVersion} schema`,
  'llms.txt': `Version ${agdrVersion} is published.`
};
for (const [page, expected] of Object.entries(agdrPages)) {
  const file = join(root, 'apps/site/dist/agdr', page);
  if (!existsSync(file)) throw new Error(`Missing AgDR build output: ${file}`);
  const html = readFileSync(file, 'utf8');
  if (!html.includes(expected)) throw new Error(`AgDR page ${page} does not show the current version (expected "${expected}")`);
  // The changelog page lists every release, so older versions are correct there.
  if (page === 'changelog/index.html') continue;
  for (const match of html.matchAll(/\bAgDR[\s-]*v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)/g)) {
    if (match[1] !== agdrVersion) throw new Error(`AgDR page ${page} shows "${match[0]}", but the current version is ${agdrVersion}`);
  }
}

const agdrBuild = readFileSync(join(root, 'apps/site/dist/agdr/specification/index.html'), 'utf8');
if (agdrBuild.includes('Keep execution aligned with durable outcomes.')) throw new Error('AgDR build contains ORBIT specification copy');
if (!agdrBuild.includes('JSON serialisation')) throw new Error('AgDR specification page is missing the JSON serialisation section');

if (!agdrBuild.includes('Status: unreleased.') || !agdrBuild.includes(`is not part of AgDR ${agdrVersion}`)) throw new Error('AgDR specification page is missing the unreleased notice for section 9');

const agdrSpecMdBuild = readFileSync(join(root, 'apps/site/dist/agdr/agdr-spec.md'), 'utf8');
const section9 = agdrSpecMdBuild.indexOf('## 9. JSON serialisation');
if (section9 === -1) throw new Error('/agdr-spec.md build output is missing section 9 (JSON serialisation)');
const notice = agdrSpecMdBuild.indexOf('> **Note from agdr.dev:** Unreleased.');
if (notice === -1 || notice > section9) throw new Error('/agdr-spec.md build output is missing the unreleased notice above section 9');
if (/section 9[^\n]*published/i.test(agdrSpecMdBuild + agdrBuild)) throw new Error('AgDR output calls section 9 published');

console.log(`content validation passed: schemas parse, no page source hard-codes an AgDR version, every AgDR page shows AgDR ${agdrVersion}, and section 9 is present and marked unreleased`);

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

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

const agdr = read('apps/site/src/pages/specification.astro');
if (!agdr.includes('AgDR 1.2.0')) throw new Error('AgDR specification content is missing its published identity');
for (const site of ['agentsdlc', 'orbit', 'agdr']) {
  const index = join(root, 'apps/site/dist', site, 'index.html');
  if (!existsSync(index)) throw new Error(`Missing build output for ${site}`);
}
const agdrBuild = readFileSync(join(root, 'apps/site/dist/agdr/specification/index.html'), 'utf8');
if (agdrBuild.includes('Keep execution aligned with durable outcomes.')) throw new Error('AgDR build contains ORBIT specification copy');
if (!agdrBuild.includes('JSON serialisation')) throw new Error('AgDR specification page is missing the JSON serialisation section');

const agdrSpecMdBuild = readFileSync(join(root, 'apps/site/dist/agdr/agdr-spec.md'), 'utf8');
if (!agdrSpecMdBuild.includes('## 9. JSON serialisation')) throw new Error('/agdr-spec.md build output is missing section 9 (JSON serialisation)');

console.log('content validation passed: schemas parse, AgDR identity is isolated, and JSON serialisation is present');

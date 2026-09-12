import fs from 'node:fs';
const source = fs.readFileSync('apps/site/src/pages/interoperability.astro', 'utf8');
const match = source.match(/const orbitSlice = `([\s\S]*?)`;/);
if (!match) throw new Error('orbitSlice example is missing');
const slice = JSON.parse(match[1]);
for (const field of ['specVersion','id','planId','outcomeId','basedOn','objective','why','contributesTo','scope']) if (!(field in slice)) throw new Error(`orbitSlice missing ${field}`);
if (slice.id !== 'slice-004' || slice.basedOn.reconciliationId !== 'rec-009' || !slice.contributesTo.includes('ac-2')) throw new Error('orbitSlice identifiers are inconsistent');
for (const token of ['id: AgDR-0012','type: orbit.execution-slice','id: slice-004','rel: implements','external.deliberation-record']) if (!source.includes(token)) throw new Error(`interoperability example missing ${token}`);
console.log('interoperability examples validated');

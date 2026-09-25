// Fails when a source file under apps/site/src contains a literal AgDR
// version number, for example "AgDR 1.2.0" or "Version 1.2.0 is published".
//
// Every page must read the AgDR version from agdrCurrentVersion /
// agdrVersionBanner in apps/site/src/lib/agdr-changelog.ts. A hard-coded
// version does not change at the next AgDR release, so the page shows a
// wrong version on production. See GH-11 and GH-22.
//
// Exempt files:
// - apps/site/src/lib/agdr-changelog.ts -- the one module that owns the version.
// - The files that scripts/sync-agdr-spec.mjs copies byte for byte from the
//   normative repository (CHANGELOG.md, SPEC.md, the schemas). They are data,
//   not page sources, and check:agdr-spec-sync pins their content.
//
// Run directly (`node scripts/check-agdr-version-literals.mjs`) or through
// scripts/validate-content.mjs, which runs in `npm run validate`.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';
import { AGDR_SPEC_SOURCE } from './agdr-spec-source.mjs';

const SCAN_ROOT = 'apps/site/src';
const VERSION_MODULE = 'apps/site/src/lib/agdr-changelog.ts';

// "AgDR 1.2.0", "AgDR v1.2.0", "AgDR-1.2.0", and "Version 1.2.0" /
// "version v1.2.0". ORBIT uses two-part versions ("v0.1", "Version 0.1"),
// which these patterns do not match.
const LITERAL_PATTERNS = [/\bAgDR[\s-]*v?\d+\.\d+\.\d+/gi, /\bversion\s+v?\d+\.\d+\.\d+/gi];

export function findAgdrVersionLiterals(text) {
  const found = [];
  const lines = text.split(/\r\n|\r|\n/);
  lines.forEach((line, index) => {
    for (const pattern of LITERAL_PATTERNS) {
      for (const match of line.matchAll(pattern)) found.push({ line: index + 1, text: match[0] });
    }
  });
  return found;
}

function selfTest() {
  const mustMatch = [
    '<p class="eyebrow">AgDR 1.2.0 · Published</p>',
    'AgDR v2.0.1',
    'Version 1.2.0 is published.',
    'AgDR-1.3.0-rc.1'
  ];
  const mustNotMatch = [
    '<p class="eyebrow">{agdrVersionBanner}</p>',
    'AgDR {agdrCurrentVersion} · OPEN STANDARD',
    'Version ${agdrCurrentVersion} is published.',
    'ORBIT v0.1 · Draft',
    'Version 0.1 is a draft.',
    'id: AgDR-0001'
  ];
  for (const sample of mustMatch) {
    if (findAgdrVersionLiterals(sample).length === 0) throw new Error(`self-test: the AgDR version-literal check misses "${sample}"`);
  }
  for (const sample of mustNotMatch) {
    if (findAgdrVersionLiterals(sample).length > 0) throw new Error(`self-test: the AgDR version-literal check flags "${sample}"`);
  }
}

function listFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...listFiles(path));
    else out.push(path);
  }
  return out;
}

export function checkAgdrVersionLiterals(root) {
  selfTest();
  const exempt = new Set([VERSION_MODULE, ...AGDR_SPEC_SOURCE.files.map(({ dest }) => dest)]);
  const violations = [];
  for (const file of listFiles(join(root, SCAN_ROOT))) {
    const rel = relative(root, file).split(sep).join('/');
    if (exempt.has(rel)) continue;
    for (const { line, text } of findAgdrVersionLiterals(readFileSync(file, 'utf8'))) {
      violations.push(`${rel}:${line}: "${text}"`);
    }
  }
  if (violations.length > 0) {
    throw new Error(
      `Found a literal AgDR version number in page source:\n  ${violations.join('\n  ')}\n` +
        `Read the version from agdrCurrentVersion or agdrVersionBanner in ${VERSION_MODULE}. See GH-22.`
    );
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  checkAgdrVersionLiterals(fileURLToPath(new URL('..', import.meta.url)));
  console.log('AgDR version-literal check passed: no page source under apps/site/src hard-codes an AgDR version');
}

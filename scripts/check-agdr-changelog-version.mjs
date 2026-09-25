// Fails the build when the AgDR banner, the AgDR changelog page, and the
// CHANGELOG.md source disagree on the current version. See GH-11 -- the
// banner and the changelog page used to come from separate hardcoded
// strings and could drift apart silently.
//
// The source-level check (findCurrentVersionInSource, in
// scripts/lib/agdr-current-version.mjs) intentionally duplicates the parsing
// rule in apps/site/src/lib/agdr-changelog.ts instead of importing it. A
// check built only on that module's own output cannot catch a bug inside the
// module -- both outputs would show the same wrong answer. Re-deriving the
// version independently, straight from CHANGELOG.md, can. See GH-19 review
// (N2).
//
// Requires the agdr site to be built first: `npm run build:agdr` (or
// `npm run build:all`, which builds it before this check can run).
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { findCurrentVersionInSource } from './lib/agdr-current-version.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const bannerPage = join(root, 'apps/site/dist/agdr/index.html');
const changelogPage = join(root, 'apps/site/dist/agdr/changelog/index.html');
const changelogSource = join(root, 'apps/site/src/data/agdr/CHANGELOG.md');

for (const file of [bannerPage, changelogPage, changelogSource]) {
  if (!existsSync(file)) {
    throw new Error(`Missing file: ${file}. Run "npm run build:agdr" first.`);
  }
}

const banner = readFileSync(bannerPage, 'utf8');
const changelogHtml = readFileSync(changelogPage, 'utf8');
const changelogMarkdown = readFileSync(changelogSource, 'utf8');

const bannerMatch = banner.match(/class="version">AgDR ([\d.]+) · Published</);
if (!bannerMatch) {
  throw new Error(`Could not find the AgDR version banner in ${bannerPage}.`);
}

const changelogPageMatch = changelogHtml.match(/current published version is ([\d.]+)\./);
if (!changelogPageMatch) {
  throw new Error(`Could not find the current published version sentence on the AgDR changelog page in ${changelogPage}.`);
}

const sourceVersion = findCurrentVersionInSource(changelogMarkdown, changelogSource);
if (!sourceVersion) {
  throw new Error(`No published (non-pre-release, non-yanked) release found in ${changelogSource}.`);
}

const bannerVersion = bannerMatch[1];
const changelogPageVersion = changelogPageMatch[1];

const mismatches = [];
if (bannerVersion !== changelogPageVersion) mismatches.push(`banner (${bannerVersion}) vs changelog page (${changelogPageVersion})`);
if (bannerVersion !== sourceVersion) mismatches.push(`banner (${bannerVersion}) vs CHANGELOG.md source (${sourceVersion})`);
if (changelogPageVersion !== sourceVersion) mismatches.push(`changelog page (${changelogPageVersion}) vs CHANGELOG.md source (${sourceVersion})`);

if (mismatches.length > 0) {
  throw new Error(
    `AgDR version mismatch: ${mismatches.join('; ')}. Check apps/site/src/lib/agdr-changelog.ts and apps/site/src/data/agdr/CHANGELOG.md.`
  );
}

console.log(`AgDR changelog check passed: banner, changelog page, and CHANGELOG.md source all report version ${bannerVersion}.`);

// Fails the build when the AgDR version banner and the AgDR changelog page
// report different current versions. See GH-11 — the two used to come from
// separate hardcoded strings and could drift apart silently.
//
// Requires the agdr site to be built first: `npm run build:agdr` (or
// `npm run build:all`, which builds it before this check can run).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const bannerPage = join(root, 'apps/site/dist/agdr/index.html');
const changelogPage = join(root, 'apps/site/dist/agdr/changelog/index.html');

for (const file of [bannerPage, changelogPage]) {
  if (!existsSync(file)) {
    throw new Error(`Missing built AgDR page: ${file}. Run "npm run build:agdr" first.`);
  }
}

const banner = readFileSync(bannerPage, 'utf8');
const changelog = readFileSync(changelogPage, 'utf8');

const bannerMatch = banner.match(/class="version">AgDR ([\d.]+) · Published</);
if (!bannerMatch) {
  throw new Error(`Could not find the AgDR version banner in ${bannerPage}.`);
}

const changelogMatch = changelog.match(/<h2>([\d.]+)<\/h2>/);
if (!changelogMatch) {
  throw new Error(`Could not find the current version on the AgDR changelog page in ${changelogPage}.`);
}

const bannerVersion = bannerMatch[1];
const changelogVersion = changelogMatch[1];

if (bannerVersion !== changelogVersion) {
  throw new Error(
    `AgDR version mismatch: the site banner shows ${bannerVersion} but the changelog page's current version is ${changelogVersion}. ` +
      'Check apps/site/src/lib/agdr-changelog.ts and apps/site/src/data/agdr/CHANGELOG.md.'
  );
}

console.log(`AgDR changelog check passed: banner and changelog page both report version ${bannerVersion}.`);

// Reads the current published AgDR version straight from
// apps/site/src/data/agdr/CHANGELOG.md.
//
// This intentionally duplicates the parsing rule in
// apps/site/src/lib/agdr-changelog.ts instead of importing it. A check built
// only on that module's own output cannot catch a bug inside the module --
// both outputs would show the same wrong answer. Re-deriving the version
// independently, straight from CHANGELOG.md, can. See GH-19 review (N2).
//
// check-agdr-changelog-version.mjs asserts that this value and the module's
// value (as rendered in the built banner) are equal, so the other checks can
// treat this value as "the module's current version". See GH-22.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const CHANGELOG_SOURCE = 'apps/site/src/data/agdr/CHANGELOG.md';

// Mirrors the heading grammar in apps/site/src/lib/agdr-changelog.ts.
// Kept in sync by hand; a difference here is a false negative in the checks,
// not a difference in what actually ships (the Astro module is the one the
// build depends on).
const UNRELEASED_HEADING = /^\[unreleased\]$/i;
const RELEASE_HEADING =
  /^\[(?<version>\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)\](?:\([^)]*\))?\s*[-–]\s*(?<date>\d{4}-\d{2}-\d{2})(?:\s*\[(?<tag>YANKED)\])?$/i;

export function findCurrentVersionInSource(markdown, sourceName = CHANGELOG_SOURCE) {
  for (const rawLine of markdown.split(/\r\n|\r|\n/)) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.startsWith('## ')) continue;
    const heading = line.slice(3).trim();
    if (UNRELEASED_HEADING.test(heading)) continue;
    const match = RELEASE_HEADING.exec(heading);
    if (!match || !match.groups) {
      throw new Error(`Cannot read changelog heading "## ${heading}" in ${sourceName}.`);
    }
    const { version, tag } = match.groups;
    // RELEASE_HEADING has the /i flag, so tag can be lowercase ("yanked") --
    // compare case-insensitively, or a lowercase tag is missed here too.
    // See GH-19 (B3).
    if (version.includes('-') || tag?.toUpperCase() === 'YANKED') continue; // pre-release / yanked is never current
    return version;
  }
  return null;
}

export function readCurrentAgdrVersion(root) {
  const file = join(root, CHANGELOG_SOURCE);
  const version = findCurrentVersionInSource(readFileSync(file, 'utf8'), file);
  if (!version) {
    throw new Error(`No published (non-pre-release, non-yanked) release found in ${file}.`);
  }
  return version;
}

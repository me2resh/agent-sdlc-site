// Parses apps/site/src/data/agdr/CHANGELOG.md (a copy of the normative
// CHANGELOG.md in me2resh/agent-decision-record) into structured entries.
//
// The AgDR version banner (StandardLayout.astro) and the AgDR changelog page
// ([slug].astro) both import agdrCurrentVersion / agdrChangelogEntries from
// here instead of hardcoding a version number, so the two cannot drift apart.
// See GH-11.
//
// This module MUST fail the build rather than silently show a wrong
// version. GH-11 was a wrong-version-on-production bug; a parser that
// falls back to a placeholder version on a parse miss reintroduces the
// same class of bug, only quieter. See GH-19 review (B1).
import raw from '../data/agdr/CHANGELOG.md?raw';

export interface AgdrChangelogEntry {
  version: string;
  date: string;
  /** A pre-release version, e.g. "1.3.0-rc.1". */
  prerelease: boolean;
  /** A release marked [YANKED] in the changelog. */
  yanked: boolean;
}

const UNRELEASED_HEADING = /^\[unreleased\]$/i;

// Matches a Keep a Changelog release heading, after trailing whitespace has
// been stripped from the source line. Accepted forms (all observed in real
// changelogs, per the GH-19 review):
//   [1.2.0] - 2026-07-04                                     plain
//   [1.2.0](https://example.com/CHANGELOG.md#120) - 2026-07-04   linked version
//   [1.3.0-rc.1] - 2026-07-04                                pre-release
//   [1.2.0] – 2026-07-04                                 en dash separator
//   [1.2.0] - 2026-07-04 [YANKED]                            yanked release
const RELEASE_HEADING =
  /^\[(?<version>\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)\](?:\([^)]*\))?\s*[-–]\s*(?<date>\d{4}-\d{2}-\d{2})(?:\s*\[(?<tag>YANKED)\])?$/i;

export function parseAgdrChangelog(markdown: string): AgdrChangelogEntry[] {
  const entries: AgdrChangelogEntry[] = [];
  const lines = markdown.split(/\r\n|\r|\n/);
  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.startsWith('## ')) continue;
    const heading = line.slice(3).trim();
    if (UNRELEASED_HEADING.test(heading)) continue;
    const match = RELEASE_HEADING.exec(heading);
    if (!match || !match.groups) {
      throw new Error(
        `apps/site/src/data/agdr/CHANGELOG.md has a "## ..." heading this parser does not recognize: "## ${heading}". ` +
          'Fix the heading in CHANGELOG.md, or extend RELEASE_HEADING in apps/site/src/lib/agdr-changelog.ts to accept the new form. ' +
          'Failing loudly here is deliberate -- see GH-11 / GH-19 (B1): a silently dropped heading must not ship a wrong version to production.'
      );
    }
    const { version, date, tag } = match.groups;
    // The RELEASE_HEADING regex has the /i flag, so tag can be "YANKED",
    // "Yanked", or "yanked" -- compare case-insensitively, not by exact
    // string, or a lowercase tag silently becomes "current". See GH-19 (B3).
    entries.push({ version, date, prerelease: version.includes('-'), yanked: tag?.toUpperCase() === 'YANKED' });
  }
  if (entries.length === 0) {
    throw new Error(
      'apps/site/src/data/agdr/CHANGELOG.md has no recognizable release heading ("## [x.y.z] - YYYY-MM-DD"). ' +
        'The AgDR version banner has nothing to show.'
    );
  }
  return entries;
}

// Keep a Changelog lists the newest release first.
export const agdrChangelogEntries: AgdrChangelogEntry[] = parseAgdrChangelog(raw);

// A pre-release (e.g. "1.3.0-rc.1") or a yanked release is not "current" --
// readers must never see draft or withdrawn work presented as the published
// version. The current version is the first entry that is neither.
const currentEntry = agdrChangelogEntries.find((entry) => !entry.prerelease && !entry.yanked);
if (!currentEntry) {
  throw new Error(
    'apps/site/src/data/agdr/CHANGELOG.md has no published release (every entry is a pre-release or is marked [YANKED]). ' +
      'The AgDR version banner has nothing to show as current.'
  );
}

export const agdrCurrentVersion: string = currentEntry.version;

export const agdrVersionBanner = `AgDR ${agdrCurrentVersion} · Published`;

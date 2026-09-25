// Parses apps/site/src/data/agdr/CHANGELOG.md (a copy of the normative
// CHANGELOG.md in me2resh/agent-decision-record) into structured entries.
//
// The AgDR version banner (StandardLayout.astro) and the AgDR changelog page
// ([slug].astro) both import agdrCurrentVersion / agdrChangelogEntries from
// here instead of hardcoding a version number, so the two cannot drift apart.
// See GH-11.
import raw from '../data/agdr/CHANGELOG.md?raw';

export interface AgdrChangelogEntry {
  version: string;
  date: string;
}

const VERSION_HEADING = /^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})$/gm;

export function parseAgdrChangelog(markdown: string): AgdrChangelogEntry[] {
  return Array.from(markdown.matchAll(VERSION_HEADING)).map(([, version, date]) => ({ version, date }));
}

// Keep a Changelog lists the newest release first, so entries[0] is current.
export const agdrChangelogEntries: AgdrChangelogEntry[] = parseAgdrChangelog(raw);

export const agdrCurrentVersion: string = agdrChangelogEntries[0]?.version ?? '0.0.0';

export const agdrVersionBanner = `AgDR ${agdrCurrentVersion} · Published`;

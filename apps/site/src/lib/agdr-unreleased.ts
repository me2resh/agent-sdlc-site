import { agdrCurrentVersion } from './agdr-changelog';

// Section 9 "JSON serialisation" of the vendored SPEC.md is on the source
// repository's main branch, but it is not part of any AgDR release. The
// maintainer chose to publish it now and label it as unreleased (GH-12,
// option b). This module holds the one notice text that the rendered
// specification page and the served /agdr-spec.md both use.
//
// The vendored SPEC.md stays byte-identical to the pinned commit. The
// notice is added to the served output at build time, never to the file.

export const AGDR_UNRELEASED_HEADING = '## 9. JSON serialisation';

export const agdrUnreleasedNotice =
  `Unreleased. Section 9 "JSON serialisation" is not part of AgDR ${agdrCurrentVersion}. ` +
  'It is draft text for the next AgDR release. It can change before that release. ' +
  'The JSON Schema for this section (/schema/agdr-json.schema.json) has the same status.';

/**
 * Returns the spec text with the unreleased notice placed directly above
 * the section 9 heading. Throws when the heading is missing, so a changed
 * upstream heading breaks the build instead of silently dropping the notice.
 */
export function withUnreleasedNotice(spec: string): string {
  const index = spec.indexOf(`\n${AGDR_UNRELEASED_HEADING}\n`);
  if (index === -1) {
    throw new Error(`Cannot find "${AGDR_UNRELEASED_HEADING}" in the vendored SPEC.md. Update apps/site/src/lib/agdr-unreleased.ts.`);
  }
  const note = `\n> **Note from agdr.dev:** ${agdrUnreleasedNotice}\n`;
  return spec.slice(0, index) + note + spec.slice(index);
}

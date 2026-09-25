# AgDR spec sync on agdr.dev: vendored copy, pinned commit, offline hash check

- Status: accepted
- Date: 2026-09-25
- Ticket: #12
- Pull request: #20

> In the context of agdr.dev publishing the AgDR specification from another repository, facing a stale site copy (#12) and a source repository that has no release tag, we decided to vendor the files at a pinned commit, check them offline against recorded SHA-256 hashes, and sync them by hand, to keep builds and production deploys free of network dependencies, accepting that new upstream text reaches the site only when a person moves the pin.

## Context

- agdr.dev serves `SPEC.md`, `CHANGELOG.md`, and two JSON Schemas that come from `me2resh/agent-decision-record`.
- The site copy of `SPEC.md` was 105 lines. The source has 170 lines. Section 9, "JSON serialisation", was missing (#12).
- The source repository has no git tags. Its only GitHub Release, v1.2.0, is a draft. Its target commit predates section 9. Section 9 landed on `main` on 2026-09-20 (PR #27) with no version bump and no CHANGELOG entry.
- A merge to `main` in this repository deploys production. `promote-production.yml` runs `npm run check` before each deploy.

## Options considered

| Option | Pros | Cons |
|--------|------|------|
| A. Vendored copy + pinned commit + offline SHA-256 check + manual sync (chosen) | Builds and deploys need no network. The published text changes only through a reviewed PR. The check is fast and deterministic. | New upstream text does not reach the site until a person moves the pin. A scheduled report is needed to see upstream drift. |
| B. Fetch `SPEC.md` at build time | The site follows upstream with no manual step. | Every build and deploy depends on GitHub raw content (outage, rate limit, timeout). An unpinned fetch changes the public spec with no review in this repository. |
| C. Vendored copy + online diff check against the pin in `npm run check` (first version of PR #20) | Catches local edits. | Adds a network dependency to CI and to production deploys. Compares with an immutable pin, so it cannot see upstream drift anyway. |

## Decision

Chosen: **option A**.

- `scripts/agdr-spec-source.mjs` records the source repository, the pinned commit, and the SHA-256 of each vendored file.
- `npm run check` runs `scripts/check-agdr-spec-sync.mjs`. It hashes the local files and compares them with the recorded hashes. It uses no network.
- `npm run sync:agdr-spec` is the only step that fetches. It has a timeout, one retry, and a short error message. A person runs it after moving the pin, then copies the printed hashes into the source file.
- `.github/workflows/agdr-spec-drift.yml` runs weekly and on manual dispatch. It compares the pin with upstream `main` and fails when they differ. It never runs on pull requests and has read-only permissions.

## Section 9 status (maintainer decision)

The maintainer chose **option (b)**: keep AgDR 1.2.0 as the published version and publish section 9 marked as unreleased. No AgDR release happens now.

- The banner stays "AgDR 1.2.0 · Published".
- The specification page shows section 9 with a callout: it is not part of AgDR 1.2.0, it is draft text for the next release, and it can change. The JSON Schema link has the same status.
- The served `/agdr-spec.md` adds the same notice above section 9 at build time. The vendored `SPEC.md` stays byte-identical to the pinned commit.

When the source repository publishes a release that includes section 9, move the pin to that tag, re-sync, and remove the unreleased notice.

## Consequences

- Production deploys do not depend on GitHub raw content.
- A hand edit to a vendored file fails `npm run check`.
- Upstream changes show up as a red scheduled drift run, not as a broken build.
- Relative links inside the vendored `SPEC.md` (for example `examples/` and `CHANGELOG.md`) do not resolve on agdr.dev. This is a follow-up. The vendored file is not edited.

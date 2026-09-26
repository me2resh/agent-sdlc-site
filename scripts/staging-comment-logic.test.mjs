// Manual regression harness for the staging-comment logic in
// .github/workflows/deploy.yml (job `report-staging`, step "Add staging
// links to pull request").
//
// actions/github-script runs the workflow's script inline, with no
// checkout step in this job, so it cannot `require` a file from this
// repository. The functions below are a deliberate line-for-line mirror
// of the workflow's own `buildCurrentBody`, `buildSupersededBody`, and
// `CURRENT_MARKER_RE`, kept here so the marker format and comment shape
// stay covered by an automated check. If the workflow script changes,
// update this file to match in the same commit.
//
// Run manually: node scripts/staging-comment-logic.test.mjs
// Not wired into `npm run validate` — see the note above; keeping the
// two copies in sync is a per-commit discipline, not something
// `npm run validate` can verify on its own.

const STAGING_MARKER_HEADING = '### Staging deployment';
const CURRENT_MARKER_RE = /<!-- staging-owner: current pr=(\d+) -->/;

function buildCurrentBody({ prNumber, shortSha, commitUrl, deployedAtUtc }) {
  return [
    STAGING_MARKER_HEADING,
    '',
    `Staging now shows [${shortSha}](${commitUrl}), deployed ${deployedAtUtc} UTC, from this pull request:`,
    '',
    '- [Agent SDLC](https://standards.staging.apexyard.ai/)',
    '- [ORBIT](https://orbit.staging.standards.apexyard.ai/)',
    '- [AgDR](https://agdr.staging.standards.apexyard.ai/)',
    '',
    'Staging requires the configured basic-auth password.',
    '',
    'Staging is shared by every open pull request. The latest deploy wins, so this comment stops being current the moment another pull request deploys.',
    '',
    `<!-- staging-owner: current pr=${prNumber} -->`
  ].join('\n');
}

function buildSupersededBody({ prNumber, newPrNumber, newPrUrl }) {
  return [
    STAGING_MARKER_HEADING,
    '',
    `Staging now shows [pull request #${newPrNumber}](${newPrUrl}). Staging is shared, and this pull request's build is no longer on it.`,
    '',
    `<!-- staging-owner: superseded pr=${prNumber} -->`
  ].join('\n');
}

let failures = 0;

function assert(name, condition) {
  if (condition) {
    console.log(`ok - ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL - ${name}`);
  }
}

// The current comment names the deployed commit, its link, the UTC
// deploy time, and the shared-staging note, and carries the current
// marker for its own pull request number.
{
  const body = buildCurrentBody({
    prNumber: 42,
    shortSha: 'abc1234',
    commitUrl: 'https://github.com/me2resh/agent-sdlc-site/commit/abc1234000000000000000000000000000000',
    deployedAtUtc: '2026-09-26 03:10:00'
  });
  assert('current body links the short SHA', body.includes('[abc1234](https://github.com/me2resh/agent-sdlc-site/commit/abc1234000000000000000000000000000000)'));
  assert('current body states the UTC deploy time', body.includes('2026-09-26 03:10:00 UTC'));
  assert('current body states staging is shared and the latest deploy wins', body.includes('latest deploy wins'));
  assert('current body carries the current marker for its own PR', CURRENT_MARKER_RE.test(body) && Number(body.match(CURRENT_MARKER_RE)[1]) === 42);
}

// The superseded comment names the new PR by number and link, and no
// longer carries a "current" marker for the old PR — so a later scan
// for the current owner does not find it again.
{
  const body = buildSupersededBody({
    prNumber: 42,
    newPrNumber: 43,
    newPrUrl: 'https://github.com/me2resh/agent-sdlc-site/pull/43'
  });
  assert('superseded body names the new PR number', body.includes('pull request #43'));
  assert('superseded body links the new PR', body.includes('https://github.com/me2resh/agent-sdlc-site/pull/43'));
  assert('superseded body carries no current marker', !CURRENT_MARKER_RE.test(body));
}

// The marker regex only matches the exact current-marker shape, so a
// superseded comment or an unrelated HTML comment cannot be mistaken
// for ownership.
{
  assert('marker regex matches the current marker', CURRENT_MARKER_RE.test('<!-- staging-owner: current pr=7 -->'));
  assert('marker regex does not match the superseded marker', !CURRENT_MARKER_RE.test('<!-- staging-owner: superseded pr=7 -->'));
  assert('marker regex does not match an unrelated comment', !CURRENT_MARKER_RE.test('<!-- some-other-marker: pr=7 -->'));
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll staging-comment logic checks passed.');

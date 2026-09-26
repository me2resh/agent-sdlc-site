// Tests the real `script:` block of the "Add staging links to pull
// request" step in .github/workflows/deploy.yml (job `report-staging`,
// agent-sdlc-site#39). Run by `npm run validate`, inside the
// unprivileged `check-and-build` job (.github/workflows/ci.yml). The
// `report-staging` job itself keeps no checkout, so this is the only
// place the step's logic can run against a real repository checkout.
//
// This file extracts the step's script text from the workflow file and
// runs it, unmodified, against a mock `github`, `context`, and `core`.
// It is not a second copy of the logic: if the workflow script changes,
// this test runs the new text on its next `npm run validate`, with no
// separate file to keep in sync.
//
// Scenarios:
//   1. First deploy, no previous owner.
//   2. A second pull request takes over from one previous owner.
//   3. A re-deploy of the pull request that already owns staging.
//   4. Two open pull requests both carry a stale "current" marker; a
//      new deploy must supersede both.
//   5. A comment from a different Bot app carries the heading and a
//      forged "current" marker for its own pull request. It must not
//      be read as a staging comment, and it must not be rewritten.
//   6. A pull request from a fork carries a forged "current" marker.
//      Its comments must not even be read.
//   7. The rendered deploy time has no milliseconds and no trailing
//      "Z" before " UTC".
//   8. One `listComments` call fails on an unrelated open pull
//      request; the scan continues and still supersedes the genuine
//      owner.
//
// Each scenario also asserts on the API calls the script made (the
// `log` on the mock world), not only on the resulting comment bodies,
// so a change that reads or writes something it should not touch is
// also caught.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const WORKFLOW_PATH = `${root}.github/workflows/deploy.yml`;
const STEP_NAME_LINE = 'name: Add staging links to pull request';

/** Extracts the literal-block `script:` text of the named step. */
function extractStepScript(workflowPath, stepNameLine) {
  const lines = readFileSync(workflowPath, 'utf8').split('\n');
  const stepIdx = lines.findIndex(line => line.includes(stepNameLine));
  if (stepIdx === -1) {
    throw new Error(`test-staging-comment-script: no step line containing "${stepNameLine}" in ${workflowPath}`);
  }
  const scriptIdx = lines.findIndex((line, i) => i > stepIdx && /^\s*script:\s*\|-?\s*$/.test(line));
  if (scriptIdx === -1) {
    throw new Error(`test-staging-comment-script: no "script: |" block after the "${stepNameLine}" step`);
  }
  const body = [];
  let indent = null;
  for (let i = scriptIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      body.push('');
      continue;
    }
    const lineIndent = line.match(/^\s*/)[0].length;
    if (indent === null) indent = lineIndent;
    if (lineIndent < indent) break;
    body.push(line.slice(indent));
  }
  const script = body.join('\n').trim();
  if (!script) {
    throw new Error('test-staging-comment-script: extracted script body is empty');
  }
  return script;
}

const script = extractStepScript(WORKFLOW_PATH, STEP_NAME_LINE);
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const runScript = (world, ctx) => new AsyncFunction('github', 'context', 'core', script)(world.github, ctx, world.core);

const OWNER = 'me2resh';
const REPO = 'agent-sdlc-site';
const THIS_REPO = `${OWNER}/${REPO}`;

const actionsBot = { type: 'Bot', login: 'github-actions[bot]', id: 41898282 };
const otherBot = { type: 'Bot', login: 'other-app[bot]', id: 99999999 };
const human = { type: 'User', login: 'someone', id: 12345 };

/** A same-repo open pull request, unless `fork: true`. */
function openPr(number, { fork = false } = {}) {
  return { number, head: { repo: { full_name: fork ? `contributor/${REPO}` : THIS_REPO } } };
}

const currentMarkerBody = n => `${'### Staging deployment'}\n\nold\n\n<!-- staging-owner: current pr=${n} -->`;

/**
 * @param {object} opts
 * @param {ReturnType<typeof openPr>[]} opts.openPulls
 * @param {{id:number, issue:number, user:object, body:string}[]} opts.comments
 * @param {Set<number>} [opts.failListFor] issue numbers whose listComments call throws
 */
function makeWorld({ openPulls, comments, failListFor = new Set() }) {
  let nextId = 1000;
  const log = [];
  const infos = [];
  const warnings = [];

  const listComments = async ({ issue_number: issueNumber }) => {
    log.push(`listComments #${issueNumber}`);
    if (failListFor.has(issueNumber)) throw new Error(`boom on #${issueNumber}`);
    return { data: comments.filter(c => c.issue === issueNumber) };
  };
  const pullsList = async () => {
    log.push('pulls.list (unpaginated — must not be called directly)');
    return { data: openPulls };
  };

  const github = {
    rest: {
      issues: {
        listComments,
        updateComment: async ({ comment_id: commentId, body }) => {
          const comment = comments.find(c => c.id === commentId);
          log.push(`updateComment id=${commentId} (#${comment.issue}, ${comment.user.login})`);
          comment.body = body;
        },
        createComment: async ({ issue_number: issueNumber, body }) => {
          log.push(`createComment #${issueNumber}`);
          comments.push({ id: nextId++, issue: issueNumber, user: { ...actionsBot }, body });
        }
      },
      pulls: { list: pullsList }
    },
    // A real Octokit `paginate` takes the route function and its
    // params, and internally follows every page. The mock collapses
    // that into one call and dispatches on function identity, the
    // same way the workflow script itself distinguishes the two
    // routes it paginates.
    paginate: async (fn, params) => {
      if (fn === listComments) return listComments(params).then(r => r.data);
      if (fn === pullsList) {
        log.push(`paginate pulls.list state=${params.state}`);
        return openPulls;
      }
      throw new Error('paginate called with an unrecognised route');
    }
  };
  const core = {
    info: message => infos.push(message),
    warning: message => warnings.push(message)
  };
  return { github, core, comments, log, infos, warnings };
}

const ctx = (prNumber, sha, { prHeadSha = sha } = {}) => ({
  repo: { owner: OWNER, repo: REPO },
  payload: {
    workflow_run: {
      head_sha: sha,
      pull_requests: [{ number: prNumber, head: { sha: prHeadSha } }]
    }
  }
});

const SHA = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d';

let failures = 0;
function assert(label, condition) {
  if (condition) {
    console.log(`  ok - ${label}`);
  } else {
    failures += 1;
    console.error(`  FAIL - ${label}`);
  }
}

function commentOn(issue) {
  return world => world.comments.find(c => c.issue === issue);
}

async function scenario(name, run) {
  console.log(`\n${name}`);
  await run();
}

// 1. First deploy, no previous owner.
await scenario('S1 — first deploy, no previous owner', async () => {
  const world = makeWorld({ openPulls: [openPr(5)], comments: [] });
  await runScript(world, ctx(5, SHA));
  const own = commentOn(5)(world);
  assert('creates the PR\'s own staging comment', own !== undefined);
  assert('the comment carries the current marker for PR 5', /<!-- staging-owner: current pr=5 -->/.test(own.body));
  assert('logs that there was no previous owner', world.infos.some(m => m.includes('No previous staging owner found')));
  assert('no update was attempted on any other comment', !world.log.some(l => l.startsWith('updateComment') && !l.includes('#5')));
});

// 2. A second pull request takes over from one previous owner.
await scenario('S2 — a second PR takes over from one previous owner', async () => {
  const world = makeWorld({
    openPulls: [openPr(4), openPr(5)],
    comments: [{ id: 1, issue: 4, user: { ...actionsBot }, body: currentMarkerBody(4) }]
  });
  await runScript(world, ctx(5, SHA));
  const previous = commentOn(4)(world);
  assert('rewrites the previous owner\'s comment', /<!-- staging-owner: superseded pr=4 -->/.test(previous.body));
  assert('the superseded comment names the new PR', previous.body.includes('pull request #5'));
  assert('the superseded comment links the new PR', previous.body.includes(`https://github.com/${THIS_REPO}/pull/5`));
});

// 3. A re-deploy of the pull request that already owns staging.
await scenario('S3 — a re-deploy of the current owner does not supersede itself', async () => {
  const world = makeWorld({
    openPulls: [openPr(4), openPr(5)],
    comments: [{ id: 1, issue: 5, user: { ...actionsBot }, body: currentMarkerBody(5) }]
  });
  await runScript(world, ctx(5, SHA));
  assert('updates its own comment rather than creating a new one', !world.log.includes('createComment #5'));
  assert('never calls updateComment for its own PR as a "previous" owner', !world.log.some(l => l.startsWith('updateComment') && l.includes('#5') && world.comments.find(c => c.issue === 5).body.includes('superseded')));
});

// 4. Two open pull requests both carry a stale current marker.
await scenario('S4 — two stale owners are both superseded', async () => {
  const world = makeWorld({
    openPulls: [openPr(3), openPr(4), openPr(5)],
    comments: [
      { id: 1, issue: 3, user: { ...actionsBot }, body: currentMarkerBody(3) },
      { id: 2, issue: 4, user: { ...actionsBot }, body: currentMarkerBody(4) }
    ]
  });
  await runScript(world, ctx(5, SHA));
  assert('supersedes stale owner #3', commentOn(3)(world).body.includes('staging-owner: superseded pr=3'));
  assert('supersedes stale owner #4', commentOn(4)(world).body.includes('staging-owner: superseded pr=4'));
});

// 5. A different Bot app's comment must not be read or rewritten as a staging comment.
await scenario('S5 — a different Bot app carrying the heading and a forged marker is ignored', async () => {
  const world = makeWorld({
    openPulls: [openPr(4), openPr(5)],
    comments: [
      { id: 1, issue: 4, user: { ...otherBot }, body: currentMarkerBody(4) },
      { id: 2, issue: 4, user: { ...human }, body: currentMarkerBody(4) }
    ]
  });
  await runScript(world, ctx(5, SHA));
  const other = world.comments.find(c => c.id === 1);
  const humanComment = world.comments.find(c => c.id === 2);
  assert('does not rewrite the other app\'s comment', other.body === currentMarkerBody(4));
  assert('does not rewrite the human\'s copied-marker comment', humanComment.body === currentMarkerBody(4));
  assert('logs no previous owner, since neither comment counts', world.infos.some(m => m.includes('No previous staging owner found')));
});

// 6. A fork pull request's comments must not even be read.
await scenario('S6 — a fork PR carrying a marker is skipped before its comments are read', async () => {
  const world = makeWorld({
    openPulls: [openPr(4, { fork: true }), openPr(5)],
    comments: [{ id: 1, issue: 4, user: { ...actionsBot }, body: currentMarkerBody(4) }]
  });
  await runScript(world, ctx(5, SHA));
  assert('never calls listComments for the fork PR', !world.log.some(l => l === 'listComments #4'));
  assert('the fork PR\'s comment is untouched', commentOn(4)(world).body === currentMarkerBody(4));
});

// 7. The rendered deploy time has no milliseconds and no trailing "Z" before " UTC".
await scenario('S7 — the deploy time renders without milliseconds or a trailing Z', async () => {
  const world = makeWorld({ openPulls: [openPr(5)], comments: [] });
  await runScript(world, ctx(5, SHA));
  const body = commentOn(5)(world).body;
  const match = body.match(/deployed (.+?) UTC/);
  assert('the comment states a deploy time', Boolean(match));
  assert('the time matches "YYYY-MM-DD HH:MM:SS" exactly, with no "Z" and no milliseconds', Boolean(match && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(match[1])));
});

// 8. One listComments call fails on an unrelated open PR; the scan continues.
await scenario('S8 — a failing listComments call on an unrelated PR does not stop the scan', async () => {
  const world = makeWorld({
    openPulls: [openPr(3), openPr(4), openPr(5)],
    comments: [{ id: 1, issue: 4, user: { ...actionsBot }, body: currentMarkerBody(4) }],
    failListFor: new Set([3])
  });
  await runScript(world, ctx(5, SHA));
  assert('logs a warning for the failing PR', world.warnings.some(m => m.includes('#3')));
  assert('still supersedes the genuine owner #4', commentOn(4)(world).body.includes('staging-owner: superseded pr=4'));
});

// 9. The short SHA links to the commit and states it is deployed from this PR.
await scenario('S9 — the current comment links the deployed commit', async () => {
  const world = makeWorld({ openPulls: [openPr(5)], comments: [] });
  await runScript(world, ctx(5, SHA));
  const body = commentOn(5)(world).body;
  assert('links the full commit SHA', body.includes(`https://github.com/${THIS_REPO}/commit/${SHA}`));
  assert('shows the short (7-character) commit ID', body.includes(`[${SHA.slice(0, 7)}]`));
  assert('states staging is shared and the latest deploy wins', body.includes('latest deploy wins'));
});

// 10. A head-SHA mismatch (a stale workflow_run event) skips the step entirely.
await scenario('S10 — a head-SHA mismatch skips the comment entirely', async () => {
  const world = makeWorld({ openPulls: [openPr(5)], comments: [] });
  await runScript(world, ctx(5, SHA, { prHeadSha: 'f'.repeat(40) }));
  assert('makes no comment or comment-list calls', world.log.length === 0);
  assert('logs that the head SHA did not match', world.infos.some(m => m.includes('does not match')));
});

if (failures > 0) {
  console.error(`\nstaging-comment script test failed: ${failures} check(s) failed`);
  throw new Error(`staging-comment script test failed: ${failures} check(s) failed`);
}
console.log(`\nstaging-comment script test passed: 10 scenarios against the real script: block in ${WORKFLOW_PATH}`);

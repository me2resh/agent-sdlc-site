// Self-test for scripts/lib/github-link-scan.mjs. Runs in `npm run validate`.
//
// Each "must flag" case plants one link to an unlisted repository in a
// different URL form and asserts the scanner reports it. Each "must pass"
// case asserts that a link to a listed repository, or a GitHub URL that
// names no repository, is not reported. Nothing is written to disk.

import { unlistedGithubLinks } from './lib/github-link-scan.mjs';

const allowList = ['listed-owner/listed-repo'];
const unlisted = 'hidden-owner/hidden-repo';

/** @type {[string, string][]} name, text */
const mustFlag = [
  ['https URL in href', '<a href="https://github.com/hidden-owner/hidden-repo">x</a>'],
  ['http URL', '<a href="http://github.com/hidden-owner/hidden-repo">x</a>'],
  ['upper-case host', '<a href="https://GitHub.com/hidden-owner/hidden-repo">x</a>'],
  ['upper-case scheme', '<a href="HTTPS://github.com/hidden-owner/hidden-repo">x</a>'],
  ['scheme-less URL', '<a href="//github.com/hidden-owner/hidden-repo">x</a>'],
  ['URL with a port', '<a href="https://github.com:443/hidden-owner/hidden-repo">x</a>'],
  ['www host', '<a href="https://www.github.com/hidden-owner/hidden-repo">x</a>'],
  ['issues/new path', '<a href="https://github.com/hidden-owner/hidden-repo/issues/new">x</a>'],
  ['clone URL with .git', 'git clone https://github.com/hidden-owner/hidden-repo.git'],
  ['raw.githubusercontent.com', '<script src="https://raw.githubusercontent.com/hidden-owner/hidden-repo/main/a.js"></script>'],
  ['api.github.com/repos', 'fetch("https://api.github.com/repos/hidden-owner/hidden-repo/releases")'],
  ['codeload.github.com', '<a href="https://codeload.github.com/hidden-owner/hidden-repo/zip/refs/heads/main">zip</a>'],
  ['plain text URL at sentence end', 'Source: https://github.com/hidden-owner/hidden-repo.'],
  ['URL in JSON', '{"source":"https://github.com/hidden-owner/hidden-repo"}']
];

/** @type {[string, string][]} name, text */
const mustPass = [
  ['listed repo', '<a href="https://github.com/listed-owner/listed-repo">x</a>'],
  ['listed repo, other letter case', '<a href="HTTPS://GitHub.com/Listed-Owner/Listed-Repo/blob/main/a.md">x</a>'],
  ['listed repo, scheme-less with a port', '<a href="//github.com:443/listed-owner/listed-repo">x</a>'],
  ['listed repo, clone URL with .git', 'git clone https://github.com/listed-owner/listed-repo.git'],
  ['listed repo on api.github.com/repos', 'https://api.github.com/repos/listed-owner/listed-repo'],
  ['listed repo on codeload.github.com', 'https://codeload.github.com/listed-owner/listed-repo/zip/main'],
  ['api.github.com URL that names no repo', 'https://api.github.com/users/hidden-owner/repos'],
  ['GitHub home page', '<a href="https://github.com/">GitHub</a>'],
  ['other host', '<a href="https://example.com/hidden-owner/hidden-repo">x</a>']
];

let failures = 0;
for (const [name, text] of mustFlag) {
  const found = unlistedGithubLinks(text, allowList);
  if (found.length !== 1 || found[0].repo !== unlisted) {
    failures++;
    console.error(`  MISSED  ${name}: ${JSON.stringify(found)}`);
  }
}
for (const [name, text] of mustPass) {
  const found = unlistedGithubLinks(text, allowList);
  if (found.length > 0) {
    failures++;
    console.error(`  FALSE POSITIVE  ${name}: ${JSON.stringify(found)}`);
  }
}

if (failures > 0) throw new Error(`external link scanner self-test failed: ${failures} case(s)`);
console.log(`external link scanner self-test passed: ${mustFlag.length} planted links caught, ${mustPass.length} allowed or non-repository links ignored`);

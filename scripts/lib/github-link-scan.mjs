// Finds GitHub repository links in text (agent-sdlc-site#23).
// scripts/validate-external-links.mjs uses it on each built file, and
// scripts/validate-external-links.selftest.mjs tests it with planted links.
//
// It finds these forms, in any letter case, with or without a scheme
// ("//github.com/..."), and with or without a port ("github.com:443/..."):
//   - github.com/<owner>/<repo> and www.github.com/<owner>/<repo>
//   - raw.githubusercontent.com/<owner>/<repo>
//   - codeload.github.com/<owner>/<repo>
//   - api.github.com/repos/<owner>/<repo>

// Groups: 1 host, 2 "repos/" segment, 3 owner, 4 repository.
const GITHUB_URL = /(?:https?:)?\/\/((?:www\.)?github\.com|raw\.githubusercontent\.com|codeload\.github\.com|api\.github\.com)(?::\d+)?\/(repos\/)?([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)/gi;

/**
 * The GitHub repository links in a text.
 * @param {string} text
 * @returns {{ url: string, repo: string }[]} repo is "<owner>/<repo>" in lower case
 */
export function githubRepoLinks(text) {
  /** @type {{ url: string, repo: string }[]} */
  const links = [];
  for (const [url, rawHost, reposSegment, rawOwner, rawRepo] of text.matchAll(GITHUB_URL)) {
    const host = rawHost.toLowerCase();
    // An api.github.com URL names a repository only under /repos/.
    if (host === 'api.github.com' && !reposSegment) continue;
    // On the other hosts, "repos" is an owner name, and the next segment is the repository.
    const owner = host === 'api.github.com' ? rawOwner : reposSegment ? 'repos' : rawOwner;
    const repoName = host === 'api.github.com' || !reposSegment ? rawRepo : rawOwner;
    // A sentence can end with the URL, and a clone URL ends with ".git".
    const repo = repoName.replace(/\.git$/i, '').replace(/\.+$/, '');
    links.push({ url, repo: `${owner}/${repo}`.toLowerCase() });
  }
  return links;
}

/**
 * The links in a text to a repository that is not on the allow list.
 * @param {string} text
 * @param {readonly string[]} allowList "<owner>/<repo>" entries
 */
export function unlistedGithubLinks(text, allowList) {
  const allowed = new Set(allowList.map(repo => repo.toLowerCase()));
  return githubRepoLinks(text).filter(link => !allowed.has(link.repo));
}

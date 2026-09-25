// Checks the GitHub links in each site build (agent-sdlc-site#23).
// Run by `npm run validate` after `npm run build:all`.
//
// It fails when a built text file (HTML, XML, TXT, MD, JSON) links to a
// GitHub repository that is not in config/public-repos.ts. It checks
// github.com and raw.githubusercontent.com URLs. It makes no network call.
//
// Usage: node scripts/validate-external-links.mjs [dist directory]
// The default directory is apps/site/dist.
//
// Node strips the TypeScript types of the imported config module.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicGitHubRepos } from '../config/public-repos.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = process.argv[2] ?? join(root, 'apps/site/dist');
const TEXT_EXTENSIONS = new Set(['.html', '.xml', '.txt', '.md', '.json']);
const allowed = new Set(publicGitHubRepos.map(repo => repo.toLowerCase()));

// Owner and repository segments of a GitHub URL. A repository name can
// contain letters, digits, '.', '-', and '_'.
const GITHUB_URL = /https?:\/\/(?:www\.)?(?:github\.com|raw\.githubusercontent\.com)\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)/g;

/** @param {string} dir @returns {string[]} */
function textFiles(dir) {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return textFiles(path);
    return TEXT_EXTENSIONS.has(extname(name)) ? [path] : [];
  });
}

/** @type {string[]} */
const problems = [];
let linkCount = 0;
for (const path of textFiles(dist)) {
  const text = readFileSync(path, 'utf8');
  for (const [url, owner, rawRepo] of text.matchAll(GITHUB_URL)) {
    // A sentence can end with the URL, and a clone URL ends with ".git".
    const repo = rawRepo.replace(/\.git$/, '').replace(/\.+$/, '');
    linkCount += 1;
    if (!allowed.has(`${owner}/${repo}`.toLowerCase())) {
      problems.push(`${relative(dist, path)}: ${url} goes to ${owner}/${repo}, which is not in config/public-repos.ts`);
    }
  }
}

if (problems.length) {
  console.error(`external link validation failed: ${problems.length} link(s) go to a GitHub repository that is not on the public list`);
  for (const problem of [...new Set(problems)]) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`external link validation passed: ${linkCount} GitHub links go to ${allowed.size} listed public repositories`);

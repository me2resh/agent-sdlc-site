// Checks the GitHub links in each site build (agent-sdlc-site#23).
// Run by `npm run validate` after `npm run build:all`.
//
// It fails when a built text file (HTML, XML, TXT, MD, JSON) links to a
// GitHub repository that is not in config/public-repos.ts. A private
// repository returns 404 to a public visitor, so a link to one is a broken
// link on a public page. scripts/lib/github-link-scan.mjs lists the URL
// forms it finds. The check makes no network call.
//
// Usage: node scripts/validate-external-links.mjs [dist directory]
// The default directory is apps/site/dist.
//
// Node strips the TypeScript types of the imported config module.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicGitHubRepos } from '../config/public-repos.ts';
import { githubRepoLinks, unlistedGithubLinks } from './lib/github-link-scan.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = process.argv[2] ?? join(root, 'apps/site/dist');
const TEXT_EXTENSIONS = new Set(['.html', '.xml', '.txt', '.md', '.json']);

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
  linkCount += githubRepoLinks(text).length;
  for (const { url, repo } of unlistedGithubLinks(text, publicGitHubRepos)) {
    problems.push(`${relative(dist, path)}: ${url} goes to ${repo}, which is not in config/public-repos.ts`);
  }
}

if (problems.length) {
  console.error(`external link validation failed: ${problems.length} link(s) go to a GitHub repository that is not on the public list`);
  for (const problem of [...new Set(problems)]) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`external link validation passed: ${linkCount} GitHub links go to ${publicGitHubRepos.length} listed public repositories`);

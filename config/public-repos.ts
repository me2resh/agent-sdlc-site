// The GitHub repositories that the built sites may link to
// (agent-sdlc-site#23). Each entry is a public repository.
//
// scripts/validate-external-links.mjs fails the build when a built file
// links to a GitHub repository that is not in this list. The check makes no
// network call. Before you add a repository here, make sure it is public.
export const publicGitHubRepos: readonly string[] = [
  'me2resh/agent-sdlc-site',
  'me2resh/orbit-spec',
  'me2resh/agent-decision-record'
];

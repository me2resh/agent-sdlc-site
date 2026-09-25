# Agent SDLC standards sites

This repository publishes the Agent SDLC ecosystem and its independent ORBIT and AgDR reference sites.

The site uses a static-first Astro application. Shared design tokens live in `packages/design-system`. Content and domain configuration stay separate from shared presentation code.

## Development

```sh
npm install
npm run dev
npm run check
npm run build
```

Canonical domains are configured through the standards registry. Provisional ApexYard subdomains are deployment configuration, not content assumptions.

## Deployment

Two workflows build the sites. "Site checks" (`ci.yml`) builds and checks
every pull request, including a fork pull request, under the `pull_request`
event. This event gives the job a read-only token, no repository secrets,
and a build cache scoped to that one pull request. It uploads the built
site as an artifact.

"Deploy standards sites to staging" (`deploy.yml`) runs after "Site checks"
completes. It downloads that artifact and publishes it to protected
staging, but only when GitHub's own record of the completed run shows the
pull request's head repository as this same repository. It does not
check out or run the pull request's code itself, so a fork pull request
never reaches the staging AWS role. To redeploy staging for the same
pull request, re-run the pull request's "Site checks" workflow run, or
re-run the "Deploy standards sites to staging" run, from the Actions
page. A merge to `main` builds and publishes production automatically
("Promote standards sites to production", `promote-production.yml`). A
manual production dispatch remains available for an explicit retry; it
always builds and deploys the commit already on `main`. AWS access uses
GitHub OIDC in every case.

Configure these values as environment secrets, not repository variables
and not repository secrets, before enabling deployment:

- On the `staging` environment: `STAGING_ROLE_ARN`, `STAGING_BUCKET`, `STAGING_DISTRIBUTION`
- On the `production` environment: `PRODUCTION_ROLE_ARN`, `PRODUCTION_BUCKET`, `PRODUCTION_DISTRIBUTION`

An environment secret is available only to a job that names that
environment, so a workflow run outside the deploy jobs above cannot read
these values. GitHub does not mask a variable's value in workflow logs.
GitHub masks a secret's value.

The three site builds share one CloudFront distribution and S3 origin. Each
site is uploaded under its own prefix (`agentsdlc/`, `orbit/`, `agdr/`) and the
edge rewrite selects the prefix from the requested host.

The AWS role must trust this repository's GitHub OIDC subject. Keep staging
domains protected and noindexed in the infrastructure layer. Canonical domains
remain in `config/standards.ts`, so deployment hostnames can change without
changing the published identity of a standard.

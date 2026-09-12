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

The deployment workflow builds all three sites once and publishes them to the
protected `staging` GitHub environment. Production is a separate manual
workflow: start `Promote standards sites to production` after you inspect
staging. This remains an explicit thumbs-up even when the GitHub plan does not
support required-reviewer environment rules. AWS access uses GitHub OIDC.

Configure these environment variables in both GitHub environments before
enabling deployment:

- `AWS_ROLE_ARN`
- `STAGING_BUCKET`, `STAGING_DISTRIBUTION`
- `PRODUCTION_BUCKET`, `PRODUCTION_DISTRIBUTION`

The three site builds share one CloudFront distribution and S3 origin. Each
site is uploaded under its own prefix (`agentsdlc/`, `orbit/`, `agdr/`) and the
edge rewrite selects the prefix from the requested host.

The AWS role must trust this repository's GitHub OIDC subject. Keep staging
domains protected and noindexed in the infrastructure layer. Canonical domains
remain in `config/standards.ts`, so deployment hostnames can change without
changing the published identity of a standard.

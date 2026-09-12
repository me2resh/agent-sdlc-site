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

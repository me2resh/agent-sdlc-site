import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const required = [
  'apps/site/src/layouts/StandardLayout.astro',
  'apps/site/src/pages/index.astro',
  'apps/site/src/pages/robots.txt.ts',
  'config/standards.ts'
];
for (const file of required) {
  if (!existsSync(join(root, file))) throw new Error(`Missing required site file: ${file}`);
}
const registry = readFileSync(join(root, 'config/standards.ts'), 'utf8');
for (const domain of ['agentsdlc.ai', 'orbitspec.dev', 'agdr.dev']) {
  if (!registry.includes(domain)) throw new Error(`Missing canonical domain: ${domain}`);
}
for (const site of ['agentsdlc', 'orbit', 'agdr']) {
  const index = join(root, 'apps/site/dist', site, 'index.html');
  if (!existsSync(index)) throw new Error(`Missing built entrypoint: ${index}`);
}
console.log('site validation passed: registry, required files, and all site builds are present');

// Sitemaps, canonical URLs, favicons, and social tags (agent-sdlc-site#15).
await import('./validate-sitemaps.mjs');

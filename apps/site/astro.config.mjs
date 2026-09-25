import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { standards } from '../../config/standards.ts';

const siteKey = process.env.PUBLIC_SITE_KEY || 'agentsdlc';
/** @type {keyof typeof standards} */
const key = siteKey === 'orbit' || siteKey === 'agdr' ? siteKey : 'agentsdlc';

export default defineConfig({
  output: 'static',
  // The canonical domain comes from the standards registry, never from a
  // staging or deployment host.
  site: standards[key].canonicalUrl,
  // One URL form for every page: no trailing slash (agent-sdlc-site#15).
  // The canonical tag, og:url, and sitemap.xml all use this form. See
  // src/lib/seo.ts. The build still writes <path>/index.html, which the
  // CloudFront edge function serves for the request "/<path>".
  trailingSlash: 'never',
  build: { format: 'directory' },
  outDir: fileURLToPath(new URL(`./dist/${key}/`, import.meta.url))
});

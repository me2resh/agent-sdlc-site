import { defineConfig } from 'astro/config';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { standards } from '../../config/standards.ts';
import { redirectsDocument } from '../../config/redirects.ts';
import { routes } from './src/lib/routes.ts';

const siteKey = process.env.PUBLIC_SITE_KEY || 'agentsdlc';
/** @type {keyof typeof standards} */
const key = siteKey === 'orbit' || siteKey === 'agdr' ? siteKey : 'agentsdlc';

/**
 * Builds each page only for the sites that own it (agent-sdlc-site#31).
 * A page under src/routes/ is not a file-system route. This integration
 * injects it only when the route registry (src/lib/routes.ts) assigns it to
 * the site of this build. After the build, it writes the redirect map of
 * the site to dist/<site>/_redirects.json.
 * @returns {import('astro').AstroIntegration}
 */
function siteRoutes() {
  return {
    name: 'site-routes',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        for (const route of routes[key]) {
          if (!route.source.startsWith('routes/')) continue;
          injectRoute({ pattern: route.path, entrypoint: `./src/${route.source}`, prerender: true });
        }
      },
      'astro:build:done': ({ dir }) => {
        writeFileSync(new URL('_redirects.json', dir), `${JSON.stringify(redirectsDocument(key), null, 2)}\n`);
      }
    }
  };
}

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
  outDir: fileURLToPath(new URL(`./dist/${key}/`, import.meta.url)),
  integrations: [siteRoutes()]
});

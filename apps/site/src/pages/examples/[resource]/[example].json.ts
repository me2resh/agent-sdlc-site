import type { APIRoute } from 'astro';
import { currentSite } from '../../../lib/site';
import { hasRoute } from '../../../lib/routes';
import { resources } from '../../../data/orbit/resources';

export const prerender = true;
// The route registry (src/lib/routes.ts) decides which sites build these files (#31).
export function getStaticPaths() {
  const site = currentSite(import.meta.env.PUBLIC_SITE_KEY);
  return resources.flatMap(resource => resource.examples
    .filter(example => hasRoute(site, `/examples/${resource.key}/${example.slug}.json`))
    .map(example => ({ params: { resource: resource.key, example: `${example.slug}` }, props: { resource, example } })));
}

export const GET: APIRoute = ({ props }) => {
  const example = props.example as { record: unknown } | undefined;
  return example ? new Response(JSON.stringify(example.record, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300, must-revalidate' } }) : new Response('Not found', { status: 404 });
};

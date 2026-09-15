import type { APIRoute } from 'astro';
import { currentSite } from '../../../lib/site';
import { resources } from '../../../data/orbit/resources';

export const prerender = true;
export function getStaticPaths() {
  if (currentSite(import.meta.env.PUBLIC_SITE_KEY) !== 'orbit') return [];
  return resources.flatMap(resource => resource.examples.map(example => ({ params: { resource: resource.key, example: `${example.slug}` }, props: { resource, example } })));
}

export const GET: APIRoute = ({ props }) => {
  const example = props.example as { record: unknown } | undefined;
  return example ? new Response(JSON.stringify(example.record, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300, must-revalidate' } }) : new Response('Not found', { status: 404 });
};

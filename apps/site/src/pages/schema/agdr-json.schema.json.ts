import type { APIRoute } from 'astro';
import { currentSite } from '../../lib/site';
import schema from '../../data/agdr/agdr-json.schema.json';

export const prerender = true;
export const GET: APIRoute = () => {
  if (currentSite(import.meta.env.PUBLIC_SITE_KEY) !== 'agdr') return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(schema, null, 2), { headers: { 'Content-Type': 'application/schema+json; charset=utf-8' } });
};

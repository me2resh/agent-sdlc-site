import type { APIRoute } from 'astro';
import { currentSite } from '../../lib/site';
import plan from '../../data/orbit/plan.schema.json';
import snapshot from '../../data/orbit/project-snapshot.schema.json';
import reconciliation from '../../data/orbit/reconciliation.schema.json';
import slice from '../../data/orbit/execution-slice.schema.json';

const schemas: Record<string, unknown> = {
  'orbit-plan': plan,
  'project-snapshot': snapshot,
  reconciliation,
  'execution-slice': slice,
  'plan.schema': plan,
  'project-snapshot.schema': snapshot,
  'reconciliation.schema': reconciliation,
  'execution-slice.schema': slice
};
export const prerender = true;
export function getStaticPaths() { return Object.keys(schemas).map(name => ({ params: { name } })); }
export const GET: APIRoute = ({ params }) => {
  if (currentSite(import.meta.env.PUBLIC_SITE_KEY) !== 'orbit') return new Response('Not found', { status: 404 });
  const value = schemas[params.name ?? ''];
  return value ? new Response(JSON.stringify(value, null, 2), { headers: { 'Content-Type': 'application/schema+json; charset=utf-8', 'Cache-Control': 'public, max-age=300, must-revalidate' } }) : new Response('Not found', { status: 404 });
};

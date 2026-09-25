import type { APIRoute } from 'astro';
import { currentSite } from '../../lib/site';
import { hasRoute } from '../../lib/routes';
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
// The route registry (src/lib/routes.ts) decides which sites build these files (#31).
// The ORBIT build emits them; the agentsdlc.ai and AgDR builds do not.
export function getStaticPaths() {
  const site = currentSite(import.meta.env.PUBLIC_SITE_KEY);
  return Object.keys(schemas).filter(name => hasRoute(site, `/schema/${name}.json`)).map(name => ({ params: { name } }));
}
export const GET: APIRoute = ({ params }) => {
  const value = schemas[params.name ?? ''];
  return value ? new Response(JSON.stringify(value, null, 2), { headers: { 'Content-Type': 'application/schema+json; charset=utf-8', 'Cache-Control': 'public, max-age=300, must-revalidate' } }) : new Response('Not found', { status: 404 });
};

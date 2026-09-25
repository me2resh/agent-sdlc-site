import type { APIRoute } from 'astro';
import schema from '../../data/agdr/agdr-json.schema.json';

// AgDR only. The route registry (src/lib/routes.ts) injects this file for agdr.dev (#31).
export const prerender = true;
export const GET: APIRoute = () => new Response(JSON.stringify(schema, null, 2), { headers: { 'Content-Type': 'application/schema+json; charset=utf-8' } });

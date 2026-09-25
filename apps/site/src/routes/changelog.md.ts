import type { APIRoute } from 'astro';
import changelog from '../data/agdr/CHANGELOG.md?raw';

// AgDR only. The route registry (src/lib/routes.ts) injects this file for agdr.dev (#31).
export const prerender = true;
export const GET: APIRoute = () => new Response(changelog, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });

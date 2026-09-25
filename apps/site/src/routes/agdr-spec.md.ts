import type { APIRoute } from 'astro';
import { withUnreleasedNotice } from '../lib/agdr-unreleased';
import spec from '../data/agdr/SPEC.md?raw';

// AgDR only. The route registry (src/lib/routes.ts) injects this file for agdr.dev (#31).
export const prerender = true;
export const GET: APIRoute = () => new Response(withUnreleasedNotice(spec), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });

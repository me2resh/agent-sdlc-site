import type { APIRoute } from 'astro';
import { currentSite } from '../lib/site';
import changelog from '../data/agdr/CHANGELOG.md?raw';

export const prerender = true;
export const GET: APIRoute = () => {
  if (currentSite(import.meta.env.PUBLIC_SITE_KEY) !== 'agdr') return new Response('Not found', { status: 404 });
  return new Response(changelog, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};

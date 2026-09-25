import type { APIRoute } from 'astro';
import { currentSite } from '../lib/site';
import { brandSources } from '../lib/brand-files';

export const prerender = true;
// The site mark on an accent tile. Colors come from the design tokens.
export const GET: APIRoute = () =>
  new Response(brandSources(currentSite(import.meta.env.PUBLIC_SITE_KEY)).favicon, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' }
  });

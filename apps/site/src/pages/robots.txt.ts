import type { APIRoute } from 'astro';
import { currentSite, sites } from '../lib/site';

export const prerender = true;
export const GET: APIRoute = () => {
  const site = sites[currentSite(import.meta.env.PUBLIC_SITE_KEY)];
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${site.canonicalUrl}/sitemap.xml\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

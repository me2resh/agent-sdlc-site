import type { APIRoute } from 'astro';
import { currentSite } from '../lib/site';
import { canonicalUrl } from '../lib/seo';

export const prerender = true;
export const GET: APIRoute = () => {
  const key = currentSite(import.meta.env.PUBLIC_SITE_KEY);
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${canonicalUrl(key, '/sitemap.xml')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

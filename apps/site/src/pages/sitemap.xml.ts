import type { APIRoute } from 'astro';
import { currentSite } from '../lib/site';
import { canonicalUrl, sitemapRoutes } from '../lib/seo';

export const prerender = true;
// Each <loc> is the canonical URL of the page, in the same form as the
// page's <link rel="canonical">. scripts/validate-sitemaps.mjs checks this
// list against the built pages.
export const GET: APIRoute = () => {
  const key = currentSite(import.meta.env.PUBLIC_SITE_KEY);
  const body = sitemapRoutes[key].map(path => `<url><loc>${canonicalUrl(key, path)}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

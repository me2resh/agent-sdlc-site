import type { APIRoute } from 'astro';
import { currentSite, sites } from '../lib/site';

export const prerender = true;
export const GET: APIRoute = () => {
  const key = currentSite(import.meta.env.PUBLIC_SITE_KEY);
  const routes = key === 'agentsdlc' ? ['', '/standards', '/interoperability', '/governance', '/implementations', '/contribute'] : key === 'orbit' ? ['', '/concepts', '/quick-start', '/specification', '/schemas', '/adopter-guide', '/reconciliation', '/execution-slices', '/examples', '/conformance', '/changelog'] : ['', '/quick-start', '/specification', '/schema', '/examples', '/integrations', '/conformance', '/related-standards', '/changelog'];
  const base = sites[key].canonicalUrl;
  const body = routes.map(path => `<url><loc>${base}${path}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

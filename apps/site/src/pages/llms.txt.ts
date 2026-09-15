import type { APIRoute } from 'astro';
import { currentSite, sites } from '../lib/site';

export const GET: APIRoute = () => {
  const key = currentSite(import.meta.env.PUBLIC_SITE_KEY);
  const base = sites[key].canonicalUrl;
  const text = key === 'agdr'
    ? `# AgDR\n\nAgDR is the Agent Decision Record specification. Version 1.2.0 is published.\n\n- Specification: ${base}/specification\n- Schema: ${base}/schema/agdr.schema.json\n- Examples: ${base}/examples\n- Source: ${sites.agdr.sourceRepo}`
    : key === 'orbit'
      ? `# ORBIT\n\nORBIT is the Planning and Reconciliation Specification. Version 0.1 is a draft.\n\n- Concepts: ${base}/concepts\n- Quick start: ${base}/quick-start\n- Specification: ${base}/specification\n- Resources and schemas: ${base}/schemas\n- Plan resource: ${base}/schemas/plan\n- ProjectSnapshot resource: ${base}/schemas/project-snapshot\n- Reconciliation resource: ${base}/schemas/reconciliation\n- ExecutionSlice resource: ${base}/schemas/execution-slice\n- Raw schemas: ${base}/schema/plan.schema.json, ${base}/schema/project-snapshot.schema.json, ${base}/schema/reconciliation.schema.json, ${base}/schema/execution-slice.schema.json\n- Source: ${sites.orbit.sourceRepo}`
      : `# Agent SDLC\n\nAgent SDLC is a family of open standards for agentic software engineering.\n\n- ORBIT: ${sites.orbit.canonicalUrl}\n- AgDR: ${sites.agdr.canonicalUrl}\n- Interoperability: ${base}/interoperability\n- Source: ${sites.agentsdlc.sourceRepo}`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

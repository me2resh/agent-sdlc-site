export const sites = {
  agentsdlc: { name: 'Agent SDLC', kicker: 'Open standards for agentic software engineering', canonicalUrl: 'https://agentsdlc.ai', description: 'Portable planning, execution context and decision provenance for agentic software engineering.', sourceRepo: 'https://github.com/me2resh/agent-sdlc-site' },
  orbit: { name: 'ORBIT', kicker: 'Planning and Reconciliation Specification', canonicalUrl: 'https://orbitspec.dev', description: 'A portable specification for expressing durable software intent and reconciling it against current reality before work is materialised.', sourceRepo: 'https://github.com/me2resh/agent-sdlc-site/tree/main' },
  agdr: { name: 'AgDR', kicker: 'Agent Decision Record', canonicalUrl: 'https://agdr.dev', description: 'A durable record of a consequential technical decision made by an AI agent.', sourceRepo: 'https://github.com/me2resh/agent-decision-record' }
} as const;
export type SiteKey = keyof typeof sites;
export function currentSite(key?: string): SiteKey { return key === 'orbit' || key === 'agdr' ? key : 'agentsdlc'; }

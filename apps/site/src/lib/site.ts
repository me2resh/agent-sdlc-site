export const sites = {
  agentsdlc: { name: 'Agent SDLC', kicker: 'Open artefacts for agentic software engineering', canonicalUrl: 'https://agentsdlc.ai', description: 'A family of open specifications for planning, execution context and decision provenance across agents, humans, repositories and development tools.' },
  orbit: { name: 'ORBIT', kicker: 'Planning and Reconciliation Specification', canonicalUrl: 'https://orbitspec.dev', description: 'A portable specification for expressing durable software intent and reconciling it against current reality before work is materialised.' },
  agdr: { name: 'AgDR', kicker: 'Agent Decision Record', canonicalUrl: 'https://agdr.dev', description: 'A durable record of a consequential technical decision made by an AI agent.' }
} as const;
export type SiteKey = keyof typeof sites;
export function currentSite(key?: string): SiteKey { return key === 'orbit' || key === 'agdr' ? key : 'agentsdlc'; }

export const standards = {
  agentsdlc: { name: 'Agent SDLC', canonicalUrl: 'https://agentsdlc.ai', title: 'Agent SDLC — Open Standards for Agentic Software Engineering' },
  orbit: { name: 'ORBIT', canonicalUrl: 'https://orbitspec.dev', title: 'ORBIT — Planning and Reconciliation Specification' },
  agdr: { name: 'AgDR', canonicalUrl: 'https://agdr.dev', title: 'AgDR — Agent Decision Record Specification' }
} as const;

export type StandardKey = keyof typeof standards;

export type Diagnostic = { path: string; message: string; severity: 'error' | 'warning' };
export function validateDocument(kind: 'agdr' | 'orbit', input: string | object, options?: { filename?: string }): Diagnostic[];
export function validateAgdr(markdown: string, options?: { filename?: string }): Diagnostic[];
export function validateOrbit(value: string | object): Diagnostic[];

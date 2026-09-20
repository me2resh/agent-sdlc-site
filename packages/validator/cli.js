#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { validateDocument } from './index.js';

const args = process.argv.slice(2);
const kindIndex = args.indexOf('--kind');
const kind = kindIndex >= 0 ? args[kindIndex + 1] : 'agdr';
const file = args.find((arg, index) => arg !== '--kind' && index !== kindIndex + 1);
if (!file || !['agdr', 'orbit'].includes(kind)) {
  console.error('Usage: agent-sdlc-validate --kind agdr|orbit <file>');
  process.exit(2);
}
const input = await readFile(file, 'utf8');
const diagnostics = validateDocument(kind, input, { filename: basename(file) });
if (diagnostics.length === 0) { console.log(`Valid ${kind} document: ${file}`); process.exit(0); }
for (const item of diagnostics) console.log(`${item.severity}: ${item.path}: ${item.message}`);
console.error(`${diagnostics.length} validation issue(s).`);
process.exit(1);

const diagnostic = (path, message, severity = 'error') => ({ path, message, severity });

function validateAgdr(markdown, options = {}) {
  const errors = [];
  const filename = options.filename || '';
  const match = String(markdown).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return [diagnostic('frontmatter', 'Expected YAML frontmatter between opening and closing --- lines.')];
  const fields = Object.fromEntries(match[1].split(/\r?\n/).flatMap((line) => {
    const separator = line.indexOf(':');
    return separator > 0 ? [[line.slice(0, separator).trim(), line.slice(separator + 1).trim()]] : [];
  }));
  for (const field of ['id', 'timestamp', 'agent', 'model', 'trigger', 'status']) {
    if (!fields[field]) errors.push(diagnostic(`frontmatter.${field}`, `Missing required field '${field}'.`));
  }
  if (fields.id && !/^AgDR-\d{4,}$/.test(fields.id)) errors.push(diagnostic('frontmatter.id', 'ID must match AgDR-NNNN.'));
  if (filename && fields.id && !new RegExp(`^${fields.id}-[a-z0-9-]+\\.md$`).test(filename)) errors.push(diagnostic('filename', 'Filename must match AgDR-NNNN-slug.md.'));
  if (!/^>\s*In the context of.+facing.+I decided.+to achieve.+accepting.+\.\s*$/m.test(match[2])) errors.push(diagnostic('body', 'Missing the required Y-statement blockquote.'));
  for (const heading of ['## Options Considered', '## Decision']) if (!match[2].includes(heading)) errors.push(diagnostic('body', `Missing required section '${heading}'.`));
  return errors;
}

function validateOrbit(value) {
  const errors = [];
  let document = value;
  if (typeof value === 'string') {
    try { document = JSON.parse(value); } catch { return [diagnostic('$', 'Expected valid JSON.')]; }
  }
  if (!document || typeof document !== 'object' || Array.isArray(document)) return [diagnostic('$', 'Expected a JSON object.')];
  for (const field of ['specVersion', 'id', 'revision', 'project', 'title', 'intent', 'outcomes', 'acceptanceCriteria']) if (document[field] === undefined) errors.push(diagnostic(field, `Missing required field '${field}'.`));
  if (document.outcomes !== undefined && !Array.isArray(document.outcomes)) errors.push(diagnostic('outcomes', 'Must be an array.'));
  if (document.acceptanceCriteria !== undefined && !Array.isArray(document.acceptanceCriteria)) errors.push(diagnostic('acceptanceCriteria', 'Must be an array.'));
  return errors;
}

export function validateDocument(kind, input, options = {}) {
  return kind === 'agdr' ? validateAgdr(input, options) : validateOrbit(input);
}

export { validateAgdr, validateOrbit };

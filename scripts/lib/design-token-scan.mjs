// Scanner used by scripts/validate-design-tokens.mjs and its self-test.
//
// It finds two kinds of problem in one file's text:
//   - a literal color value (anything other than a design-system token), and
//   - a `var(--x)` reference.
// The caller decides which `--x` names are defined (from tokens.css).
//
// What counts as a literal color:
//   - In CSS context (a .css file, a <style> block, a style="" attribute,
//     an Astro style={...} expression): a hex value, a color function
//     (rgb, rgba, hsl, hsla, hwb, lab, lch, oklab, oklch, color,
//     color-mix, light-dark), or a CSS named color on a color property.
//     A CSS selector such as `#faded { }` is NOT a color: only declaration
//     values are checked.
//   - An SVG paint attribute (fill, stroke, stop-color, flood-color,
//     lighting-color, color) whose value is not none / currentColor /
//     transparent / inherit / var(...) / url(...).
//   - Any value of <meta name="theme-color" content="...">, of a web
//     manifest "theme_color" / "background_color", and any color value in
//     an Astro <style define:vars={{...}}> object. None of these can hold
//     a token.
//   - In script context (.ts/.js files, Astro frontmatter and <script>
//     blocks, and any quoted string in markup): a string literal that
//     holds a hex color or a color function. A URL fragment such as
//     `CHANGELOG.md#120` is NOT a color, and neither is a digits-only
//     3- or 4-character "#123" (an issue number) outside CSS context.

import { extname } from 'node:path';

/** File types scanned under apps/site (src and public). */
export const SITE_EXTENSIONS = new Set([
  '.astro', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.scss', '.html', '.svg',
  '.md', '.mdx', '.json', '.webmanifest'
]);
/** File types scanned under packages/ (tokens.css itself is excluded by the caller). */
export const PACKAGE_EXTENSIONS = new Set(['.css', '.scss', '.ts', '.tsx', '.js', '.jsx', '.mjs']);
const STYLESHEET_EXTENSIONS = new Set(['.css', '.scss']);

export const NAMED_COLORS = new Set(`aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue
blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue
darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid
darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink
deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold
goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush
lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey
lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime
limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen
mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise
palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue
saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow
springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen
canvas canvastext linktext visitedtext activetext buttonface buttontext buttonborder field fieldtext highlight
highlighttext selecteditem selecteditemtext mark marktext graytext accentcolor accentcolortext`.split(/\s+/));

const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix|light-dark|color)\s*\(/i;
const HEX_ANY = /#[0-9a-fA-F]{3,8}\b/;
// Properties whose value may hold a color keyword.
const COLOR_PROPERTY = /(?:color|background|border|outline|fill|stroke|shadow|caret|text-decoration|column-rule|scrollbar)/i;
const SAFE_PAINT = /^(?:none|currentcolor|transparent|inherit|initial|unset|var\(.*\)|url\(.*\))$/i;
const SVG_PAINT_ATTR = /\b(fill|stroke|stop-color|flood-color|lighting-color|color)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*(['"`])([^'"`]*)\4\s*\})/gi;

/** Remove CSS comments and quoted strings (fonts, urls) from CSS text. */
function stripCssNoise(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(["'])(?:\\.|(?!\1).)*\1/g, '""');
}

/** Declaration blocks of a CSS text: the content of each innermost {...}. */
function declarationBlocks(css) {
  return [...stripCssNoise(css).matchAll(/\{([^{}]*)\}/g)].map(m => m[1]);
}

/** Check one declaration list ("a: b; c: d"). Returns found literal colors. */
export function literalColorsInDeclarations(declarations) {
  const hits = [];
  for (const decl of stripCssNoise(declarations).split(';')) {
    const colon = decl.indexOf(':');
    if (colon === -1) continue;
    const property = decl.slice(0, colon).trim();
    const value = decl.slice(colon + 1).trim();
    if (!value) continue;
    const hex = value.match(HEX_ANY);
    if (hex) hits.push(hex[0]);
    const fn = value.match(COLOR_FUNCTION);
    if (fn) hits.push(`${fn[0].replace(/\s+/g, '')}...)`);
    if (property.startsWith('--') || COLOR_PROPERTY.test(property)) {
      // Drop var(...) so a fallback-free token reference is never read as a word.
      const words = value.replace(/var\([^)]*\)/gi, ' ').toLowerCase().match(/[a-z]+/g) ?? [];
      for (const word of words) if (NAMED_COLORS.has(word)) hits.push(word);
    }
  }
  return hits;
}

/** Literal colors in a CSS stylesheet text (rules with selectors). */
export function literalColorsInStylesheet(css) {
  return declarationBlocks(css).flatMap(literalColorsInDeclarations);
}

/** Balanced {...} content that follows `<attr>={` in Astro markup. */
function braceExpressions(text, attr) {
  const out = [];
  const re = new RegExp(`\\s${attr}=\\{`, 'g');
  let m;
  while ((m = re.exec(text))) {
    let depth = 1;
    let i = m.index + m[0].length;
    const start = i;
    while (i < text.length && depth > 0) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') depth--;
      i++;
    }
    out.push(text.slice(start, i - 1));
  }
  return out;
}

/** Literal color in one bare value (hex, color function, or named color). */
function literalColorsInValue(value) {
  return literalColorsInDeclarations(`--value: ${value}`);
}

/** Turn a JS style expression ({color:'red'} or "color:red") into declarations. */
function styleExpressionToDeclarations(expr) {
  const decls = [];
  for (const m of expr.matchAll(/([A-Za-z-]+)\s*:\s*(['"`])(.*?)\2/g)) {
    decls.push(`${m[1].replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}: ${m[3]}`);
  }
  for (const m of expr.matchAll(/(['"`])([^'"`]*:[^'"`]*)\1/g)) decls.push(m[2]);
  return decls.join(';');
}

/** Quoted string literals in script-like text (single line for ' and "). */
function stringLiterals(text) {
  return [...text.matchAll(/'((?:\\.|[^'\\\n])*)'|"((?:\\.|[^"\\\n])*)"|`((?:\\.|[^`\\])*)`/g)].map(
    m => m[1] ?? m[2] ?? m[3] ?? ''
  );
}

/** Literal colors in a string literal from script or markup. */
function literalColorsInString(str) {
  const hits = [];
  // Not preceded by a word char, /, &, ?, =, . or - : that excludes URL
  // fragments (file.md#120, ?a=b#x) and HTML entities.
  for (const m of str.matchAll(/(?<![\w/&?=.-])#([0-9a-fA-F]{3,8})\b/g)) {
    const body = m[1];
    const colorLength = [3, 4, 6, 8].includes(body.length);
    const digitsOnlyShort = /^[0-9]+$/.test(body) && body.length <= 4;
    if (colorLength && !digitsOnlyShort) hits.push(m[0]);
  }
  const fn = str.match(/\b(?:rgba?|hsla?|hwb|oklab|oklch|color-mix|light-dark)\s*\(/i);
  if (fn) hits.push(`${fn[0].replace(/\s+/g, '')}...)`);
  if (str.includes(':') && str.includes(';')) hits.push(...literalColorsInDeclarations(str));
  return hits;
}

/**
 * Scan one file. Returns { literals: string[], varRefs: string[] }.
 * @param {string} file path (used for the extension)
 * @param {string} text file content
 */
export function scanText(file, text) {
  const ext = extname(file);
  const literals = [];

  if (STYLESHEET_EXTENSIONS.has(ext)) {
    literals.push(...literalColorsInStylesheet(text));
  } else {
    // 0a. <meta name="theme-color" content="..."> -- a meta tag cannot use a
    //     token, so any value there is a literal color.
    for (const m of text.matchAll(/<meta\b[^>]*>/gi)) {
      if (!/\bname\s*=\s*["']theme-color["']/i.test(m[0])) continue;
      const content = m[0].match(/\bcontent\s*=\s*["']([^"']*)["']/i);
      if (content) literals.push(`theme-color="${content[1]}"`);
    }
    // 0b. Web manifest colors (JSON cannot use a token either).
    for (const m of text.matchAll(/"(theme_color|background_color)"\s*:\s*"([^"]*)"/g)) literals.push(`${m[1]}="${m[2]}"`);
    // 0c. Astro <style define:vars={{ name: 'value' }}>.
    for (const expr of braceExpressions(text, 'define:vars')) {
      for (const m of expr.matchAll(/(['"`])(.*?)\1/g)) literals.push(...literalColorsInValue(m[2]));
    }
    // 1. <style> blocks (.astro, .html).
    for (const m of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) literals.push(...literalColorsInStylesheet(m[1]));
    // 2. style="" / style='' attributes (markup, or markup inside a JS string).
    for (const m of text.matchAll(/\sstyle=(?:"([^"]*)"|'([^']*)')/gi)) literals.push(...literalColorsInDeclarations(m[1] ?? m[2] ?? ''));
    // 3. Astro style={...} expressions.
    for (const expr of braceExpressions(text, 'style'))literals.push(...literalColorsInDeclarations(styleExpressionToDeclarations(expr)));
    // 4. SVG paint attributes.
    for (const m of text.matchAll(SVG_PAINT_ATTR)) {
      const value = (m[2] ?? m[3] ?? m[5] ?? '').trim();
      if (value && !SAFE_PAINT.test(value)) literals.push(`${m[1]}="${value}"`);
    }
    // 5. String literals in script context (everything outside <style>).
    const scriptText = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
    for (const str of stringLiterals(scriptText)) literals.push(...literalColorsInString(str));
  }

  const varRefs = [...text.matchAll(/var\(\s*(--[a-z0-9_-]+)/gi)].map(m => m[1]);
  return { literals: [...new Set(literals)], varRefs };
}

/** Text inside the braces that open at `openIndex` (the index of "{"). */
function blockBody(css, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(openIndex + 1, i);
  }
  return '';
}

/** { name: value } for the plain `--name: value;` declarations in a block body. */
function plainDeclarations(body) {
  const out = {};
  for (const m of body.matchAll(/(--[a-z0-9_-]+)\s*:\s*([^;{}]+);/gi)) out[m[1]] = m[2].trim().toLowerCase();
  return out;
}

/**
 * tokens.css holds each color twice: once as light-dark(<light>, <dark>)
 * (current browsers) and once as plain hex in the
 * `@supports not (color: light-dark(...))` fallback (older browsers).
 * Returns a list of problems; empty when the two copies agree exactly.
 * @param {string} rawCss
 */
export function checkLightDarkFallback(rawCss) {
  const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const problems = [];
  const pairs = {};
  for (const m of css.matchAll(/(--[a-z0-9_-]+)\s*:\s*light-dark\(\s*([^,()]+?)\s*,\s*([^,()]+?)\s*\)/gi)) {
    pairs[m[1]] = { light: m[2].toLowerCase(), dark: m[3].toLowerCase() };
  }
  if (Object.keys(pairs).length === 0) return ['no light-dark() tokens found'];

  const supportsAt = css.search(/@supports\s+not\s*\(\s*color\s*:\s*light-dark\(/i);
  if (supportsAt === -1) return ['missing the @supports not (color: light-dark(...)) fallback block'];
  const fallback = blockBody(css, css.indexOf('{', supportsAt));

  const groups = [
    [':root (light)', /:root\s*\{/, 'light'],
    ["html[data-theme='dark'] (dark)", /html\[data-theme=['"]dark['"]\]\s*\{/, 'dark'],
    ["prefers-color-scheme: dark html:not([data-theme='light']) (dark)", /html:not\(\[data-theme=['"]light['"]\]\)\s*\{/, 'dark'],
  ];
  for (const [label, selector, mode] of groups) {
    const at = fallback.search(selector);
    if (at === -1) {
      problems.push(`fallback group missing: ${label}`);
      continue;
    }
    const values = plainDeclarations(blockBody(fallback, fallback.indexOf('{', at)));
    for (const [name, pair] of Object.entries(pairs)) {
      if (values[name] === undefined) problems.push(`${label}: ${name} is missing`);
      else if (values[name] !== pair[mode]) problems.push(`${label}: ${name} is ${values[name]}, light-dark() says ${pair[mode]}`);
    }
    for (const name of Object.keys(values)) {
      if (!(name in pairs)) problems.push(`${label}: ${name} has no light-dark() token`);
    }
  }
  if (!/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/i.test(fallback)) {
    problems.push('fallback has no @media (prefers-color-scheme: dark) block');
  }
  return problems;
}

/** Custom property names declared in a stylesheet (e.g. tokens.css). */
export function definedCustomProperties(css) {
  return new Set([...stripCssNoise(css).matchAll(/(--[a-z0-9_-]+)\s*:/gi)].map(m => m[1]));
}

// Self-test for scripts/lib/design-token-scan.mjs. Runs in `npm run validate`.
//
// Each "must flag" case plants one escape route and asserts the scanner
// reports it. Each "must pass" case asserts a known non-color is not
// reported (no false positive). Nothing is written to disk.

import {
  scanText,
  definedCustomProperties,
  checkLightDarkFallback,
  SITE_EXTENSIONS,
  PACKAGE_EXTENSIONS
} from './lib/design-token-scan.mjs';

const defined = definedCustomProperties(':root { --bg: #fff; --text: #000; }');

/** @type {[string, string, string][]} name, file, text */
const mustFlag = [
  ['hex in <style>', 'a.astro', '<style>.a { color: #ff00aa; }</style>'],
  ['hex in .css file', 'a.css', '.a { background: #abc; }'],
  ['rgb() in style=""', 'a.astro', '<p style="color: rgb(1, 2, 3)">x</p>'],
  ['hsl() in <style>', 'a.astro', '<style>.a { border-color: hsl(10 20% 30%); }</style>'],
  ['named color red', 'a.astro', '<style>.a { color: red; }</style>'],
  ['named color white in background', 'a.css', '.a { background: white; }'],
  ['named color black in border shorthand', 'a.css', '.a { border: 1px solid black; }'],
  ['named color in custom property', 'a.css', '.a { --local: orange; }'],
  ['color-mix()', 'a.css', '.a { color: color-mix(in srgb, var(--bg) 50%, var(--text)); }'],
  ['oklch()', 'a.css', '.a { color: oklch(60% 0.1 200); }'],
  ['lab()', 'a.css', '.a { color: lab(50% 20 30); }'],
  ['hwb()', 'a.css', '.a { color: hwb(200 10% 10%); }'],
  ['var() fallback hex', 'a.css', '.a { color: var(--bg, #123abc); }'],
  ['SVG fill hex', 'a.astro', '<svg><circle fill="#f00" /></svg>'],
  ['SVG stroke named', 'a.astro', '<svg><path stroke="orange" /></svg>'],
  ['SVG fill in set:html string', 'a.ts', "export const m = '<svg><rect fill=\"teal\"/></svg>';"],
  ['Astro style={{...}} object', 'a.astro', '<p style={{ color: "#f00" }}>x</p>'],
  ['Astro style={{...}} named color', 'a.astro', "<p style={{ backgroundColor: 'red' }}>x</p>"],
  ['Astro style={"..."} string', 'a.astro', '<p style={"color:#f00"}>x</p>'],
  ['hex in .astro <script>', 'a.astro', '<script>document.body.dataset.c = "#00ff88";</script>'],
  ['hex in .ts string', 'a.ts', "export const accent = '#3b4fa0';"],
  ['rgb() in .ts string', 'a.ts', 'export const c = "rgba(0, 0, 0, .5)";'],
  ['hex in public .html <style>', 'public/a.html', '<style>body { color: #111111; }</style>'],
  ['hex in public .html style=""', 'public/a.html', '<body style="background:#eee">'],
  ['style="" in .md', 'a.md', 'Text <span style="color: red">x</span>.'],
  ['style={{...}} in .mdx', 'a.mdx', "<p style={{ color: '#f00' }}>x</p>"],
  ['hex in .scss', 'a.scss', '.a { .b { color: #abcdef; } }'],
  ['hex string in .jsx', 'a.jsx', "export const C = () => <p data-c={'#00ff88'} />;"],
  ['hex string in .json', 'a.json', '{ "accent": "#aabbcc" }'],
  ['theme_color named in .webmanifest', 'a.webmanifest', '{ "theme_color": "white" }'],
  ['background_color hex in .webmanifest', 'a.webmanifest', '{ "background_color": "#14161b" }'],
  ['hex string in packages .ts', 'packages/x/src/a.ts', "export const bg = '#f1f3f6';"],
  ['meta theme-color hex', 'a.astro', '<meta name="theme-color" content="#14161b" />'],
  ['meta theme-color named, content first', 'a.html', "<meta content='black' name='theme-color'>"],
  ['define:vars hex', 'a.astro', "<style define:vars={{ c: '#f00' }}>.a { color: var(--c); }</style>"],
  ['define:vars named', 'a.astro', '<style define:vars={{ ink: "tomato" }}>.a { color: var(--ink); }</style>'],
];

/** @type {[string, string, string][]} */
const mustPass = [
  ['CSS ID selector #faded', 'a.css', '#faded { color: var(--text); } .x #bad { color: var(--bg); }'],
  ['URL fragment in comment', 'a.ts', '// see [1.2.0](https://example.com/CHANGELOG.md#120)'],
  ['URL fragment in string', 'a.ts', "const u = 'https://example.com/CHANGELOG.md#abc';"],
  ['issue number in string', 'a.ts', "const t = 'Fixed in #123.';"],
  ['SVG none / currentColor', 'a.astro', '<svg><circle fill="none" stroke="currentColor"/></svg>'],
  ['transparent / inherit', 'a.css', '.a { background: transparent; color: inherit; }'],
  ['token reference', 'a.css', '.a { color: var(--text); border: 1px solid var(--bg); }'],
  ['keyframe name with a color-like word', 'a.css', '.a { animation: interop-highlight 1s; }'],
  ['font stack', 'a.css', ".a { font: 1rem 'Courier Prime', 'Courier New', monospace; }"],
];

let failures = 0;
for (const [name, file, text] of mustFlag) {
  const { literals } = scanText(file, text);
  if (literals.length === 0) {
    failures++;
    console.error(`  MISSED  ${name}`);
  }
}
for (const [name, file, text] of mustPass) {
  const { literals, varRefs } = scanText(file, text);
  const undefinedRefs = varRefs.filter(ref => !defined.has(ref));
  if (literals.length > 0 || undefinedRefs.length > 0) {
    failures++;
    console.error(`  FALSE POSITIVE  ${name}: ${[...literals, ...undefinedRefs].join(', ')}`);
  }
}

// Undefined token references, including a space after "var(".
for (const [name, text] of [
  ['var(--nope)', '.a { color: var(--nope); }'],
  ['var( --nope) with a space', '.a { color: var( --nope); }'],
]) {
  const { varRefs } = scanText('a.css', text);
  if (!varRefs.some(ref => !defined.has(ref))) {
    failures++;
    console.error(`  MISSED  undefined ${name}`);
  }
}

// The tree walk must scan each file type the planted cases above use.
for (const ext of ['.md', '.mdx', '.scss', '.jsx', '.json', '.webmanifest', '.html', '.astro', '.ts']) {
  if (!SITE_EXTENSIONS.has(ext)) {
    failures++;
    console.error(`  NOT SCANNED  apps/site *${ext}`);
  }
}
for (const ext of ['.ts', '.js', '.css', '.scss']) {
  if (!PACKAGE_EXTENSIONS.has(ext)) {
    failures++;
    console.error(`  NOT SCANNED  packages/ *${ext}`);
  }
}

// The light-dark() tokens and their older-browser fallback must never drift.
const goodTokens = `
:root { --bg: light-dark(#f1f3f6, #14161b); --text: light-dark(#16181c, #eceef1); }
@supports not (color: light-dark(#000, #fff)) {
  :root { --bg: #f1f3f6; --text: #16181c; }
  html[data-theme='dark'] { --bg: #14161b; --text: #eceef1; }
  @media (prefers-color-scheme: dark) {
    html:not([data-theme='light']) { --bg: #14161b; --text: #eceef1; }
  }
}`;
const fallbackCases = [
  ['matching fallback passes', goodTokens, false],
  ['drifted light value', goodTokens.replace(':root { --bg: #f1f3f6;', ':root { --bg: #f1f3f7;'), true],
  ['drifted forced-dark value', goodTokens.replace("html[data-theme='dark'] { --bg: #14161b;", "html[data-theme='dark'] { --bg: #000000;"), true],
  ['drifted OS-dark value', goodTokens.replace("html:not([data-theme='light']) { --bg: #14161b;", "html:not([data-theme='light']) { --bg: #111111;"), true],
  ['token missing from fallback', goodTokens.replace(' --text: #16181c; }', ' }'), true],
  ['extra token only in fallback', goodTokens.replace(':root { --bg: #f1f3f6;', ':root { --stray: #ffffff; --bg: #f1f3f6;'), true],
  ['no fallback block', goodTokens.slice(0, goodTokens.indexOf('@supports')), true],
  ['no OS-dark media block', goodTokens.replace(/@media[\s\S]*?\}\s*\}/, ''), true],
];
for (const [name, css, shouldFail] of fallbackCases) {
  const problems = checkLightDarkFallback(css);
  if (shouldFail !== problems.length > 0) {
    failures++;
    console.error(`  FALLBACK CHECK WRONG  ${name}: ${problems.join('; ') || 'no problem reported'}`);
  }
}

if (failures > 0) throw new Error(`design-token scanner self-test failed: ${failures} case(s)`);
console.log(
  `design-token scanner self-test passed: ${mustFlag.length + 2} planted cases caught, ${mustPass.length} non-colors ignored, ${fallbackCases.length} fallback cases correct`
);

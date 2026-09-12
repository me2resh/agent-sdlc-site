import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
const siteKey = process.env.PUBLIC_SITE_KEY || 'agentsdlc';
const sites = {
  agentsdlc: 'https://agentsdlc.ai',
  orbit: 'https://orbitspec.dev',
  agdr: 'https://agdr.dev'
};

export default defineConfig({
  output: 'static',
  site: sites[siteKey] || sites.agentsdlc,
  outDir: fileURLToPath(new URL(`./dist/${siteKey}/`, import.meta.url))
});

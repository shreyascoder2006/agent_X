// Turns dist/ into a claude.ai artifact page: no document wrapper (the host adds it),
// CSS inlined, and the IIFE bundle loaded as a classic deferred script.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';

const [, , outDir] = process.argv;
const html = readFileSync('dist/index.html', 'utf8');
const css = readFileSync('dist/assets/niyam.css', 'utf8');
const title = html.match(/<title>.*?<\/title>/)[0];
const metas = [...html.matchAll(/<meta name="(?:claude:viewport-fit-sides|description)"[^>]*>/g)].map((m) => m[0]);
const fonts = [...html.matchAll(/<link rel="(?:preconnect|stylesheet)" href="https:\/\/fonts\.[^"]+"[^>]*>/g)].map((m) => m[0]);

const page = [
  title,
  ...metas,
  ...fonts,
  `<style>${css}</style>`,
  '<div id="root"></div>',
  '<script defer src="assets/niyam.js"></script>',
].join('\n');

mkdirSync(`${outDir}/assets`, { recursive: true });
writeFileSync(`${outDir}/index.html`, page + '\n');
copyFileSync('dist/assets/niyam.js', `${outDir}/assets/niyam.js`);
console.log('artifact page', page.length, 'bytes');

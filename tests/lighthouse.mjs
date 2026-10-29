// Lighthouse em modo celular (padrão: Moto G Power, 4G lento) contra o build servido localmente.
// Uso: node tests/lighthouse.mjs [url]  — usa o Chromium do Playwright, a não ser que CHROME_PATH esteja definido.
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:4321/';
const chromePath = process.env.CHROME_PATH ?? chromium.executablePath();
const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox'] });

const notas = [];
for (let i = 0; i < 3; i++) {
  const r = await lighthouse(url, {
    port: chrome.port,
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'mobile',
  });
  const c = r.lhr.categories;
  const n = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round(v.score * 100)]));
  const a = r.lhr.audits;
  n.LCP = a['largest-contentful-paint'].displayValue;
  n.CLS = a['cumulative-layout-shift'].displayValue;
  n.TBT = a['total-blocking-time'].displayValue;
  notas.push(n);
  if (i === 2) {
    mkdirSync('shots', { recursive: true });
    writeFileSync('shots/lighthouse.html', r.report);
  }
}
await chrome.kill();
console.table(notas);

// Gera public/og.png (1200×630) no visual do site, renderizando HTML com as fontes locais no Playwright.
// Uso: npm run og
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const raiz = new URL('../', import.meta.url);
const fonte = (p) => pathToFileURL(fileURLToPath(new URL(`node_modules/${p}`, raiz))).href;
const serif = fonte('@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2');
const serifItalic = fonte('@fontsource-variable/newsreader/files/newsreader-latin-opsz-italic.woff2');
const mono = fonte('@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:S;src:url(${serif}) format('woff2');font-weight:200 800}
@font-face{font-family:S;font-style:italic;src:url(${serifItalic}) format('woff2');font-weight:200 800}
@font-face{font-family:M;src:url(${mono}) format('woff2');font-weight:100 800}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#0E0E10;color:#ECEAE4;font-family:S;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between}
.meta{font-family:M;font-size:20px;color:#9A978F}
.nome{font-style:italic;font-size:34px;color:#9A978F;margin-bottom:10px}
h1{font-weight:400;font-size:78px;line-height:1.02;letter-spacing:-0.025em;max-width:1000px;font-variation-settings:'opsz' 72}
.g{color:#F2A33A}
.cur{display:inline-block;width:34px;height:64px;background:#F2A33A;vertical-align:-6px;margin-left:8px}
.call{font-family:M;font-size:17px;color:#9A978F;border-top:1px solid #2A2A2E;padding-top:22px}
.call b{color:#ECEAE4;font-weight:600}
</style></head><body>
<div><p class="nome">Vitor Tosti</p>
<h1>Estudante de Ciência da Computação na <span class="g">UFABC.</span><span class="cur"></span></h1></div>
<div><p class="call"><b>tempo_entre_etapas</b>({"de": "Venda registrada", "ate": "Pronta"}) → mediana 48 min · 93 de 135 pularam "Pronta"</p>
<p class="meta" style="margin-top:14px">AI Builder · Ciência da Computação @ UFABC</p></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
// Página em arquivo (não about:blank) para o Chromium aceitar as fontes via file://.
const arq = join(mkdtempSync(join(tmpdir(), 'og-')), 'og.html');
writeFileSync(arq, html);
await page.goto(pathToFileURL(arq).href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: fileURLToPath(new URL('public/og.png', raiz)) });
await browser.close();
console.log('public/og.png gerado');

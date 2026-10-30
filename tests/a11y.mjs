// Acessibilidade com axe-core: 375 px e 1440 px, depois que todas as gerações terminam.
// Também confere o teclado no menu e o texto completo no HTML.
// Uso: node tests/a11y.mjs [url]
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const url = process.argv[2] ?? 'http://localhost:4321/';
const browser = await chromium.launch();
let falhas = 0;

const paginas = ['', 'projetos/infocaij-mcp/', 'projetos/cardapio-em-1-minuto/', 'projetos/infocaij/', 'projetos/infomachine/', 'projetos/coreufabc/'];
for (const pagina of paginas)
for (const width of [375, 1440])
  for (const tema of ['dark']) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: tema, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(url + pagina, { waitUntil: 'networkidle' });
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
    console.log(`/${pagina} ${width}/${tema}: ${r.violations.length} violações, ${r.passes.length} regras ok`);
    for (const v of r.violations) {
      falhas++;
      console.log(`  ✗ ${v.id} (${v.impact}): ${v.help}`);
      for (const n of v.nodes.slice(0, 4)) console.log(`      ${n.target.join(' ')} — ${n.failureSummary?.split('\n')[1] ?? ''}`);
    }
    await ctx.close();
  }

// Teclado: o primeiro Tab (depois do "pular para o conteúdo") chega ao menu, e o nome está inteiro no HTML.
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.keyboard.press('Tab');
await page.keyboard.press('Tab');
const foco = await page.evaluate(() => document.activeElement?.textContent?.trim());
const h1 = await page.locator('h1').getAttribute('aria-label');
const sobre = await page.locator('#sobre .sr-only').textContent();
console.log(`teclado: segundo Tab chega em "${foco}"; h1 = "${h1}"; sobre legível: ${(sobre ?? '').length} caracteres`);
if (foco !== 'Sobre' || h1 !== 'Vitor Tosti' || !sobre) falhas++;

await browser.close();
process.exitCode = falhas ? 1 : 0;

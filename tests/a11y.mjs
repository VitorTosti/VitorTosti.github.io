// Acessibilidade com axe-core: 375 px e 1440 px, temas claro e escuro, depois que todas as gerações terminam.
// Também confere teclado no painel de probabilidades e o texto completo no HTML.
// Uso: node tests/a11y.mjs [url]
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const url = process.argv[2] ?? 'http://localhost:4321/';
const browser = await chromium.launch();
let falhas = 0;

for (const width of [375, 1440])
  for (const tema of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: tema, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
    console.log(`${width}/${tema}: ${r.violations.length} violações, ${r.passes.length} regras ok`);
    for (const v of r.violations) {
      falhas++;
      console.log(`  ✗ ${v.id} (${v.impact}): ${v.help}`);
      for (const n of v.nodes.slice(0, 4)) console.log(`      ${n.target.join(' ')} — ${n.failureSummary?.split('\n')[1] ?? ''}`);
    }
    await ctx.close();
  }

// Teclado: Tab até o primeiro token, setas andam, painel abre e Esc fecha.
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
let passos = 0;
while (passos++ < 10) {
  await page.keyboard.press('Tab');
  if (await page.evaluate(() => document.activeElement?.classList.contains('tok'))) break;
}
const primeiro = await page.evaluate(() => document.activeElement?.textContent);
await page.keyboard.press('ArrowRight');
const segundo = await page.evaluate(() => document.activeElement?.textContent);
const aberto = await page.evaluate(() => document.getElementById('prob')?.classList.contains('open'));
const descricao = await page.evaluate(() => {
  const id = document.activeElement?.getAttribute('aria-describedby');
  return id ? document.getElementById(id)?.textContent : null;
});
await page.keyboard.press('Escape');
await page.waitForTimeout(100);
const fechado = await page.evaluate(() => !document.getElementById('prob')?.classList.contains('open'));
const h1 = await page.locator('h1').evaluate((el) => el.innerText.replace(/\s+/g, ' ').trim());
console.log(`teclado: Tab chega em "${primeiro}", → vai para "${segundo}", painel aberto=${aberto}, Esc fecha=${fechado}`);
console.log(`descrição para leitor de tela: ${descricao}`);
console.log(`h1 no HTML: ${h1}`);
if (!(primeiro && segundo && primeiro !== segundo && aberto && fechado && descricao)) falhas++;

await browser.close();
process.exitCode = falhas ? 1 : 0;

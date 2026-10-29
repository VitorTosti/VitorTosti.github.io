// Capturas de verificação: 375 px e 1440 px, claro e escuro, com e sem movimento reduzido,
// mais o painel de probabilidades aberto. Uso: node tests/screenshots.mjs [url] [pasta]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:4321/';
const out = process.argv[3] ?? 'shots';
mkdirSync(out, { recursive: true });

const viewports = [
  { nome: '375', width: 375, height: 812, mobile: true },
  { nome: '1440', width: 1440, height: 900, mobile: false },
];
const browser = await chromium.launch();
const erros = [];

for (const vp of viewports)
  for (const tema of ['light', 'dark'])
    for (const motion of ['no-preference', 'reduce']) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.mobile ? 2 : 1,
        isMobile: vp.mobile,
        hasTouch: vp.mobile,
        colorScheme: tema,
        reducedMotion: motion,
      });
      const page = await ctx.newPage();
      page.on('pageerror', (e) => erros.push(`${vp.nome}/${tema}/${motion}: ${e.message}`));
      page.on('console', (m) => m.type() === 'error' && erros.push(`${vp.nome}/${tema}/${motion}: ${m.text()}`));
      await page.goto(url, { waitUntil: 'networkidle' });
      const base = `${out}/${vp.nome}-${tema}-${motion === 'reduce' ? 'reduzido' : 'movimento'}`;

      if (motion === 'no-preference') {
        // Meio da geração, para conferir o cursor e os tokens recém-gerados.
        await page.waitForTimeout(650);
        await page.screenshot({ path: `${base}-gerando.png` });
      }
      // Rola a página inteira para disparar as gerações que dependem de entrar na tela.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 300) {
          scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        scrollTo(0, 0);
      });
      await page.waitForTimeout(motion === 'reduce' ? 100 : 2500);
      // content-visibility: auto pula seções fora da tela; na captura de página inteira, todas precisam aparecer.
      await page.addStyleTag({ content: '.section { content-visibility: visible !important; }' });
      await page.screenshot({ path: `${base}-pagina.png`, fullPage: true });

      if (motion === 'no-preference') {
        const alvo = page.locator('.hero .tok[data-alts]').filter({ hasText: 'meço' });
        if (vp.mobile) await alvo.tap();
        else await alvo.hover();
        await page.waitForTimeout(400);
        await page.screenshot({ path: `${base}-painel.png` });
        await page.keyboard.press('Escape');
        if (!vp.mobile) {
          await page.locator('#latente .pt[data-slug="infocaij-mcp"] .dot').hover();
          await page.waitForTimeout(450);
          await page.locator('#latente').screenshot({ path: `${base}-latente.png` });
        }
      }
      await ctx.close();
    }

await browser.close();
if (erros.length) {
  console.error('Erros no console:\n' + erros.join('\n'));
  process.exitCode = 1;
} else console.log(`capturas em ${out}/`);

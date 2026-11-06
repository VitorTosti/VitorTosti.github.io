import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
const browser = await chromium.launch();
mkdirSync('.codex/city-qa', { recursive: true });
try {
  for (const width of [1440, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 1100 }, reducedMotion: 'reduce', isMobile: width === 375, hasTouch: width === 375 });
    const page = await context.newPage();
    await context.addInitScript(() => sessionStorage.setItem('entrevias-guide-v1', 'seen'));
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:4321/projetos/entrevias/', { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' });
    await page.waitForSelector('.map-wrap[data-mode="3d"]');
    const clock = await page.locator('[data-clock]').textContent();
    for (const preset of ['geral', 'cruzamento', 'avenida', 'parque']) {
      await page.locator(`[data-camera=${preset}]`).click();
      await page.locator('.map-wrap').screenshot({ path: `.codex/city-qa/detail-${width}-${preset}.png` });
      assert.equal(await page.locator('[data-clock]').textContent(), clock);
    }
    await page.locator('#camera-zoom').fill('8');
    assert.equal(await page.locator('[data-camera-zoom]').textContent(), '8,0×');
    await page.locator('[data-focus]').click();
    assert.match(await page.locator('[data-inspect]').textContent(), /Interseção/);
    await page.locator('[data-camera=geral]').click();
    await page.locator('[data-fullscreen]').click();
    await page.waitForFunction(() => !!document.fullscreenElement);
    await page.getByRole('button', { name: 'Sair da tela cheia', exact: true }).click();
    await page.waitForFunction(() => !document.fullscreenElement);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    console.log(`${width}px: vistas próximas, zoom 8×, foco e tela cheia OK`);
    await context.close();
  }
} finally { await browser.close(); }

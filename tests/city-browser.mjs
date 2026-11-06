// Validação da demonstração e de suas interações. Uso: node tests/city-browser.mjs
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const browser = await chromium.launch();
const base = process.env.CITY_TEST_URL ?? 'http://127.0.0.1:4321';
mkdirSync('.codex/city-qa', { recursive: true });
try {
  for (const width of [1440, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 1180 }, reducedMotion: 'reduce', isMobile: width === 375, hasTouch: width === 375 });
    const page = await context.newPage();
    await context.addInitScript(() => sessionStorage.setItem('entrevias-guide-v1', 'seen'));
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/projetos/entrevias/`, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
    await page.waitForSelector('.map-wrap[data-mode="3d"]');
    assert.equal(await page.locator('#city-map-3d').isVisible(), true);
    // Câmera responde mesmo com a simulação pausada.
    const initialView = await page.locator('#city-map-3d').screenshot();
    await page.getByRole('button', { name: 'Girar câmera à direita' }).click();
    const rotatedView = await page.locator('#city-map-3d').screenshot();
    assert.notDeepEqual(initialView, rotatedView);
    await page.getByRole('button', { name: 'Recentrar', exact: true }).click();
    const unchangedClock = await page.locator('[data-clock]').textContent();
    await page.getByRole('button', { name: 'Mapa 2D', exact: true }).click();
    assert.equal(await page.locator('.map-wrap').getAttribute('data-mode'), '2d');
    assert.equal(await page.locator('[data-clock]').textContent(), unchangedClock);
    await page.getByRole('button', { name: 'Cidade 3D', exact: true }).click();
    assert.equal(await page.locator('[data-clock]').textContent(), unchangedClock);
    assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'), 'false');
    const clock = await page.locator('[data-clock]').textContent();
    await page.waitForTimeout(150);
    assert.equal(await page.locator('[data-clock]').textContent(), clock);
    await page.locator('[data-preset=coletivo]').click();
    assert.equal(await page.locator('#transit').inputValue(), '65');
    assert.equal(await page.locator('#bus-lane').isChecked(), true);
    await page.locator('#works').check();
    await page.locator('#demand').fill('85');
    assert.equal(await page.locator('#demand-value').textContent(), '85%');
    await page.locator('#city-map-3d').focus();
    await page.keyboard.press('ArrowRight');
    assert.match(await page.locator('[data-inspect]').textContent(), /Interseção/);
    await page.getByRole('button', { name: 'Ampliar mapa', exact: true }).click();
    await page.getByRole('button', { name: 'Recentrar', exact: true }).click();
    await page.locator('[data-speed]').selectOption('4');
    await page.locator('[data-play]').click();
    await page.locator('#city-map-3d').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => Number(document.querySelector('[data-completed]').textContent.replace(/\./g, '')) > 0, null, { timeout: 60000 });
    await page.locator('[data-play]').click();
    await page.locator('[data-compare]').click();
    assert.match(await page.locator('[data-comparison]').textContent(), /Referência aos/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), []);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `.codex/city-qa/entrevias-${width}.png`, fullPage: true });
    if (width === 1440 && process.argv.includes('--capture-preview')) {
      await page.evaluate(() => scrollTo(0, 0));
      const png = await page.screenshot();
      await sharp(png).webp({ quality: 86 }).toFile('src/assets/entrevias-preview.webp');
    }
    await page.locator('[data-reset]').click();
    assert.equal(await page.locator('[data-completed]').textContent(), '0');
    assert.equal(await page.locator('[data-clock]').textContent(), '00:00');
    await page.goto(`${base}/projetos/entrevias/?demand=80&transit=60&signal=20&busLane=1&works=1`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#demand').inputValue(), '80');
    assert.equal(await page.locator('#bus-lane').isChecked(), true);
    assert.equal(await page.locator('#works').isChecked(), true);
    console.log(`${width}px: 3D, câmera, alternância 2D/3D, reprodução, cenários, ajustes, zoom, teclado, comparação, reset, URL, acessibilidade e console OK`);
    await context.close();
  }
  const fallback = await browser.newContext({ reducedMotion: 'reduce' });
  await fallback.addInitScript(() => {
    sessionStorage.setItem('entrevias-guide-v1', 'seen');
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (String(type).startsWith('webgl')) return null;
      return getContext.apply(this, [type, ...args]);
    };
  });
  const page = await fallback.newPage();
  await page.goto(`${base}/projetos/entrevias/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('[data-view="3d"]').disabled);
  assert.equal(await page.locator('.map-wrap').getAttribute('data-mode'), '2d');
  assert.match(await page.locator('[data-camera-hint]').textContent(), /2D continua funcionando/);
  await page.locator('[data-play]').click();
  await page.waitForFunction(() => document.querySelector('[data-clock]').textContent !== '00:12');
  console.log('Sem WebGL: fallback 2D e simulação funcionando');
  await fallback.close();
} finally { await browser.close(); }

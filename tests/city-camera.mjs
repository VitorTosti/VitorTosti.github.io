// Gestos reais via protocolo Chromium, além dos botões já cobertos em city-browser.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 375, height: 900 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await context.addInitScript(() => sessionStorage.setItem('entrevias-guide-v1', 'seen'));
  await page.goto('http://127.0.0.1:4321/projetos/entrevias/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.map-wrap[data-mode="3d"]');
  const canvas = page.locator('#city-map-3d');
  const bounds = await canvas.boundingBox();
  const client = await context.newCDPSession(page);
  const x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height / 2;
  const before = await canvas.screenshot();
  const touches = (offset) => [{ x: x - 35 - offset, y: y - 5, id: 1 }, { x: x + 35 + offset, y: y + 5, id: 2 }];
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touches(0) });
  for (let i = 1; i <= 8; i++) { await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touches(i * 4) }); await page.waitForTimeout(25); }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.notDeepEqual(await canvas.screenshot(), before);
  await page.locator('[data-zoom=reset]').click();
  await page.evaluate(() => scrollTo(0, 0));
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  for (let i = 1; i <= 8; i++) { await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 12, id: 1 }] }); await page.waitForTimeout(25); }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.ok(await page.evaluate(() => scrollY > 20), 'Um dedo deve rolar a página');
  const clock = await page.locator('[data-clock]').textContent();
  await canvas.evaluate(el => el.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.waitForSelector('.map-wrap[data-mode="2d"]');
  assert.equal(await page.locator('[data-clock]').textContent(), clock);
  assert.equal(await page.locator('[data-view="3d"]').isDisabled(), true);
  console.log('Mobile: dois dedos aproximam a câmera; um dedo rola a página; perda de WebGL preserva o estado em 2D.');
  await context.close();
} finally { await browser.close(); }

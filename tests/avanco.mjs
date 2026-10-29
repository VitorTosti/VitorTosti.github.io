// Fluxo da apresentação: contagem visível → cortina de tokens → projetos; cancelamento; movimento reduzido.
// Uso: node tests/avanco.mjs [url] [pasta]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:4321/';
const out = process.argv[3] ?? 'shots/avanco';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
let falhas = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) falhas++;
};

for (const vp of [
  { nome: '1440', width: 1440, height: 900 },
  { nome: '375', width: 375, height: 812 },
]) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto(url);
  await page.locator('[data-adv]:not([hidden])').waitFor({ timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${vp.nome}-contagem.png` });
  ok(await page.locator('[data-adv] [data-contagem]').isVisible(), `${vp.nome}: contagem visível`);
  await page.waitForTimeout(4700);
  await page.screenshot({ path: `${out}/${vp.nome}-cortina.png` });
  await page.waitForTimeout(1800);
  const y = await page.evaluate(() => Math.abs(document.getElementById('projetos').getBoundingClientRect().top));
  ok(y < 4, `${vp.nome}: chegou nos projetos (topo a ${Math.round(y)} px)`);
  ok(await page.evaluate(() => document.activeElement?.id === 'projetos'), `${vp.nome}: foco foi para os projetos`);
  ok(!(await page.locator('[data-adv]').isVisible()), `${vp.nome}: contagem some depois de chegar`);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${vp.nome}-projetos.png` });
  const introVolta = await page.evaluate(() => getComputedStyle(document.querySelector('.hero .tok')).opacity);
  ok(introVolta === '1', `${vp.nome}: apresentação restaurada fora da tela`);
  ok(!erros.length, `${vp.nome}: sem erros de JS ${erros.join(' | ')}`);
  await page.close();
}

// Cancelamento: rolar a roda durante a contagem para o avanço.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url);
  await page.locator('[data-adv]:not([hidden])').waitFor({ timeout: 15000 });
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(7500);
  const parado = await page.evaluate(() => document.querySelector('[data-adv]').classList.contains('parado'));
  const y = await page.evaluate(() => scrollY);
  ok(parado && y < 400, `cancelar: rolar parou o avanço (scrollY ${y})`);
  ok((await page.locator('[data-ir]').innerText()).includes('ver projetos'), 'cancelar: sobra o botão "ver projetos"');
  await page.close();
}

// Movimento reduzido: nada avança sozinho; o botão leva aos projetos.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForTimeout(8000);
  ok((await page.evaluate(() => scrollY)) === 0, 'reduzido: não avançou sozinho');
  ok(await page.locator('[data-ir]').isVisible(), 'reduzido: botão "ver projetos" visível');
  await page.screenshot({ path: `${out}/reduzido.png` });
  await page.locator('[data-ir]').click();
  await page.waitForTimeout(300);
  const y = await page.evaluate(() => Math.abs(document.getElementById('projetos').getBoundingClientRect().top));
  ok(y < 4, 'reduzido: o botão leva aos projetos');
  await ctx.close();
}

await browser.close();
process.exitCode = falhas ? 1 : 0;

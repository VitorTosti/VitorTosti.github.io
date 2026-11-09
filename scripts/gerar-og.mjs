// Gera public/og.png (1200×630) e uma imagem por projeto em public/og/<slug>.png, no visual do site,
// renderizando HTML com as fontes locais no Playwright.
// Uso: npm run og
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const raiz = new URL('../', import.meta.url);
const fonte = (p) => pathToFileURL(fileURLToPath(new URL(`node_modules/${p}`, raiz))).href;
const serif = fonte('@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2');
const serifItalic = fonte('@fontsource-variable/newsreader/files/newsreader-latin-opsz-italic.woff2');
const mono = fonte('@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2');

const css = `
@font-face{font-family:S;src:url(${serif}) format('woff2');font-weight:200 800}
@font-face{font-family:S;font-style:italic;src:url(${serifItalic}) format('woff2');font-weight:200 800}
@font-face{font-family:M;src:url(${mono}) format('woff2');font-weight:100 800}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#0E0E10;color:#ECEAE4;font-family:S;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between}
.meta{font-family:M;font-size:20px;color:#9A978F}
.nome{font-style:italic;font-size:34px;color:#9A978F;margin-bottom:10px}
h1{font-weight:400;font-size:78px;line-height:1.02;letter-spacing:-0.025em;max-width:1000px;font-variation-settings:'opsz' 72}
.g{color:var(--c,#F2A33A)}
.cur{display:inline-block;width:34px;height:64px;background:var(--c,#F2A33A);vertical-align:-6px;margin-left:8px}
.call{font-family:M;font-size:17px;color:#9A978F;border-top:1px solid #2A2A2E;padding-top:22px}
.call b{color:#ECEAE4;font-weight:600}
.st{font-family:M;font-size:20px;text-transform:uppercase;letter-spacing:.12em;color:var(--c,#F2A33A);margin-bottom:18px}
.res{font-size:30px;line-height:1.3;color:#C9C6BE;max-width:980px;margin-top:22px}
`;

const home = `<div><p class="nome">Vitor Tosti</p>
<h1>Estudante de Ciência da Computação na <span class="g">UFABC.</span><span class="cur"></span></h1></div>
<div><p class="call"><b>tempo_entre_etapas</b>({"de": "Venda registrada", "ate": "Pronta"}) → mediana 48 min · 93 de 135 pularam "Pronta"</p>
<p class="meta" style="margin-top:14px">AI Builder · Ciência da Computação @ UFABC</p></div>`;

// slug, nome, status, resumo curto, cor do projeto (as mesmas de global.css)
const projetos = [
  ['infocaij-mcp', 'InfoCAIJ MCP', 'destaque', 'Servidor MCP somente leitura que liga o sistema interno ao Claude: 8 ferramentas, 20 testes, sem dependências.', '#F2A33A'],
  ['kairo', 'Kairo', 'time de agentes', 'Agenda online para negócios de beleza, construída por um orquestrador e cinco agentes especialistas. 471 testes.', '#7AA2FF'],
  ['cardapio-em-1-minuto', 'Cardápio em 1 minuto', 'em andamento', 'A foto do cardápio vira cardápio digital estruturado, com avaliação em 60 cardápios com gabarito.', '#FF7A5C'],
  ['infocaij', 'InfoCAIJ', 'em produção', 'Plataforma interna que tirou do WhatsApp a venda e a preparação de notebooks. ~300 máquinas por mês.', '#3FD0BD'],
  ['infomachine', 'InfoMachine', 'em uso na bancada', 'App portátil de triagem de notebooks: lê o hardware, roda 5 testes e imprime a etiqueta.', '#B39DFF'],
  ['coreufabc', 'CoreUFABC', 'protótipo', 'Lê o histórico do SIGAA, calcula CR, CA e CPk e simula a grade do próximo quadrimestre.', '#8AD66B'],
];

const pagina = (corpo, cor) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="--c:${cor ?? '#F2A33A'}">${corpo}</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const dir = mkdtempSync(join(tmpdir(), 'og-'));

async function render(html, destino) {
  // Página em arquivo (não about:blank) para o Chromium aceitar as fontes via file://.
  const arq = join(dir, 'og.html');
  writeFileSync(arq, html);
  await page.goto(pathToFileURL(arq).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: fileURLToPath(new URL(destino, raiz)) });
  console.log(`${destino} gerado`);
}

mkdirSync(fileURLToPath(new URL('public/og', raiz)), { recursive: true });
await render(pagina(home), 'public/og.png');
for (const [slug, nome, status, resumo, cor] of projetos) {
  const corpo = `<div><p class="st">${status}</p><h1>${nome}<span class="cur"></span></h1><p class="res">${resumo}</p></div>
<div><p class="call"><b>Vitor Tosti</b> · AI Builder · vitortosti.github.io</p></div>`;
  await render(pagina(corpo, cor), `public/og/${slug}.png`);
}
await browser.close();

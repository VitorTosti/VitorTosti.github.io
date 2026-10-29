// Laço do fundo da abertura. Desenha num canvas só as linhas da pauta que cabem no espaço vazio;
// para quando a abertura sai da tela ou a aba fica oculta.
import { livres, ocupados, posicionar, type Caixa } from './field';
import { formatPct, rng, splitFallback } from './tokenize';

type Linha = {
  y: number;
  toks: string[];
  xs: number[];
  /** Quantos tokens já foram escritos. */
  n: number;
  estado: 'vazia' | 'escrevendo' | 'pausa' | 'apagando';
  /** Momento da próxima mudança de estado ou do próximo token. */
  ate: number;
  /** Quando o último token apareceu, para o destaque dele esmaecer. */
  ultimo: number;
  passo: number;
  alfa: number;
  inicio: number;
};

const RESTO = '.name, .line, .meta, .skills, .sobre, .adv-wrap, .side, .info';
const MAX_ESCREVENDO = 6;

export function montarCampo(el: HTMLElement) {
  const canvas = el.querySelector('canvas')!;
  const ctx = canvas.getContext('2d');
  const hero = el.parentElement;
  if (!ctx || !hero) return;
  const pool: string[] = JSON.parse(el.dataset.field ?? '[]');
  if (!pool.length) return;

  const animar = document.documentElement.classList.contains('gen-on');
  const sorteio = rng(11);
  const pega = () => pool[Math.floor(sorteio() * pool.length)];
  let linhas: Linha[] = [];
  let caixas: Caixa[] = [];
  let larg = 0;
  let alt = 0;
  let pauta = 32;
  let fonte = '';
  let cor = { tinta: '#000', destaque: '#080' };
  let visivel = true;
  let raf = 0;
  let antes = 0;
  /** Linhas a redesenhar no próximo quadro; o resto do canvas fica como está. */
  const sujas = new Set<Linha>();
  let tudo = true;
  // As linhas de fundo só começam depois do título: na abertura, a CPU é dele (e da linha do top-5).
  let ambienteDesde = Infinity;

  function lerCores() {
    const cs = getComputedStyle(document.documentElement);
    cor = { tinta: cs.getPropertyValue('--ink-2').trim(), destaque: cs.getPropertyValue('--accent-text').trim() };
  }

  function medir() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = el.getBoundingClientRect();
    larg = r.width;
    alt = r.height;
    canvas.width = Math.round(larg * dpr);
    canvas.height = Math.round(alt * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    pauta = rem * 2;
    const tam = larg < 640 ? 11 : 12.5;
    fonte = `400 ${tam}px "JetBrains Mono Variable", ui-monospace, monospace`;
    ctx!.font = fonte;
    caixas = [...hero!.querySelectorAll<HTMLElement>(RESTO)]
      .filter((e) => e.offsetParent !== null)
      .map((e) => {
        const b = e.getBoundingClientRect();
        return { x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height };
      });
    // A pauta do body começa no topo da página: as linhas daqui seguem a mesma grade.
    const topoPagina = r.top + scrollY;
    const primeira = (pauta - (topoPagina % pauta)) % pauta;
    const antigas = linhas;
    linhas = [];
    for (let y = primeira + pauta; y < alt - pauta * 0.5; y += pauta) {
      const velha = antigas.find((l) => Math.abs(l.y - y) < 1);
      linhas.push(velha ? { ...velha, y } : nova(y));
    }
    linhas.forEach((l) => l.toks.length && encaixar(l, l.toks, l.inicio));
    tudo = true;
  }

  function nova(y: number): Linha {
    return { y, toks: [], xs: [], n: 0, estado: 'vazia', ate: 0, ultimo: 0, passo: 60, alfa: 1, inicio: 0 };
  }

  /** Espaços vazios da linha, já sem o texto da abertura. */
  function vaos(l: Linha) {
    const baseline = l.y - pauta * 0.3;
    const margem = larg < 640 ? 16 : 32;
    return livres(margem, larg - margem, ocupados(caixas, baseline - pauta * 0.6, baseline + pauta * 0.2, 24));
  }

  /** Coloca a sequência de tokens num único vão da linha: nunca atravessa o texto da abertura. */
  function encaixar(l: Linha, toks: string[], inicio: number) {
    const vs = vaos(l);
    // Se o começo pedido cai sobre texto, a linha começa no primeiro vão depois dele.
    let vao = vs.find(([a, b]) => inicio >= a - 1 && inicio < b);
    if (!vao && inicio >= 0) {
      vao = vs.find(([a]) => a >= inicio);
      if (vao) inicio = vao[0];
    }
    const xs = vao
      ? posicionar(
          toks.map((t) => ctx!.measureText(t).width),
          toks,
          inicio,
          vao[1],
        )
      : [];
    // Fragmento de uma palavra só vira ruído: a linha fica vazia.
    if (xs.length < 2) xs.length = 0;
    l.toks = toks.slice(0, xs.length);
    l.xs = xs;
    l.inicio = inicio;
    l.n = Math.min(l.n, l.toks.length);
  }

  function comecar(l: Linha, texto: string, agora: number, inicio?: number) {
    let x0 = inicio;
    if (x0 === undefined) {
      // Só vãos largos recebem texto; o começo varia dentro dele para a folha não ficar justificada.
      const largos = vaos(l).filter(([a, b]) => b - a >= (larg < 640 ? 150 : 220));
      const v = largos[Math.floor(sorteio() * largos.length)];
      x0 = v ? v[0] + Math.floor(sorteio() * Math.min(4, (v[1] - v[0] - 150) / (pauta * 1.5))) * pauta * 1.5 : -1;
    }
    encaixar(l, splitFallback(texto), x0);
    sujas.add(l);
    if (!l.toks.length) {
      l.estado = 'vazia';
      l.ate = agora + 1500 + sorteio() * 3000;
      return;
    }
    l.n = 0;
    l.alfa = 1;
    l.estado = 'escrevendo';
    l.passo = 45 + sorteio() * 70;
    l.ate = agora;
  }

  function tick(agora: number) {
    let escrevendo = linhas.filter((l) => l.estado === 'escrevendo').length;
    for (const l of linhas) {
      if (agora < l.ate) continue;
      sujas.add(l);
      if (l.estado === 'vazia') {
        if (agora < ambienteDesde) continue;
        if (escrevendo >= MAX_ESCREVENDO) {
          l.ate = agora + 400 + sorteio() * 800;
          continue;
        }
        comecar(l, pega(), agora);
        if (l.estado === 'escrevendo') escrevendo++;
      } else if (l.estado === 'escrevendo') {
        l.n++;
        l.ultimo = agora;
        if (l.n >= l.toks.length) {
          l.estado = 'pausa';
          l.ate = agora + 5000 + sorteio() * 9000;
          escrevendo--;
        } else l.ate = agora + l.passo * (l.toks[l.n]?.startsWith(' ') ? 1 : 0.6);
      } else if (l.estado === 'pausa') {
        l.estado = 'apagando';
        l.ate = agora + 700;
      } else {
        l.alfa = Math.max(0, (l.ate - agora) / 700);
        if (l.alfa === 0) {
          l.estado = 'vazia';
          l.n = 0;
          l.toks = [];
          l.ate = agora + 800 + sorteio() * 3500;
        }
      }
    }
    for (const l of linhas) {
      if (l.estado === 'apagando') l.alfa = Math.max(0, (l.ate - agora) / 700);
      // O destaque do último token esfria quadro a quadro; a linha que apaga também muda a cada quadro.
      if (l.estado === 'apagando' || (l.estado === 'escrevendo' && agora - l.ultimo < 650)) sujas.add(l);
    }
  }

  function desenhar(agora: number) {
    if (!tudo && !sujas.size) return;
    ctx!.font = fonte;
    ctx!.textBaseline = 'alphabetic';
    if (tudo) ctx!.clearRect(0, 0, larg, alt);
    for (const l of tudo ? linhas : sujas) {
      if (!tudo) ctx!.clearRect(0, l.y - pauta, larg, pauta);
      if (!l.n) continue;
      const base = l.y - pauta * 0.3;
      // Esmaece de cima para baixo: perto do fim da abertura a folha some na seção seguinte.
      const desce = Math.min(1, Math.max(0, (alt - l.y) / (pauta * 4)));
      const viva = l.estado === 'escrevendo' ? 0.3 : 0.2;
      ctx!.fillStyle = cor.tinta;
      ctx!.globalAlpha = viva * l.alfa * desce;
      const ate = l.estado === 'escrevendo' ? l.n - 1 : l.n;
      for (let i = 0; i < ate; i++) ctx!.fillText(l.toks[i], l.xs[i], base);
      if (l.estado === 'escrevendo' && l.n > 0) {
        // O token recém-amostrado aparece na cor de destaque e esfria em 600 ms.
        const k = Math.min(1, (agora - l.ultimo) / 600);
        ctx!.fillStyle = cor.destaque;
        ctx!.globalAlpha = (0.85 - 0.55 * k) * desce;
        ctx!.fillText(l.toks[l.n - 1], l.xs[l.n - 1], base);
      }
    }
    ctx!.globalAlpha = 1;
    sujas.clear();
    tudo = false;
  }

  function quadro(t: number) {
    raf = 0;
    if (!visivel || document.hidden) return;
    // ~30 quadros por segundo bastam para texto.
    if (t - antes >= 32) {
      antes = t;
      tick(t);
      desenhar(t);
    }
    raf = requestAnimationFrame(quadro);
  }
  const rodar = () => {
    if (animar && !raf && visivel && !document.hidden) raf = requestAnimationFrame(quadro);
  };

  /** Folha estática: todas as linhas já escritas, sem destaque. */
  function estatica() {
    tudo = true;
    for (const l of linhas) {
      comecar(l, pega(), 0);
      l.n = l.toks.length;
      l.estado = 'pausa';
    }
    desenhar(0);
  }

  lerCores();
  medir();
  el.classList.add('on');

  // Enquanto o título é gerado, a linha dele recebe o top-5 daquela posição, logo depois da palavra.
  const titulo = hero.querySelector<HTMLElement>('.line[data-gen]');
  titulo?.addEventListener('gen:token', (e) => {
    const { tok } = (e as CustomEvent<{ tok: HTMLElement }>).detail;
    if (!tok.dataset.alts || (tok.textContent ?? "").trim().length < 2) return;
    const d: { a: { t: string; p: number }[] } = JSON.parse(tok.dataset.alts);
    const b = tok.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const meio = b.bottom - r.top;
    const l = linhas.reduce((m, x) => (Math.abs(x.y - meio) < Math.abs(m.y - meio) ? x : m), linhas[0]);
    if (!l) return;
    const texto = d.a.map((a) => `${a.t.trim() || a.t} ${formatPct(a.p)}`).join(' · ');
    comecar(l, texto, performance.now(), b.right - r.left + 24);
    l.passo = 28;
  });
  const soltar = () => (ambienteDesde = Math.min(ambienteDesde, performance.now() + 600));
  titulo?.addEventListener('gen:done', soltar, { once: true });
  setTimeout(soltar, 5000);

  if (!animar) {
    estatica();
  } else {
    new IntersectionObserver(([en]) => {
      visivel = en.isIntersecting;
      rodar();
    }).observe(el);
    document.addEventListener('visibilitychange', rodar);
    rodar();
  }

  let t = 0;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = window.setTimeout(() => {
      medir();
      if (!animar) estatica();
    }, 150);
  });
}

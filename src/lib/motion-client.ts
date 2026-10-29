// Movimento da página: entrada ao rolar, cursor magnético, faixas de skills, o "Sobre" gerado pela
// rolagem e a pilha de projetos. Tudo funciona sem JS (conteúdo visível, sem movimento) e respeita
// movimento reduzido.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fino = matchMedia('(pointer: fine)').matches;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Elementos [data-fade] entram subindo 24px quando chegam à tela; --d dá o atraso. */
function entradas() {
  const els = document.querySelectorAll<HTMLElement>('[data-fade]');
  if (reduce || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const d = parseFloat(getComputedStyle(e.target).getPropertyValue('--d')) || 0;
        (e.target as HTMLElement).animate(
          [
            { opacity: 0, transform: 'translateY(24px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 700, delay: d, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' },
        );
      }),
    { rootMargin: '0px 0px -8% 0px' },
  );
  els.forEach((el) => {
    // Só anima o que ainda está abaixo da tela; o que já está visível fica como está.
    if (el.getBoundingClientRect().top > innerHeight) io.observe(el);
  });
}

/** O cursor do nome segue o mouse quando ele chega perto (efeito ímã). */
function ima() {
  const el = document.querySelector<HTMLElement>('[data-magnet]');
  if (!el || reduce || !fino) return;
  const RAIO = 150;
  const FORCA = 3;
  let ativo = false;
  addEventListener(
    'pointermove',
    (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const perto =
        e.clientX > r.left - RAIO && e.clientX < r.right + RAIO && e.clientY > r.top - RAIO && e.clientY < r.bottom + RAIO;
      if (perto) {
        if (!ativo) el.style.transition = 'transform 0.3s ease-out';
        ativo = true;
        el.style.transform = `translate3d(${(e.clientX - cx) / FORCA}px, ${(e.clientY - cy) / FORCA}px, 0)`;
      } else if (ativo) {
        ativo = false;
        el.style.transition = 'transform 0.6s ease-in-out';
        el.style.transform = '';
      }
    },
    { passive: true },
  );
}

type Tarefa = () => void;
const tarefas: Tarefa[] = [];
let pendente = false;
function aCadaRolagem(fn: Tarefa) {
  tarefas.push(fn);
  fn();
}
addEventListener(
  'scroll',
  () => {
    if (pendente) return;
    pendente = true;
    requestAnimationFrame(() => {
      pendente = false;
      tarefas.forEach((t) => t());
    });
  },
  { passive: true },
);
addEventListener('resize', () => tarefas.forEach((t) => t()), { passive: true });

/** As duas faixas de skills andam em sentidos opostos conforme a página rola. */
function faixas() {
  const sec = document.querySelector<HTMLElement>('[data-marquee]');
  if (!sec || reduce) return;
  const rows = [...sec.querySelectorAll<HTMLElement>('.row')];
  let topo = 0;
  const medir = () => (topo = sec.getBoundingClientRect().top + scrollY);
  medir();
  addEventListener('resize', medir, { passive: true });
  aCadaRolagem(() => {
    const off = (scrollY - topo + innerHeight) * 0.3;
    rows.forEach((r) => {
      const dir = Number(r.dataset.dir) || 1;
      // Começa deslocada para a faixa nunca mostrar a borda.
      r.style.transform = `translate3d(${dir > 0 ? off - r.scrollWidth / 3 : -(off + 40)}px, 0, 0)`;
    });
  });
}

/** "Sobre": cada token acende quando o parágrafo passa entre 80% e 20% da altura da tela. */
function sobre() {
  const p = document.querySelector<HTMLElement>('[data-scrollgen]');
  if (!p || reduce) return;
  const toks = [...p.querySelectorAll<HTMLElement>('.st')];
  let acesos = -1;
  aCadaRolagem(() => {
    const r = p.getBoundingClientRect();
    const ini = innerHeight * 0.8;
    const fim = innerHeight * 0.2;
    // Progresso: 0 quando o topo do parágrafo chega a 80% da tela; 1 quando o fim passa de 20%.
    const prog = clamp((ini - r.top) / (ini - fim + r.height));
    const n = Math.round(prog * toks.length);
    if (n === acesos) return;
    for (let i = Math.min(n, acesos); i < Math.max(n, acesos); i++) toks[i]?.classList.toggle('on', i < n);
    acesos = n;
  });
}

/** Pilha de projetos: o cartão preso encolhe um pouco conforme os seguintes passam por cima. */
function pilha() {
  const host = document.querySelector<HTMLElement>('[data-pilha]');
  if (!host || reduce) return;
  const cards = [...host.querySelectorAll<HTMLElement>('[data-cartao]')];
  const largo = matchMedia('(min-width: 900px)');
  const n = cards.length;
  aCadaRolagem(() => {
    if (!largo.matches) {
      cards.forEach((c) => (c.style.transform = ''));
      return;
    }
    const r = host.getBoundingClientRect();
    const prog = clamp(-r.top / Math.max(1, r.height - innerHeight));
    cards.forEach((c, i) => {
      const alvo = 1 - (n - 1 - i) * 0.03;
      const k = clamp((prog - i / n) / (1 - i / n));
      c.style.transform = `scale(${1 - (1 - alvo) * k})`;
    });
  });
}

entradas();
ima();
faixas();
sobre();
pilha();

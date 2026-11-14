// Movimento da página: entrada ao rolar e o "Sobre" gerado pela
// rolagem. Tudo funciona sem JS (conteúdo visível, sem movimento) e respeita
// movimento reduzido.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
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

/** JSON do cardápio: as linhas aparecem em sequência, como uma resposta sendo gerada, ao entrar na tela. */
function linhas() {
  const els = document.querySelectorAll<HTMLElement>('[data-linhas]');
  if (!('IntersectionObserver' in window)) return els.forEach((e) => e.classList.add('vistas'));
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        e.target.classList.add('vistas');
      }),
    { threshold: 0.4 },
  );
  els.forEach((e) => io.observe(e));
}

entradas();
linhas();
sobre();

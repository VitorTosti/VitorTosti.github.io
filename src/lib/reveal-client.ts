// Revela rastros ([data-run]) passo a passo quando entram na tela, como um log em tempo real.
// Sem JS ou com movimento reduzido, tudo já está visível (ver CSS em AgentTrace.astro).

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function run(host: HTMLElement) {
  host.classList.add('running');
  const steps = [...host.querySelectorAll<HTMLElement>('[data-step]')];
  steps.forEach((step, i) => {
    const at = Number(step.dataset.at ?? i * 260);
    setTimeout(() => {
      step.classList.add('on');
      const dur = Number(step.dataset.call ?? 0);
      if (dur) {
        step.classList.add('active');
        setTimeout(() => step.classList.replace('active', 'done'), dur);
      }
      if (i === steps.length - 1) host.classList.add('run-done');
    }, at);
  });
}

const hosts = [...document.querySelectorAll<HTMLElement>('[data-run]')];
if (reduce) {
  hosts.forEach((h) => h.classList.add('run-done'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        run(e.target as HTMLElement);
      }
    },
    { rootMargin: '0px 0px -18% 0px' },
  );
  hosts.forEach((h) => io.observe(h));
}

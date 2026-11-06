import { City, PRESETS } from './city-engine';
import type { City3D } from './city-3d';

export function initCityPreviews() {
  for (const root of document.querySelectorAll<HTMLElement>('[data-city-preview]')) {
    const canvas = root.querySelector<HTMLCanvasElement>('[data-preview-canvas]')!;
    const poster = root.querySelector<HTMLImageElement>('img')!;
    const controls = root.querySelector<HTMLElement>('[data-preview-controls]')!;
    const play = root.querySelector<HTMLButtonElement>('[data-preview-play]')!;
    const status = root.querySelector<HTMLElement>('[data-preview-status]')!;
    const stage = root.querySelector<HTMLElement>('.preview-stage')!;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let running = !motion.matches, visible = false, loading = false, disposed = false;
    let scene: City3D | null = null;
    let raf = 0, last = 0;
    const city = new City(PRESETS.coletivo);
    city.tick(30);
    function state() {
      play.textContent = running ? 'Pausar movimento' : 'Iniciar movimento';
      play.setAttribute('aria-pressed', String(running));
      root.dataset.running = String(running && visible && !document.hidden && !!scene);
    }
    function draw() { if (scene && visible && !document.hidden) scene.draw(city, null); }
    function frame(now: number) {
      raf = 0;
      if (!running || !visible || document.hidden || !scene) { last = 0; state(); return; }
      if (last && now - last < 33) { raf = requestAnimationFrame(frame); return; }
      if (last) city.tick(Math.min((now - last) / 1000, .15) * 1.5);
      last = now; draw(); state(); raf = requestAnimationFrame(frame);
    }
    function resume() { state(); if (running && visible && !document.hidden && scene && !raf) { last = 0; raf = requestAnimationFrame(frame); } }
    function stopFrame() { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; state(); }
    function resize() { const rect = stage.getBoundingClientRect(); scene?.resize(rect.width, rect.height); draw(); }
    function fallback() {
      stopFrame(); scene?.dispose(); scene = null;
      canvas.hidden = true; poster.hidden = false; controls.hidden = true;
      root.dataset.ready = 'fallback'; root.dataset.running = 'false';
      status.textContent = 'Prévia em imagem. Abra o app completo para explorar a cidade e o mapa 2D.';
    }
    async function load() {
      if (loading || scene || disposed) return;
      loading = true; status.textContent = 'Preparando a prévia 3D…';
      try {
        const { createCity3D } = await import('./city-3d');
        if (disposed) return;
        scene = createCity3D(canvas, draw);
        canvas.hidden = false; poster.hidden = true; controls.hidden = false;
        root.dataset.ready = '3d';
        status.textContent = 'A cidade está funcionando aqui. Arraste para girar; no celular, use dois dedos.';
        resize(); resume();
      } catch { fallback(); }
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { void load(); draw(); resume(); } else stopFrame();
    }, { threshold: .05 });
    observer.observe(stage);
    const resizer = new ResizeObserver(resize); resizer.observe(stage);
    play.addEventListener('click', () => { running = !running; if (!running) stopFrame(); resume(); });
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-preview-zoom]')) button.addEventListener('click', () => { scene?.zoom(button.dataset.previewZoom!); draw(); });
    canvas.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); scene?.rotate(event.key === 'ArrowLeft' ? -1 : 1); draw(); }
      if (event.key === '+' || event.key === '-' || event.key === '=') { event.preventDefault(); scene?.zoom(event.key === '-' ? 'out' : 'in'); draw(); }
    });
    canvas.addEventListener('city:3d-lost', fallback);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopFrame(); else { draw(); resume(); } });
    motion.addEventListener('change', event => { if (event.matches) { running = false; stopFrame(); } });
    addEventListener('pagehide', event => { if (event.persisted) return; disposed = true; stopFrame(); scene?.dispose(); observer.disconnect(); resizer.disconnect(); }, { once: true });
  }
}

import { City, COLS, ROWS, point, PRESETS, closedEdge, trafficSignal, type Settings } from './city-engine';
import type { City3D } from './city-3d';
import { initCityExperience } from './city-experience';

export function initCity() {
  const canvas = document.querySelector<HTMLCanvasElement>('#city-map');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
  const fields = { demand: $<HTMLInputElement>('#demand'), transit: $<HTMLInputElement>('#transit'), signal: $<HTMLInputElement>('#signal'), busLane: $<HTMLInputElement>('#bus-lane'), works: $<HTMLInputElement>('#works') };
  const params = new URLSearchParams(location.search);
  const settings = { ...PRESETS.equilibrio };
  for (const key of ['demand', 'transit', 'signal'] as const) {
    const value = params.get(key);
    if (value !== null && Number.isFinite(Number(value))) settings[key] = Math.min(Number(fields[key].max), Math.max(Number(fields[key].min), Number(value)));
  }
  for (const key of ['busLane', 'works'] as const) if (params.has(key)) settings[key] = params.get(key) === '1';
  let city = new City(settings);
  let running = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let speed = 2;
  let last = 0;
  let raf = 0;
  let visible = true;
  let previous: { time: number; completed: number; average: number } | null = null;
  let width = 1000, height = 700;
  let zoom = 1;
  let selected: number | null = null;
  const canvas3D = $<HTMLCanvasElement>('#city-map-3d');
  let view: '2d' | '3d' = '2d';
  let requestedView: '2d' | '3d' = '3d';
  let scene3D: City3D | null = null;
  const play = $<HTMLButtonElement>('[data-play]');
  const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  city.tick(12);

  function sync() {
    for (const key of ['demand', 'transit', 'signal'] as const) {
      fields[key].value = String(city.settings[key]);
      $<HTMLOutputElement>(`#${key}-value`).textContent = `${city.settings[key]}${key === 'signal' ? ' s' : '%'}`;
    }
    fields.busLane.checked = city.settings.busLane;
    fields.works.checked = city.settings.works;
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-preset]')) {
      const preset = PRESETS[button.dataset.preset!];
      button.setAttribute('aria-pressed', String(Object.keys(preset).every(key => preset[key as keyof Settings] === city.settings[key as keyof Settings])));
    }
  }
  function stats() {
    $('[data-completed]').textContent = number.format(city.completed);
    $('[data-average]').textContent = city.completed ? city.average.toFixed(1).replace('.', ',') : '—';
    $('[data-active]').textContent = number.format(city.vehicles.length);
    $('[data-waiting]').textContent = `${city.waiting} parados · ${city.queuedPeople} pessoas aguardando entrada`;
    $('[data-clock]').textContent = `${String(Math.floor(city.time / 60)).padStart(2, '0')}:${String(Math.floor(city.time % 60)).padStart(2, '0')}`;
    if (previous) {
      const delta = city.completed - previous.completed;
      $('[data-comparison]').textContent = `Referência aos ${Math.floor(previous.time)} s: ${previous.completed} pessoas chegaram; média ${previous.average.toFixed(1).replace('.', ',')} s. Agora: ${delta >= 0 ? '+' : ''}${delta} pessoas. Compare no mesmo tempo simulado.`;
    }
    if (selected !== null) {
      const count = city.vehicles.filter(v => v.route[v.step] === selected || v.route[v.step + 1] === selected).length;
      const pos = point(selected);
      $('[data-inspect]').textContent = `Interseção ${pos.x + 1} / ${pos.y + 1}: ${count} veículos nos trechos de entrada e saída. Use as setas para explorar outras interseções.`;
    }
  }
  function state() {
    play.textContent = running ? 'Pausar' : 'Iniciar simulação';
    play.setAttribute('aria-pressed', String(running));
    $('[data-running]').textContent = running ? 'Simulação em curso' : 'Pausado';
  }
  function draw() {
    if (!canvas || !ctx) return;
    if (view === '3d' && scene3D) { scene3D.draw(city, selected); return; }
    const mobile = width < 500;
    const left = width * .08, top = height * .10;
    const dx = width * .84 / (COLS - 1), dy = height * .76 / (ROWS - 1);
    const p = (id: number) => { const a = point(id); return { x: left + a.x * dx, y: top + a.y * dy }; };
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#101f2a'; ctx.fillRect(0, 0, width, height);
    ctx.save(); ctx.translate(width / 2, height / 2); ctx.scale(zoom, zoom); ctx.translate(-width / 2, -height / 2);
    // Quarteirões e parques: geometria da própria rede de mobilidade.
    for (let y = 0; y < ROWS - 1; y++) for (let x = 0; x < COLS - 1; x++) {
      const park = (x === 1 && y === 1) || (x === 5 && y === 3) || (x === 4 && y === 0);
      const px = left + x * dx + dx * .18, py = top + y * dy + dy * .18;
      ctx.fillStyle = park ? '#193e3d' : '#1b303c';
      ctx.fillRect(px, py, dx * .64, dy * .64);
      if (park) {
        ctx.fillStyle = '#2c5950';
        for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(px + dx * (.12 + (k % 3) * .17), py + dy * (.15 + Math.floor(k / 3) * .27), mobile ? 2 : 4, 0, Math.PI * 2); ctx.fill(); }
      } else {
        ctx.fillStyle = '#253e4b';
        ctx.fillRect(px + dx * .09, py + dy * .09, dx * .2, dy * .42);
        ctx.fillRect(px + dx * .35, py + dy * .09, dx * .19, dy * .19);
        ctx.fillRect(px + dx * .35, py + dy * .34, dx * .19, dy * .17);
      }
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < COLS * ROWS; i++) {
      const a = point(i);
      for (const next of [a.x < COLS - 1 ? i + 1 : -1, a.y < ROWS - 1 ? i + COLS : -1]) {
        if (next < 0) continue;
        const from = p(i), to = p(next);
        const closed = city.settings.works && closedEdge.includes(i) && closedEdge.includes(next);
        ctx.strokeStyle = closed ? '#ed926b' : '#718d9d'; ctx.lineWidth = mobile ? 8 : 14;
        ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
        ctx.strokeStyle = '#263c49'; ctx.lineWidth = mobile ? 6 : 11;
        ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
        ctx.strokeStyle = closed ? '#f0ad66' : '#8ba1ab'; ctx.lineWidth = .65;
        ctx.setLineDash(closed ? [3, 4] : [2, 7]);
        ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); ctx.setLineDash([]);
        if (city.settings.busLane && !closed) {
          ctx.strokeStyle = '#397d70'; ctx.lineWidth = mobile ? 1 : 1.8;
          ctx.beginPath(); ctx.moveTo(from.x + (a.x === point(next).x ? -5 : 0), from.y + (a.y === point(next).y ? -5 : 0)); ctx.lineTo(to.x + (a.x === point(next).x ? -5 : 0), to.y + (a.y === point(next).y ? -5 : 0)); ctx.stroke();
        }
      }
    }
    ctx.font = `${mobile ? 7 : 10}px Arial`; ctx.fillStyle = '#a7bcc4'; ctx.textAlign = 'center';
    for (const [row, name] of [[0, 'AV. HORIZONTE'], [2, 'AV. CENTRAL'], [5, 'AV. DO PARQUE']] as const) ctx.fillText(name, width * .5, top + row * dy - (mobile ? 10 : 14));
    // Dois sinais mostram a alternância de direção sem cobrir as ruas.
    for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) {
      const signal = trafficSignal(city.time, x, y, city.settings.signal).horizontal;
      ctx.fillStyle = signal === 'green' ? '#64f1a4' : signal === 'amber' ? '#ffca5d' : '#ff574b';
      ctx.fillRect(left + x * dx + 7, top + y * dy - 9, mobile ? 2 : 3, mobile ? 2 : 3);
    }
    for (const v of city.vehicles) {
      const a = p(v.route[v.step]), b = p(v.route[v.step + 1]);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const lane = v.bus && city.settings.busLane ? 5 : 2;
      const x = a.x + (b.x - a.x) * v.progress - Math.sin(angle) * lane;
      const y = a.y + (b.y - a.y) * v.progress + Math.cos(angle) * lane;
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
      ctx.fillStyle = v.bus ? '#75dbc1' : v.stopped ? '#e97f60' : '#f0ad66';
      const length = v.bus ? (mobile ? 8 : 14) : (mobile ? 5 : 8);
      ctx.fillRect(-length / 2, -2, length, 4);
      ctx.restore();
    }
    if (selected !== null) {
      const pos = p(selected); ctx.strokeStyle = '#eef0eb'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, mobile ? 8 : 13, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    ctx.textAlign = 'left';
  }
  function resize() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
    if (scene3D) { scene3D.resize(width, height); if (view === '3d') scene3D.draw(city, selected); }
  }
  function loop(now: number) {
    raf = 0;
    if (!running || !visible || document.hidden) { last = 0; return; }
    if (last) city.tick(Math.min((now - last) / 1000, .1) * speed);
    last = now; draw(); stats();
    raf = requestAnimationFrame(loop);
  }
  function resume() { if (running && visible && !document.hidden && !raf) { last = 0; raf = requestAnimationFrame(loop); } }
  play.addEventListener('click', () => { running = !running; state(); if (!running && raf) { cancelAnimationFrame(raf); raf = 0; last = 0; } resume(); });
  $('[data-reset]').addEventListener('click', () => { city = new City(city.settings); stats(); draw(); });
  $<HTMLSelectElement>('[data-speed]').addEventListener('change', e => { speed = Number((e.target as HTMLSelectElement).value); });
  for (const [key, input] of Object.entries(fields)) input.addEventListener('input', () => {
    if (key === 'busLane' || key === 'works') city.settings[key] = input.checked;
    else city.settings[key as 'demand' | 'transit' | 'signal'] = Number(input.value);
    sync(); draw();
  });
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-preset]')) button.addEventListener('click', () => { city = new City(PRESETS[button.dataset.preset!]); sync(); stats(); draw(); });
  $('[data-compare]').addEventListener('click', () => {
    if (!city.completed) { $('[data-comparison]').textContent = 'Espere as primeiras pessoas chegarem para guardar uma referência.'; return; }
    previous = { time: city.time, completed: city.completed, average: city.average }; stats();
  });
  $('[data-share]').addEventListener('click', async () => {
    const url = new URL(location.href); url.search = '';
    for (const [key, value] of Object.entries(city.settings)) url.searchParams.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
    try { await navigator.clipboard.writeText(url.href); $('[data-share-result]').textContent = 'Link copiado. Ele abre com estes ajustes, desde o início da simulação.'; }
    catch { $('[data-share-result]').textContent = `Copie o endereço: ${url.href}`; }
  });
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-zoom]')) button.addEventListener('click', () => {
    if (view === '3d' && scene3D) { scene3D.zoom(button.dataset.zoom!); cameraUI(); draw(); return; }
    zoom = button.dataset.zoom === 'reset' ? 1 : Math.min(2.4, Math.max(1, zoom + (button.dataset.zoom === 'in' ? .35 : -.35)));
    draw();
  });
  canvas.addEventListener('click', e => {
    const bounds = canvas.getBoundingClientRect();
    const x = (e.clientX - bounds.left - width / 2) / zoom + width / 2;
    const y = (e.clientY - bounds.top - height / 2) / zoom + height / 2;
    const col = Math.round((x - width * .08) / (width * .84 / (COLS - 1)));
    const row = Math.round((y - height * .10) / (height * .76 / (ROWS - 1)));
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) { selected = row * COLS + col; stats(); draw(); }
  });
  const keyboard = (e: KeyboardEvent) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault(); const pos = point(selected ?? 19);
    if (e.key === 'ArrowLeft') pos.x = Math.max(0, pos.x - 1);
    if (e.key === 'ArrowRight') pos.x = Math.min(COLS - 1, pos.x + 1);
    if (e.key === 'ArrowUp') pos.y = Math.max(0, pos.y - 1);
    if (e.key === 'ArrowDown') pos.y = Math.min(ROWS - 1, pos.y + 1);
    selected = pos.y * COLS + pos.x; stats(); draw();
  };
  canvas.addEventListener('keydown', keyboard);
  canvas3D.addEventListener('keydown', keyboard);
  function setView(next: '2d' | '3d') {
    requestedView = next;
    if (next === '3d' && !scene3D) return;
    view = next;
    canvas!.style.visibility = next === '3d' ? 'hidden' : 'visible';
    canvas!.tabIndex = next === '2d' ? 0 : -1;
    canvas!.setAttribute('aria-hidden', String(next === '3d'));
    canvas3D.hidden = next !== '3d'; canvas3D.tabIndex = next === '3d' ? 0 : -1;
    canvas3D.closest<HTMLElement>('.map-wrap')!.dataset.mode = next;
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-view]')) button.setAttribute('aria-pressed', String(button.dataset.view === next));
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-rotate]')) button.hidden = next !== '3d';
    $('[data-camera-panel]').hidden = next !== '3d';
    $('[data-camera-hint]').textContent = next === '3d'
      ? (matchMedia('(pointer: coarse)').matches ? 'Dois dedos para girar e aproximar. Use as vistas para ver de perto.' : 'Arraste para girar, botão direito para mover e roda para aproximar.')
      : 'Clique nas interseções para inspecionar o trânsito.';
    resize();
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-view]')) button.addEventListener('click', () => setView(button.dataset.view as '2d' | '3d'));
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-rotate]')) button.addEventListener('click', () => { scene3D?.rotate(Number(button.dataset.rotate)); draw(); });
  function cameraUI() {
    const value = scene3D?.getZoom() ?? 1;
    $<HTMLInputElement>('#camera-zoom').value = String(value);
    $('[data-camera-zoom]').textContent = `${value.toFixed(1).replace('.', ',')}×`;
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-camera]')) button.addEventListener('click', () => {
    scene3D?.focus(button.dataset.camera!, selected);
    for (const item of document.querySelectorAll<HTMLButtonElement>('[data-camera]')) item.setAttribute('aria-pressed', String(item === button));
    cameraUI(); draw();
  });
  $('[data-focus]').addEventListener('click', () => {
    selected ??= 35; scene3D?.focus('cruzamento', selected); stats(); cameraUI(); draw();
  });
  $<HTMLInputElement>('#camera-zoom').addEventListener('input', event => { scene3D?.setZoom(Number((event.target as HTMLInputElement).value)); cameraUI(); draw(); });
  $('[data-fullscreen]').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await canvas3D.closest<HTMLElement>('.map-wrap')!.requestFullscreen();
    } catch { $('[data-camera-hint]').textContent = 'Tela cheia não está disponível. Use o zoom e as vistas próximas.'; }
  });
  document.addEventListener('fullscreenchange', () => {
    $('[data-fullscreen]').setAttribute('aria-label', document.fullscreenElement ? 'Sair da tela cheia' : 'Ampliar cidade em tela cheia');
    resize();
  });
  let down = { x: 0, y: 0 };
  canvas3D.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  canvas3D.addEventListener('click', e => {
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
    const node = scene3D?.pick(e.clientX, e.clientY);
    if (node !== null && node !== undefined) { selected = node; stats(); draw(); }
  });
  const fallback3D = () => {
    setView('2d');
    const button = $<HTMLButtonElement>('[data-view="3d"]'); button.disabled = true;
    $('[data-camera-hint]').textContent = 'O 3D não está disponível neste navegador. O mapa 2D continua funcionando.';
    scene3D?.dispose(); scene3D = null;
  };
  canvas3D.addEventListener('city:3d-lost', fallback3D);
  let disposed = false;
  import('./city-3d').then(({ createCity3D }) => {
    if (disposed) return;
    scene3D = createCity3D(canvas3D, () => { if (view === '3d') { cameraUI(); draw(); } });
    scene3D.resize(width, height);
    setView(requestedView);
  }).catch(fallback3D);
  addEventListener('pagehide', event => {
    if (event.persisted) return;
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    scene3D?.dispose();
  }, { once: true });
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) draw(); resume(); }).observe(canvas);
  document.addEventListener('visibilitychange', resume);
  sync(); state(); stats(); resize(); resume();
  initCityExperience({
    city: () => city,
    replace: next => { city = next; sync(); stats(); if (visible) draw(); },
    refresh: () => { sync(); stats(); if (visible) draw(); },
    running: () => running,
    run: value => { running = value; state(); if (!running && raf) { cancelAnimationFrame(raf); raf = 0; last = 0; } resume(); },
    view: () => requestedView,
    setView,
    focus: (preset, node) => {
      if (node !== undefined) selected = node;
      scene3D?.focus(preset, selected);
      for (const button of document.querySelectorAll<HTMLButtonElement>('[data-camera]')) button.setAttribute('aria-pressed', String(button.dataset.camera === preset));
      cameraUI(); draw();
    },
  });
}

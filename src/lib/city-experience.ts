import { City, PRESETS, closedEdge, type Settings } from './city-engine';
import { CHALLENGE_SETTINGS, compareSolution, experiment, type Result } from './city-experiment';

type Hooks = {
  city: () => City; replace: (city: City) => void; refresh: () => void;
  running: () => boolean; run: (value: boolean) => void;
  view: () => '2d' | '3d'; setView: (view: '2d' | '3d') => void;
  focus: (preset: string, selected?: number) => void;
};
type Snapshot = { city: City; running: boolean; view: '2d' | '3d' };
const steps = [
  { title: 'O futuro desta cidade começa com uma escolha sua.', copy: 'Entre vias é um laboratório de mobilidade. Altere o transporte, observe o trânsito e descubra como fazer mais pessoas chegarem ao destino.', detail: 'Cidade fictícia. Simulação educativa, sem dados reais de trânsito.', settings: PRESETS.equilibrio, focus: 'geral', target: '' },
  { title: 'Mais viagens. Mais filas.', copy: 'Vamos elevar a demanda para 95% e deixar apenas 10% das pessoas no ônibus. Observe os carros ocupando as ruas e esperando nos cruzamentos.', detail: 'O destaque mostra o controle que estamos alterando. Os números vêm da simulação em execução.', settings: PRESETS.rush, focus: 'geral', target: '#demand' },
  { title: 'Mude a forma de chegar.', copy: 'A demanda continua em 95%. Agora, 65% das pessoas usam ônibus e ativamos a faixa exclusiva. Um ônibus representa 12 pessoas neste modelo.', detail: 'Menos veículos não significa menos pessoas viajando. Compare filas e chegadas no desafio ao final.', settings: PRESETS.coletivo, focus: 'cruzamento', target: '#transit' },
  { title: 'Cada sinal organiza um encontro.', copy: 'Aproxime-se do cruzamento. Vermelho, amarelo e verde usam o mesmo relógio que controla os veículos. Vamos encurtar o ciclo para 6 segundos.', detail: 'O tempo de cada direção muda. Um ciclo menor pode ajudar ou atrapalhar: o efeito precisa ser observado.', settings: { ...PRESETS.coletivo, signal: 6 }, focus: 'cruzamento', target: '#signal' },
  { title: 'Uma rua fechada muda os caminhos.', copy: 'Uma obra bloqueia um trecho da avenida central. Cones aparecem no mapa e as novas viagens procuram outra rota.', detail: 'Viagens que já estavam em curso mantêm a rota. Este é um limite declarado do modelo educativo.', settings: { ...PRESETS.coletivo, works: true }, focus: 'cruzamento', target: '#works' },
  { title: 'Agora a próxima escolha é sua.', copy: 'Seu desafio: fazer pelo menos 20% mais pessoas chegarem, com menos veículos parados. A demanda será a mesma. Você decide como a cidade se move.', detail: 'Vamos comparar duas execuções de 2 minutos simulados, com a mesma semente e sem veículos na partida.', settings: PRESETS.equilibrio, focus: 'geral', target: '' },
];

export function initCityExperience(hooks: Hooks) {
  const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
  const dialog = $<HTMLDialogElement>('[data-tour]');
  if (!dialog) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let snapshot: Snapshot | null = null;
  let challengeSnapshot: Snapshot | null = null;
  let step = 0;
  let automatic = !reduced;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let demoFrame = 0;
  let demoCity: City | null = null;
  let demoElapsed = 0;
  let demoLast = 0;
  let fromSettings: Settings = { ...PRESETS.equilibrio };
  let highlighted: HTMLElement | null = null;
  let controller: AbortController | null = null;
  let reference: Result | null = null;
  let challengeStage: 'off' | 'reference' | 'edit' | 'test' | 'result' = 'off';
  const disabledBefore = new Map<HTMLInputElement | HTMLButtonElement, boolean>();
  const capture = (): Snapshot => ({ city: hooks.city(), running: hooks.running(), view: hooks.view() });
  const restore = (saved: Snapshot) => { hooks.replace(saved.city); hooks.setView(saved.view); hooks.focus('geral'); hooks.run(saved.running); };
  function stopDemo() {
    if (timer) clearTimeout(timer); timer = null;
    if (demoFrame) cancelAnimationFrame(demoFrame); demoFrame = 0; demoLast = 0;
  }
  function readings() {
    const city = hooks.city();
    $('[data-tour-demand]').textContent = `${city.settings.demand}%`;
    $('[data-tour-transit]').textContent = `${city.settings.transit}%`;
    $('[data-tour-waiting]').textContent = String(city.waiting);
  }
  function demo(now: number) {
    demoFrame = 0;
    if (!dialog.open || !demoCity || !automatic || document.hidden) { demoLast = 0; return; }
    const dt = demoLast ? Math.min((now - demoLast) / 1000, .1) : 0;
    demoLast = now; demoElapsed += dt;
    const mix = Math.min(1, demoElapsed / 1.2);
    const settings = steps[step].settings;
    for (const key of ['demand', 'transit', 'signal'] as const) demoCity.settings[key] = Math.round(fromSettings[key] + (settings[key] - fromSettings[key]) * mix);
    demoCity.settings.busLane = settings.busLane; demoCity.settings.works = settings.works;
    if (demoCity.time < 120) demoCity.tick(Math.min(dt * 16, 120 - demoCity.time));
    hooks.refresh(); readings();
    if (demoCity.time < 120 || mix < 1) demoFrame = requestAnimationFrame(demo);
  }
  function schedule() {
    if (timer) clearTimeout(timer);
    if (automatic && step > 0 && step < steps.length - 1) timer = setTimeout(() => showStep(step + 1), 12000);
    $('[data-tour-auto]').textContent = automatic ? 'Pausar guia' : 'Retomar guia';
    $('[data-tour-timing]').textContent = step === 0 ? 'Você pode pular a qualquer momento.' : automatic && step < 5 ? 'Próxima etapa em 12 s' : 'Avance no seu ritmo.';
  }
  function showStep(next: number) {
    stopDemo();
    if (highlighted) highlighted.classList.remove('tour-highlight');
    fromSettings = { ...hooks.city().settings };
    step = next; const content = steps[step];
    const docked = step > 0 && step < 5;
    dialog.classList.toggle('is-demo', docked);
    document.body.classList.toggle('tutorial-demo', docked);
    $('#tour-title').textContent = content.title;
    $('#tour-copy').textContent = content.copy;
    $('[data-tour-detail]').textContent = content.detail;
    $('[data-tour-step]').textContent = `${step + 1} de ${steps.length}`;
    $('[data-tour-readings]').hidden = !docked;
    $('[data-tour-back]').hidden = step === 0;
    $('[data-tour-auto]').hidden = !docked;
    $('[data-tour-next]').textContent = step === 0 ? 'Começar a experiência' : step === 5 ? 'Aceitar o desafio' : 'Próxima etapa';
    for (const dot of document.querySelectorAll<HTMLElement>('[data-tour-dot]')) dot.classList.toggle('active', Number(dot.dataset.tourDot) <= step);
    demoCity = new City(content.settings); demoCity.tick(12);
    hooks.replace(demoCity); hooks.focus(content.focus, step === 4 ? closedEdge[0] : 35);
    if (docked) {
      highlighted = content.target ? document.querySelector<HTMLElement>(content.target) : null;
      highlighted?.classList.add('tour-highlight');
      demoElapsed = 0;
      if (reduced || !automatic) { demoCity.tick(48); hooks.refresh(); }
      else demoFrame = requestAnimationFrame(demo);
    }
    readings(); schedule();
    $('[data-running]').textContent = docked ? 'Demonstração guiada' : 'Pausado';
    if (!reduced) $('[data-tour-text]').animate([{ opacity: 0, transform: 'translateY(16px)', filter: 'blur(5px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }], { duration: 500, easing: 'cubic-bezier(.16,1,.3,1)' });
    $('#tour-title').focus({ preventScroll: true });
  }
  function closeTour() {
    stopDemo(); highlighted?.classList.remove('tour-highlight'); highlighted = null;
    document.body.classList.remove('tutorial-active', 'tutorial-demo');
    dialog.close();
    if (snapshot) restore(snapshot); snapshot = null;
    try { sessionStorage.setItem('entrevias-guide-v1', 'seen'); } catch { /* O guia funciona sem armazenamento. */ }
    $('[data-tour-open]').focus({ preventScroll: true });
  }
  function openTour() {
    if (dialog.open) return;
    if (challengeStage !== 'off') stopChallenge();
    snapshot = capture(); hooks.run(false); automatic = !reduced;
    document.body.classList.add('tutorial-active');
    scrollTo(0, 0); dialog.showModal(); showStep(0);
  }
  $('[data-tour-open]').addEventListener('click', openTour);
  $('[data-tour-skip]').addEventListener('click', closeTour);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeTour(); });
  $('[data-tour-back]').addEventListener('click', () => showStep(Math.max(0, step - 1)));
  $('[data-tour-next]').addEventListener('click', () => { if (step === 5) { closeTour(); void startChallenge(); } else showStep(step + 1); });
  $('[data-tour-auto]').addEventListener('click', () => {
    automatic = !automatic;
    if (!automatic) stopDemo(); else { demoLast = 0; demoFrame = requestAnimationFrame(demo); }
    schedule();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopDemo();
    else if (dialog.open && step > 0 && step < 5) { demoLast = 0; if (automatic) demoFrame = requestAnimationFrame(demo); schedule(); }
  });

  function lockChallenge(busy: boolean) {
    const controls = document.querySelectorAll<HTMLInputElement | HTMLButtonElement>('.controls input, [data-preset], [data-play], [data-reset], [data-speed], [data-compare]');
    for (const input of controls) {
      if (!disabledBefore.has(input)) disabledBefore.set(input, input.disabled);
      input.disabled = busy || input.id === 'demand' || input.hasAttribute('data-preset');
    }
    $<HTMLButtonElement>('[data-challenge-test]').disabled = busy;
  }
  function printResult(prefix: string, result: Result) {
    for (const key of ['completed', 'waiting', 'queued', 'average'] as const) $(`[data-${prefix}="${key}"]`).textContent = key === 'average' ? `${result[key].toFixed(1).replace('.', ',')} s` : String(result[key]);
  }
  function stopChallenge() {
    controller?.abort(); controller = null;
    challengeStage = 'off'; reference = null;
    $('[data-challenge]').hidden = true;
    for (const [input, disabled] of disabledBefore) input.disabled = disabled;
    disabledBefore.clear();
    if (challengeSnapshot) restore(challengeSnapshot); challengeSnapshot = null;
  }
  async function calculate(baseline: boolean) {
    const abort = new AbortController(); controller?.abort(); controller = abort;
    hooks.run(false); lockChallenge(true);
    challengeStage = baseline ? 'reference' : 'test';
    $('[data-challenge-status]').textContent = baseline ? 'Calculando a referência: hora do rush, durante 2 minutos simulados…' : 'Testando sua solução durante os mesmos 2 minutos simulados…';
    $<HTMLProgressElement>('[data-challenge-progress]').value = 0;
    try {
      const result = await experiment(baseline ? CHALLENGE_SETTINGS : hooks.city().settings, city => {
        hooks.replace(city); $<HTMLProgressElement>('[data-challenge-progress]').value = city.time;
        $('[data-running]').textContent = 'Teste acelerado';
      }, abort.signal);
      if (abort.signal.aborted) return;
      $<HTMLProgressElement>('[data-challenge-progress]').value = 120;
      if (baseline) {
        reference = result; printResult('ref', result); challengeStage = 'edit';
        $('[data-challenge-status]').textContent = `Referência pronta. Sua meta é pelo menos ${Math.ceil(result.completed * 1.2)} chegadas e menos de ${result.waiting} veículos parados. Ajuste os ônibus, a faixa exclusiva ou os semáforos e teste sua solução.`;
      } else if (reference) {
        printResult('solution', result); challengeStage = 'result';
        const score = compareSolution(reference, result);
        $('[data-challenge-status]').textContent = score.success
          ? `Desafio concluído! ${result.completed} pessoas chegaram, com ${result.waiting} veículos parados e ${result.queued} pessoas na fila de entrada. Você manteve a mesma demanda.`
          : `Ainda não: sua solução teve ${result.completed} chegadas e ${result.waiting} veículos parados. A meta é ${score.target} chegadas, menos de ${reference.waiting} parados e até ${reference.queued} pessoas na fila de entrada. Ajuste e tente outra vez.`;
      }
      lockChallenge(false);
      hooks.run(false);
    } catch (error) {
      if (abort.signal.aborted) return;
      $('[data-challenge-status]').textContent = 'Não foi possível concluir este teste. Saia do desafio e tente novamente.';
      lockChallenge(false);
    }
  }
  async function startChallenge() {
    if (dialog.open) closeTour();
    if (challengeStage !== 'off') return;
    challengeSnapshot = capture(); hooks.run(false);
    $('[data-challenge]').hidden = false;
    for (const item of document.querySelectorAll<HTMLElement>('[data-ref], [data-solution]')) item.textContent = '—';
    $('[data-challenge]').scrollIntoView({ behavior: 'instant', block: 'start' });
    await calculate(true);
  }
  $('[data-challenge-open]').addEventListener('click', () => { void startChallenge(); });
  $('[data-challenge-stop]').addEventListener('click', stopChallenge);
  $('[data-challenge-test]').addEventListener('click', () => { if (reference && (challengeStage === 'edit' || challengeStage === 'result')) void calculate(false); });
  for (const input of document.querySelectorAll<HTMLInputElement>('.controls input')) input.addEventListener('input', () => {
    if (challengeStage !== 'result') return;
    challengeStage = 'edit';
    $('[data-challenge-status]').textContent = 'Você alterou os ajustes. A tabela mostra o último teste; teste novamente para avaliar a nova solução.';
  });
  addEventListener('pagehide', () => { stopDemo(); controller?.abort(); }, { once: true });
  let visited = false;
  try { visited = sessionStorage.getItem('entrevias-guide-v1') === 'seen'; } catch { /* Primeiro acesso sem armazenamento. */ }
  // Links compartilhados abrem diretamente no cenário que a pessoa recebeu.
  const intent = new URLSearchParams(location.search);
  if (intent.get('desafio') === '1') void startChallenge();
  else if (intent.get('guia') === '1' || (!visited && !location.search)) openTour();
}

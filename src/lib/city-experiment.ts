import { City, PRESETS, type Settings } from './city-engine';

export const EXPERIMENT_SECONDS = 120;
export const CHALLENGE_SETTINGS: Settings = { ...PRESETS.rush };
export type Result = { completed: number; waiting: number; average: number; queued: number; time: number };
export const resultOf = (city: City): Result => ({ completed: city.completed, waiting: city.waiting, average: city.average, queued: city.queuedPeople, time: city.time });
export function compareSolution(reference: Result, solution: Result) {
  const target = Math.ceil(reference.completed * 1.2);
  return { target, success: solution.completed >= target && solution.waiting < reference.waiting && solution.queued <= reference.queued };
}
/** Todas as tentativas começam vazias, com semente fixa e 2.400 passos iguais. */
export async function experiment(settings: Settings, onFrame: (city: City) => void, signal: AbortSignal): Promise<Result> {
  const city = new City({ ...settings, demand: CHALLENGE_SETTINGS.demand });
  for (let frame = 0; frame < 60; frame++) {
    if (signal.aborted) throw new DOMException('Experimento cancelado', 'AbortError');
    for (let step = 0; step < 40; step++) city.tick(.05);
    onFrame(city);
    // O cálculo não depende de a maquete estar visível ou do ritmo da GPU.
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
  if (signal.aborted) throw new DOMException('Experimento cancelado', 'AbortError');
  return resultOf(city);
}

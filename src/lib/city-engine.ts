/** Modelo didático: rede sintética, tempos e capacidade simplificados. */
export const COLS = 8;
export const ROWS = 6;
export type Settings = { demand: number; transit: number; signal: number; busLane: boolean; works: boolean };
export const PRESETS: Record<string, Settings> = {
  equilibrio: { demand: 55, transit: 25, signal: 12, busLane: false, works: false },
  rush: { demand: 95, transit: 10, signal: 18, busLane: false, works: false },
  coletivo: { demand: 95, transit: 65, signal: 12, busLane: true, works: false },
};
export type Vehicle = { id: number; bus: boolean; people: number; route: number[]; step: number; progress: number; born: number; stopped: boolean; dwell: number };
export const point = (id: number) => ({ x: id % COLS, y: Math.floor(id / COLS) });
export const closedEdge = [3 + COLS * 2, 4 + COLS * 2];
export type SignalColor = 'green' | 'amber' | 'red';
/** Mesmo relógio para o motor, o mapa e os focos luminosos da maquete. */
export function trafficSignal(time: number, x: number, y: number, cycle: number): { horizontal: SignalColor; vertical: SignalColor } {
  const local = time + x * 1.4 + y * .9;
  const horizontal = Math.floor(local / cycle) % 2 === 0;
  const active: SignalColor = cycle - local % cycle <= Math.min(2, cycle / 4) ? 'amber' : 'green';
  return { horizontal: horizontal ? active : 'red', vertical: horizontal ? 'red' : active };
}
export function route(start: number, end: number, works = false): number[] {
  const queue = [start];
  const previous = new Map<number, number>([[start, -1]]);
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    if (current === end) break;
    const { x, y } = point(current);
    const neighbors = [x < COLS - 1 ? current + 1 : -1, y < ROWS - 1 ? current + COLS : -1, x > 0 ? current - 1 : -1, y > 0 ? current - COLS : -1];
    for (const next of neighbors) {
      if (next < 0 || previous.has(next)) continue;
      if (works && closedEdge.includes(current) && closedEdge.includes(next)) continue;
      previous.set(next, current); queue.push(next);
    }
  }
  if (!previous.has(end)) return [];
  const result = [end];
  while (result[0] !== start) result.unshift(previous.get(result[0])!);
  return result;
}

export class City {
  settings: Settings;
  vehicles: Vehicle[] = [];
  time = 0;
  completed = 0;
  totalTravelTime = 0;
  entered = 0;
  private seed = 1947;
  private nextId = 1;
  private carCredit = 0;
  private busCredit = 0;
  private pendingCars = 0;
  private pendingBuses = 0;
  constructor(settings: Settings) { this.settings = { ...settings }; }
  random() { this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0; return this.seed / 4294967296; }
  get average() { return this.completed ? this.totalTravelTime / this.completed : 0; }
  get waiting() { return this.vehicles.filter(v => v.stopped).length; }
  get queuedPeople() { return this.pendingCars + this.pendingBuses * 12; }
  private spawn(bus: boolean): boolean {
    const boundary = Array.from({ length: COLS * ROWS }, (_, i) => i).filter(i => { const p = point(i); return p.x === 0 || p.x === COLS - 1 || p.y === 0 || p.y === ROWS - 1; });
    const start = boundary[Math.floor(this.random() * boundary.length)];
    const ends = boundary.filter(i => { const a = point(start), b = point(i); return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) >= 5; });
    const end = ends[Math.floor(this.random() * ends.length)];
    const path = route(start, end, this.settings.works);
    if (path.length < 2) return false;
    if (this.vehicles.some(v => v.route[v.step] === start && v.route[v.step + 1] === path[1] && v.progress < .16 && !(this.settings.busLane && v.bus !== bus))) return false;
    const people = bus ? 12 : 1;
    this.vehicles.push({ id: this.nextId++, bus, people, route: path, step: 0, progress: 0, born: this.time, stopped: false, dwell: 0 });
    this.entered += people;
    return true;
  }
  tick(dt: number) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    // Subpassos mantêm o resultado estável quando o navegador entrega quadros longos.
    if (dt > .05) { const n = Math.ceil(dt / .05); for (let i = 0; i < n; i++) this.tick(dt / n); return; }
    this.time += dt;
    const arrivals = this.settings.demand / 14;
    this.carCredit += arrivals * (1 - this.settings.transit / 100) * dt;
    this.busCredit += arrivals * this.settings.transit / 100 / 12 * dt;
    while (this.carCredit >= 1) { this.carCredit--; this.pendingCars++; }
    while (this.busCredit >= 1) { this.busCredit--; this.pendingBuses++; }
    if (this.vehicles.length < 650) {
      if (this.pendingCars && this.spawn(false)) this.pendingCars--;
      if (this.pendingBuses && this.spawn(true)) this.pendingBuses--;
    }
    const groups = new Map<string, Vehicle[]>();
    for (const v of this.vehicles) {
      const key = `${v.route[v.step]}:${v.route[v.step + 1]}:${this.settings.busLane && v.bus ? 'bus' : 'shared'}`;
      const group = groups.get(key) ?? []; group.push(v); groups.set(key, group);
    }
    for (const group of groups.values()) {
      group.sort((a, b) => b.progress - a.progress);
      let ahead = 2;
      for (const v of group) {
        const a = point(v.route[v.step]), b = point(v.route[v.step + 1]);
        const horizontal = a.y === b.y;
        const signals = trafficSignal(this.time, b.x, b.y, this.settings.signal);
        const green = (horizontal ? signals.horizontal : signals.vertical) === 'green';
        const last = v.step === v.route.length - 2;
        const speed = v.bus ? .23 : .30;
        const limit = !last && !green ? .88 : 1;
        const next = Math.max(v.progress, Math.min(v.progress + speed * dt, limit, ahead - .13));
        v.stopped = next - v.progress < speed * dt * .2;
        if (v.dwell > 0) { v.dwell = Math.max(0, v.dwell - dt); v.stopped = true; }
        else v.progress = next;
        ahead = v.progress;
        if (v.progress >= 1) {
          // Não entra em um trecho cuja entrada esteja ocupada.
          const occupied = !last && this.vehicles.some(other => other !== v && other.route[other.step] === v.route[v.step + 1] && other.route[other.step + 1] === v.route[v.step + 2] && other.progress < .15 && !(this.settings.busLane && other.bus !== v.bus));
          if (occupied) { v.progress = .99; v.stopped = true; continue; }
          v.step++; v.progress = 0;
          if (v.bus && v.step % 3 === 0) v.dwell = 1.5;
          if (last) { this.completed += v.people; this.totalTravelTime += (this.time - v.born) * v.people; }
        }
      }
    }
    this.vehicles = this.vehicles.filter(v => v.step < v.route.length - 1);
  }
}

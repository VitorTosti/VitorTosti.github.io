import { describe, expect, it } from 'vitest';
import { City, PRESETS, closedEdge, route, trafficSignal } from '../src/lib/city-engine';

describe('modelo de mobilidade', () => {
  it('alterna verde, amarelo e vermelho sem abrir direções conflitantes', () => {
    expect(trafficSignal(0, 0, 0, 12)).toEqual({ horizontal: 'green', vertical: 'red' });
    expect(trafficSignal(10.5, 0, 0, 12)).toEqual({ horizontal: 'amber', vertical: 'red' });
    expect(trafficSignal(12, 0, 0, 12)).toEqual({ horizontal: 'red', vertical: 'green' });
    expect(trafficSignal(23, 0, 0, 12)).toEqual({ horizontal: 'red', vertical: 'amber' });
    for (let time = 0; time < 100; time += .25) {
      const signals = trafficSignal(time, 3, 2, 6);
      expect(signals.horizontal === 'red' || signals.vertical === 'red').toBe(true);
    }
  });
  it('encontra um caminho mínimo e desvia do trecho em obras', () => {
    const direct = route(closedEdge[0], closedEdge[1]);
    const detour = route(closedEdge[0], closedEdge[1], true);
    expect(direct).toHaveLength(2);
    expect(detour).toHaveLength(4);
    for (let i = 1; i < detour.length; i++) expect(closedEdge.includes(detour[i - 1]) && closedEdge.includes(detour[i])).toBe(false);
  });
  it('conserva as pessoas que entraram, inclusive passageiros de ônibus', () => {
    const city = new City(PRESETS.coletivo);
    city.tick(100);
    expect(city.completed).toBeGreaterThan(0);
    expect(city.entered).toBe(city.completed + city.vehicles.reduce((sum, v) => sum + v.people, 0));
    expect(city.average).toBeGreaterThan(0);
    expect(city.vehicles.every(v => v.progress >= 0 && v.progress < 1)).toBe(true);
  });
  it('reproduz o mesmo cenário com a mesma semente', () => {
    const a = new City(PRESETS.rush), b = new City(PRESETS.rush);
    for (let i = 0; i < 500; i++) { a.tick(.04); b.tick(.04); }
    expect(a.vehicles).toEqual(b.vehicles);
    expect(a.completed).toBe(b.completed);
  });
  it('mantém passageiros equivalentes e reduz veículos de entrada com transporte coletivo', () => {
    const cars = new City({ ...PRESETS.rush, transit: 0 });
    const buses = new City({ ...PRESETS.rush, transit: 90 });
    cars.tick(30); buses.tick(30);
    expect(buses.vehicles.length).toBeLessThan(cars.vehicles.length);
    expect(buses.vehicles.some(v => v.bus && v.people === 12)).toBe(true);
  });
  it('ignora intervalos de tempo inválidos', () => {
    const city = new City(PRESETS.equilibrio);
    city.tick(NaN); city.tick(-1); city.tick(Infinity);
    expect(city.time).toBe(0);
    expect(city.entered).toBe(0);
  });
});

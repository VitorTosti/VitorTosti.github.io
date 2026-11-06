import { describe, expect, it } from 'vitest';
import { compareSolution, type Result } from '../src/lib/city-experiment';
const reference: Result = { completed: 100, waiting: 40, average: 40, queued: 5, time: 120 };
describe('desafio de mobilidade', () => {
  it('exige aumento de pelo menos 20% e redução dos veículos parados', () => {
    expect(compareSolution(reference, { ...reference, completed: 120, waiting: 39 }).success).toBe(true);
    expect(compareSolution(reference, { ...reference, completed: 119, waiting: 39 }).success).toBe(false);
    expect(compareSolution(reference, { ...reference, completed: 130, waiting: 40 }).success).toBe(false);
  });
  it('não aceita esconder o congestionamento na fila de entrada', () => {
    expect(compareSolution(reference, { ...reference, completed: 150, waiting: 10, queued: 6 }).success).toBe(false);
  });
  it('arredonda a meta para um número inteiro de pessoas', () => {
    expect(compareSolution({ ...reference, completed: 101 }, reference).target).toBe(122);
  });
});

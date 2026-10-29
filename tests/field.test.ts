import { describe, expect, it } from 'vitest';
import { livres, ocupados, posicionar } from '../src/lib/field';

describe('fundo da abertura', () => {
  const caixas = [
    { x: 100, y: 0, w: 100, h: 40 },
    { x: 180, y: 10, w: 60, h: 10 },
    { x: 500, y: 100, w: 50, h: 50 },
  ];

  it('une as caixas que cruzam a linha, com folga', () => {
    expect(ocupados(caixas, 0, 32, 10)).toEqual([[90, 250]]);
    expect(ocupados(caixas, 200, 232, 10)).toEqual([]);
  });

  it('acha os vãos livres da linha', () => {
    expect(livres(0, 800, [[90, 250]])).toEqual([
      [0, 90],
      [250, 800],
    ]);
    expect(livres(0, 800, [[0, 900]])).toEqual([]);
  });

  it('corta no fim da última palavra completa', () => {
    const toks = ['tempo', '_entre', ' etapas', ' de', ' venda'];
    expect(posicionar([10, 10, 10, 10, 10], toks, 0, 100)).toEqual([0, 10, 20, 30, 40]);
    expect(posicionar([10, 10, 10, 10, 10], toks, 0, 35)).toEqual([0, 10, 20]);
    expect(posicionar([10, 10, 10, 10, 10], toks, 0, 15)).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { distancia, ordemPorSemelhanca, pontos, vizinhos, type Ponto } from '../src/lib/latent';
import { infocaijMcp, outrosProjetos } from '../src/data/projetos';

describe('espaço latente', () => {
  it('tem um ponto para cada projeto, na mesma grafia', () => {
    const slugs = [infocaijMcp, ...outrosProjetos].map((p) => p.slug).sort();
    expect(pontos.map((p) => p.slug).sort()).toEqual(slugs);
  });

  it('posições dentro do mapa', () => {
    for (const p of pontos) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(1);
    }
  });

  it('cada ponto tem 2 vizinhos, sem ele mesmo', () => {
    const v = vizinhos(pontos);
    for (const p of pontos) {
      expect(v[p.slug]).toHaveLength(2);
      expect(v[p.slug]).not.toContain(p.slug);
    }
  });

  it('o vizinho mais próximo no vetor também está perto no mapa (o desenho não mente)', () => {
    const v = vizinhos(pontos, 1);
    const pos = (s: string) => pontos.find((p) => p.slug === s)!;
    for (const p of pontos) {
      const viz = pos(v[p.slug][0]);
      const dMapa = (a: Ponto, b: Ponto) => Math.hypot(a.x - b.x, a.y - b.y);
      const maisLonge = Math.max(...pontos.filter((q) => q !== p).map((q) => dMapa(p, q)));
      expect(dMapa(p, viz), p.slug).toBeLessThan(maisLonge);
    }
  });

  it('vizinhos e ordem são determinísticos em empates', () => {
    const a: Ponto[] = [
      { slug: 'a', nome: 'a', vetor: [0], x: 0, y: 0 },
      { slug: 'c', nome: 'c', vetor: [1], x: 0, y: 0 },
      { slug: 'b', nome: 'b', vetor: [1], x: 0, y: 0 },
    ];
    expect(vizinhos(a, 2).a).toEqual(['b', 'c']);
    expect(ordemPorSemelhanca(a).map((p) => p.slug)).toEqual(['a', 'b', 'c']);
  });

  it('a lista do celular começa no MCP e visita todos uma vez', () => {
    const ordem = ordemPorSemelhanca(pontos).map((p) => p.slug);
    expect(ordem[0]).toBe('infocaij-mcp');
    expect(new Set(ordem).size).toBe(pontos.length);
  });

  it('distância é simétrica e zero consigo mesma', () => {
    expect(distancia([1, 2], [1, 2])).toBe(0);
    expect(distancia([0, 1], [1, 0])).toBe(distancia([1, 0], [0, 1]));
  });
});

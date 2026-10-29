// Espaço latente desenhado à mão: cada projeto tem um vetor de habilidades e uma posição 2D escolhida
// para que projetos parecidos fiquem perto. Não é t-SNE; os vizinhos vêm do vetor de habilidades.

export const HABILIDADES = ['agentes', 'avaliação', 'ferramenta interna', 'dados', 'interface'] as const;
export type Habilidade = (typeof HABILIDADES)[number];

export type Ponto = {
  slug: string;
  nome: string;
  /** Peso de 0 a 1 em cada habilidade, na ordem de HABILIDADES. */
  vetor: number[];
  /** Posição no mapa, de 0 a 1. */
  x: number;
  y: number;
};

export function distancia(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
}

/** Os k vizinhos mais próximos de cada ponto, pelo vetor de habilidades. Empate: ordem alfabética do slug. */
export function vizinhos(pontos: Ponto[], k = 2): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const p of pontos) {
    out[p.slug] = pontos
      .filter((q) => q.slug !== p.slug)
      .map((q) => ({ slug: q.slug, d: distancia(p.vetor, q.vetor) }))
      .sort((a, b) => a.d - b.d || a.slug.localeCompare(b.slug))
      .slice(0, k)
      .map((q) => q.slug);
  }
  return out;
}

/** Ordem por semelhança para a lista do celular: começa no primeiro ponto e segue sempre o mais próximo ainda não visitado. */
export function ordemPorSemelhanca(pontos: Ponto[]): Ponto[] {
  if (!pontos.length) return [];
  const resto = [...pontos];
  const out = [resto.shift()!];
  while (resto.length) {
    const atual = out[out.length - 1];
    resto.sort((a, b) => distancia(atual.vetor, a.vetor) - distancia(atual.vetor, b.vetor) || a.slug.localeCompare(b.slug));
    out.push(resto.shift()!);
  }
  return out;
}

export const pontos: Ponto[] = [
  //                                            agentes avaliação interna dados interface
  { slug: 'infocaij-mcp', nome: 'InfoCAIJ MCP', vetor: [1, 0.9, 0.8, 0.8, 0.1], x: 0.7, y: 0.3 },
  { slug: 'cardapio-em-1-minuto', nome: 'Cardápio em 1 minuto', vetor: [0.4, 1, 0, 0.8, 0.3], x: 0.86, y: 0.66 },
  { slug: 'infocaij', nome: 'InfoCAIJ', vetor: [0, 0.3, 1, 0.9, 0.8], x: 0.38, y: 0.32 },
  { slug: 'infomachine', nome: 'InfoMachine', vetor: [0, 0.4, 1, 0.5, 0.9], x: 0.16, y: 0.5 },
  { slug: 'coreufabc', nome: 'CoreUFABC', vetor: [0, 0.5, 0, 0.9, 0.7], x: 0.44, y: 0.76 },
];

/** Rótulos das regiões do mapa, onde cada habilidade pesa mais. */
export const regioes: { t: Habilidade; x: number; y: number }[] = [
  { t: 'agentes', x: 0.78, y: 0.1 },
  { t: 'avaliação', x: 0.92, y: 0.9 },
  { t: 'ferramenta interna', x: 0.2, y: 0.12 },
  { t: 'dados', x: 0.55, y: 0.55 },
  { t: 'interface', x: 0.06, y: 0.82 },
];

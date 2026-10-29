// Geometria do fundo da abertura: onde cada linha da pauta pode escrever sem passar por cima do texto.
import type { Correcao } from './trace';

export type Intervalo = [number, number];
export type Caixa = { x: number; y: number; w: number; h: number };

/** Uma correção vira três linhas do log: o que falhou, o ajuste e o que passou. */
export function correcaoTexto(c: Correcao): string[] {
  return [`✗ ${c.falhou}`, `→ ${c.ajuste}`, `✓ ${c.passou}`];
}

/** Trechos horizontais ocupados numa linha [y0, y1]: as caixas que a cruzam, com folga, unidas e em ordem. */
export function ocupados(caixas: Caixa[], y0: number, y1: number, folga: number): Intervalo[] {
  const xs = caixas
    .filter((c) => c.y < y1 && c.y + c.h > y0)
    .map((c): Intervalo => [c.x - folga, c.x + c.w + folga])
    .sort((a, b) => a[0] - b[0]);
  const out: Intervalo[] = [];
  for (const i of xs) {
    const ult = out[out.length - 1];
    if (ult && i[0] <= ult[1]) ult[1] = Math.max(ult[1], i[1]);
    else out.push([...i]);
  }
  return out;
}

/** O que sobra de [ini, fim] depois de tirar os trechos ocupados (que já vêm unidos e em ordem). */
export function livres(ini: number, fim: number, ocupado: Intervalo[]): Intervalo[] {
  const out: Intervalo[] = [];
  let x = ini;
  for (const [a, b] of ocupado) {
    if (a > x) out.push([x, Math.min(a, fim)]);
    x = Math.max(x, b);
    if (x >= fim) break;
  }
  if (x < fim) out.push([x, fim]);
  return out.filter(([a, b]) => b > a);
}

/**
 * Posição x de cada token a partir de `inicio`, sem passar de `fim`. Quando a frase não cabe inteira,
 * corta no fim da última palavra completa (um token que começa com espaço abre palavra nova).
 */
export function posicionar(larguras: number[], toks: string[], inicio: number, fim: number): number[] {
  const out: number[] = [];
  let x = inicio;
  for (const w of larguras) {
    if (x + w > fim) break;
    out.push(x);
    x += w;
  }
  if (out.length < toks.length) {
    let n = out.length;
    while (n > 0 && !toks[n].startsWith(' ')) n--;
    out.length = n;
  }
  return out;
}

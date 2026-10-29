// Matemática do painel "logit lens" da abertura: temperatura sobre o top-5 e a posição mais disputada.
import type { Alt } from './tokenize';

/**
 * Reaplica a temperatura sobre o top-5: p_i^(1/T), renormalizado para manter a massa que o top-5 já
 * tinha (o resto do vocabulário fica de fora). T = 1 devolve os números originais; T → 0 concentra
 * no mais provável; T > 1 achata.
 */
export function aplicarTemperatura(alts: Alt[], T: number): Alt[] {
  if (!alts.length) return [];
  const t = Math.max(T, 0.05);
  const massa = alts.reduce((s, a) => s + a.p, 0);
  const pesos = alts.map((a) => Math.pow(Math.max(a.p, 1e-9), 1 / t));
  const soma = pesos.reduce((s, w) => s + w, 0);
  return alts.map((a, i) => ({ t: a.t, p: (pesos[i] / soma) * massa }));
}

/** Diferença entre o 1º e o 2º do top-5; quanto menor, mais disputada a posição. */
export function margem(alts: Alt[]): number {
  const ps = alts.map((a) => a.p).sort((a, b) => b - a);
  return ps.length < 2 ? 1 : ps[0] - ps[1];
}

/** Índice da posição mais disputada entre as que têm alternativas; -1 se nenhuma tiver. */
export function maisDisputado(tokens: { alts: Alt[] }[]): number {
  let melhor = -1;
  let menor = Infinity;
  tokens.forEach((k, i) => {
    if (k.alts.length < 2) return;
    const m = margem(k.alts);
    if (m < menor) {
      menor = m;
      melhor = i;
    }
  });
  return melhor;
}

/** O mais provável do top-5 (o que o modelo escreveria com temperatura 0). */
export function maisProvavel(alts: Alt[]): Alt | null {
  return alts.reduce<Alt | null>((m, a) => (!m || a.p > m.p ? a : m), null);
}

// Modelo dos rastros de agente: cada projeto é contado como uma execução.

export type Passo =
  | { tipo: 'pergunta'; texto: string; /** "problema" quando não é uma pergunta literal. */ rotulo?: string }
  | {
      tipo: 'chamada';
      ferramenta: string;
      args: Record<string, unknown>;
      ms?: number;
      /** Etapa do fluxo descrita como chamada; o nome é descritivo, não uma função real. */
      etapa?: boolean;
    }
  | { tipo: 'saida'; texto: string; aviso?: string }
  | { tipo: 'avaliacao'; itens: string[] };

/** Erro e correção: ✗ falhou → causa → ajuste → ✓ passou. */
export type Correcao = {
  rotulo: string;
  falhou: string;
  causa: string;
  ajuste: string;
  passou: string;
};

export const ORDEM_CORRECAO = ['falhou', 'causa', 'ajuste', 'passou'] as const;

/**
 * Confere a forma de um rastro: começa com a pergunta, termina com a avaliação, toda saída vem depois
 * de pelo menos uma chamada. Devolve a lista de problemas (vazia se o rastro estiver certo).
 */
export function validarRastro(passos: Passo[]): string[] {
  const erros: string[] = [];
  if (passos[0]?.tipo !== 'pergunta') erros.push('o rastro deve começar com a pergunta');
  if (passos.at(-1)?.tipo !== 'avaliacao') erros.push('o rastro deve terminar com a avaliação');
  if (passos.filter((p) => p.tipo === 'pergunta').length !== 1) erros.push('deve haver exatamente uma pergunta');
  if (passos.filter((p) => p.tipo === 'avaliacao').length !== 1) erros.push('deve haver exatamente uma avaliação');
  let chamou = false;
  for (const p of passos) {
    if (p.tipo === 'chamada') chamou = true;
    if (p.tipo === 'saida' && !chamou) erros.push('saída antes de qualquer chamada de ferramenta');
  }
  return erros;
}

/** Linhas de uma correção, sempre na ordem ✗ → causa → ajuste → ✓. */
export function linhasCorrecao(c: Correcao): { etapa: (typeof ORDEM_CORRECAO)[number]; texto: string }[] {
  return ORDEM_CORRECAO.map((etapa) => ({ etapa, texto: c[etapa] }));
}

/**
 * Quando cada passo aparece (ms desde que o bloco entra na tela), como um log em tempo real.
 * Chamadas de ferramenta "rodam" um pouco mais antes da saída aparecer.
 */
export function agendaPassos(tipos: string[], intervalo = 260, chamada = 520): number[] {
  const out: number[] = [];
  let t = 0;
  for (const tipo of tipos) {
    out.push(t);
    t += tipo === 'chamada' ? chamada : intervalo;
  }
  return out;
}

/** JSON dos argumentos em pedaços com tipo, para destacar chaves e valores sem biblioteca. */
export function jsonTokens(v: unknown): { k: 'pont' | 'chave' | 'str' | 'num' | 'lit'; t: string }[] {
  const s = JSON.stringify(v);
  const out: { k: 'pont' | 'chave' | 'str' | 'num' | 'lit'; t: string }[] = [];
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)|(true|false|null)|([{}[\],:])/gi;
  for (const m of s.matchAll(re)) {
    if (m[1]) {
      out.push({ k: m[2] ? 'chave' : 'str', t: m[1] });
      if (m[2]) out.push({ k: 'pont', t: ': ' });
    } else if (m[3]) out.push({ k: 'num', t: m[3] });
    else if (m[4]) out.push({ k: 'lit', t: m[4] });
    else out.push({ k: 'pont', t: m[5] === ',' ? ', ' : m[5] });
  }
  return out;
}

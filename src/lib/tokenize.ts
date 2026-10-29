// Divide frases em tokens e junta cada token com as alternativas de alternativas.json.

export type Alt = { t: string; p: number };

export type TokenData = {
  /** Texto exato do token, com o espaço à esquerda quando houver (" sistemas"). */
  t: string;
  /** Probabilidade do token escolhido; null quando ele ficou fora do top-5 ou não foi medido. */
  p: number | null;
  /** Top-5 do modelo naquela posição, em ordem decrescente. */
  alts: Alt[];
  foraDoTop?: boolean;
};

export type Frase = { texto: string; tokens: TokenData[] };

export type Fonte = {
  tipo: 'ilustrativa' | 'gemini';
  modelo: string | null;
  metodo: string;
  geradoEm: string | null;
};

export type Alternativas = { fonte: Fonte; frases: Record<string, Frase> };

export type RenderToken = {
  /** Espaço antes do token, renderizado fora do span para não sublinhar espaço. */
  lead: string;
  text: string;
  p: number | null;
  alts: Alt[];
  foraDoTop: boolean;
};

const PEDACO = /\s*[\p{L}\p{N}]+|\s*[^\s\p{L}\p{N}]/gu;
const PALAVRA_LONGA = 7;

/** Tokenizador de reserva: palavras curtas inteiras, palavras longas em dois pedaços, pontuação separada. */
export function splitFallback(texto: string): string[] {
  const out: string[] = [];
  for (const m of texto.matchAll(PEDACO)) {
    const raw = m[0];
    const lead = raw.match(/^\s*/)![0];
    const core = raw.slice(lead.length);
    if (core.length > PALAVRA_LONGA && /^[\p{L}\p{N}]+$/u.test(core)) {
      const corte = Math.ceil(core.length / 2);
      out.push(lead + core.slice(0, corte), core.slice(corte));
    } else {
      out.push(raw);
    }
  }
  return out;
}

/** Números saem dígito a dígito; símbolos e palavras ao redor ficam inteiros. "60–90 → 5 min" → 6,0,–,9,0, →, 5, min. */
export function splitNumber(texto: string): string[] {
  return [...texto.matchAll(/\s*\d|\s*[^\s\d]+/g)].map((m) => m[0]);
}

export function toRender(t: string, data?: TokenData): RenderToken {
  const lead = t.match(/^\s*/)![0];
  return {
    lead,
    text: t.slice(lead.length),
    p: data?.p ?? null,
    alts: data?.alts ?? [],
    foraDoTop: data?.foraDoTop ?? false,
  };
}

/**
 * Tokens para renderizar uma frase. Usa a divisão do modelo quando o JSON tem a frase
 * e os tokens reconstituem exatamente o texto; senão cai no tokenizador de reserva, sem alternativas.
 */
export function resolveFrase(id: string, texto: string, dados?: Alternativas | null): RenderToken[] {
  const frase = dados?.frases[id];
  if (frase && frase.texto === texto && frase.tokens.map((k) => k.t).join('') === texto) {
    return frase.tokens.map((k) => toRender(k.t, k));
  }
  return splitFallback(texto).map((t) => toRender(t));
}

function isProb(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 1;
}

/** Valida o JSON de alternativas. Lança erro se a forma estiver errada; descarta alternativas inválidas. */
export function parseAlternativas(json: unknown): Alternativas {
  if (!json || typeof json !== 'object') throw new Error('alternativas: JSON vazio');
  const { fonte, frases } = json as Record<string, unknown>;
  if (!fonte || typeof fonte !== 'object') throw new Error('alternativas: falta "fonte"');
  const f = fonte as Record<string, unknown>;
  if (f.tipo !== 'ilustrativa' && f.tipo !== 'gemini') throw new Error('alternativas: "fonte.tipo" inválido');
  if (f.tipo === 'gemini' && typeof f.modelo !== 'string') throw new Error('alternativas: falta "fonte.modelo"');
  if (!frases || typeof frases !== 'object') throw new Error('alternativas: falta "frases"');

  const out: Record<string, Frase> = {};
  for (const [id, raw] of Object.entries(frases as Record<string, unknown>)) {
    const fr = raw as { texto?: unknown; tokens?: unknown };
    if (typeof fr.texto !== 'string' || !Array.isArray(fr.tokens)) throw new Error(`alternativas: frase "${id}" inválida`);
    out[id] = {
      texto: fr.texto,
      tokens: fr.tokens.map((k: any) => {
        if (typeof k?.t !== 'string') throw new Error(`alternativas: token inválido em "${id}"`);
        const alts: Alt[] = Array.isArray(k.alts)
          ? k.alts.filter((a: any) => typeof a?.t === 'string' && isProb(a.p)).map((a: any) => ({ t: a.t, p: a.p }))
          : [];
        alts.sort((a, b) => b.p - a.p);
        return { t: k.t, p: isProb(k.p) ? k.p : null, alts: alts.slice(0, 5), foraDoTop: k.foraDoTop === true };
      }),
    };
  }
  return {
    fonte: {
      tipo: f.tipo,
      modelo: typeof f.modelo === 'string' ? f.modelo : null,
      metodo: typeof f.metodo === 'string' ? f.metodo : '',
      geradoEm: typeof f.geradoEm === 'string' ? f.geradoEm : null,
    },
    frases: out,
  };
}

/** Gerador pseudoaleatório pequeno e determinístico (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Instante (ms) em que cada token aparece. Ritmo levemente irregular, com pausa depois de pontuação,
 * como um modelo gerando. Determinístico para o mesmo seed.
 */
export function generationTimes(tokens: string[], seed = 7, base = 42, jitter = 58, pausa = 160): number[] {
  const r = rng(seed);
  const out: number[] = [];
  let t = 0;
  tokens.forEach((tok, i) => {
    out.push(Math.round(t));
    t += base + r() * jitter;
    if (/[,.;:!?]\s*$/.test(tok) && i < tokens.length - 1) t += pausa;
  });
  return out;
}

export function formatPct(p: number): string {
  const v = p * 100;
  if (v >= 10) return `${Math.round(v)}%`;
  if (v >= 1) return `${v.toFixed(1).replace('.', ',')}%`;
  return '<1%';
}

// Gera src/data/alternativas.json com probabilidades reais do Gemini.
//
// Uso: GEMINI_API_KEY=... npm run alternativas
// Opcional: GEMINI_MODEL (padrão gemini-2.5-flash).
//
// Método: o Gemini só devolve logprobs do texto que ele mesmo gera, então cada posição da frase é
// medida separadamente. O modelo recebe o começo da frase e gera 1 token; guardamos o top-5 daquela
// posição. Para avançar na frase usamos o candidato mais longo que bate com o texto restante; se
// nenhum bate, avançamos uma palavra e marcamos o token como "fora do top-5" (sem inventar número).

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const OUT = fileURLToPath(new URL('../src/data/alternativas.json', import.meta.url));
const I18N = fileURLToPath(new URL('../src/i18n/pt-BR.ts', import.meta.url));

type Alt = { t: string; p: number };
type Tok = { t: string; p: number | null; alts: Alt[]; foraDoTop?: boolean };

const INSTRUCAO =
  'Você está escrevendo o título de um site-portfólio em português do Brasil. ' +
  'Continue o texto exatamente de onde ele parou, sem repetir nada e sem comentários.';

/** Lê as frases de src/i18n/pt-BR.ts sem importar TypeScript em tempo de execução. */
function lerFrases(): Record<string, string> {
  const src = readFileSync(I18N, 'utf8');
  const bloco = src.match(/frases:\s*\{([\s\S]*?)\n\s*\},/);
  if (!bloco) throw new Error('não achei "frases" em pt-BR.ts');
  const out: Record<string, string> = {};
  for (const m of bloco[1].matchAll(/(\w+):\s*'([^']*)'/g)) out[m[1]] = m[2];
  return out;
}

async function topK(prefixo: string): Promise<Alt[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const body = {
    systemInstruction: { parts: [{ text: INSTRUCAO }] },
    contents: [{ role: 'user', parts: [{ text: prefixo || '(início do título)' }] }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 1,
      responseLogprobs: true,
      logprobs: 5,
      ...(MODEL.includes('2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
  };
  for (let tentativa = 1; ; tentativa++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY! },
      body: JSON.stringify(body),
    });
    if (res.status === 429 && tentativa < 5) {
      await new Promise((r) => setTimeout(r, 2000 * tentativa));
      continue;
    }
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const json: any = await res.json();
    const cands = json.candidates?.[0]?.logprobsResult?.topCandidates?.[0]?.candidates;
    if (!Array.isArray(cands)) throw new Error(`resposta sem logprobs: ${JSON.stringify(json).slice(0, 400)}`);
    return cands.map((c: any) => ({ t: String(c.token), p: Math.exp(c.logProbability) }));
  }
}

async function medirFrase(texto: string): Promise<Tok[]> {
  const tokens: Tok[] = [];
  let pos = 0;
  while (pos < texto.length) {
    const resto = texto.slice(pos);
    const alts = await topK(texto.slice(0, pos));
    const bate = alts.filter((a) => a.t.length > 0 && resto.startsWith(a.t)).sort((a, b) => b.t.length - a.t.length)[0];
    if (bate) {
      tokens.push({ t: bate.t, p: bate.p, alts });
      pos += bate.t.length;
    } else {
      const palavra = resto.match(/^\s*[\p{L}\p{N}]+|^\s*[^\s\p{L}\p{N}]|^\s+/u)![0];
      tokens.push({ t: palavra, p: null, alts, foraDoTop: true });
      pos += palavra.length;
    }
    process.stdout.write('.');
  }
  return tokens;
}

async function main() {
  if (!KEY) {
    console.error('GEMINI_API_KEY não definida. O site continua usando as probabilidades ilustrativas.');
    process.exit(1);
  }
  const frases = lerFrases();
  const saida: Record<string, { texto: string; tokens: Tok[] }> = {};
  for (const [id, texto] of Object.entries(frases)) {
    process.stdout.write(`${id} `);
    saida[id] = { texto, tokens: await medirFrase(texto) };
    process.stdout.write('\n');
  }
  const json = {
    fonte: {
      tipo: 'gemini',
      modelo: MODEL,
      metodo: 'top-5 logprobs por posição, com o começo da frase como contexto',
      geradoEm: new Date().toISOString().slice(0, 10),
    },
    frases: saida,
  };
  writeFileSync(OUT, JSON.stringify(json, null, 2) + '\n');
  console.log(`salvo em ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

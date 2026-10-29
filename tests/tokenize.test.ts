import { describe, expect, it } from 'vitest';
import raw from '../src/data/alternativas.json';
import { ptBR } from '../src/i18n/pt-BR';
import {
  formatPct,
  generationTimes,
  parseAlternativas,
  resolveFrase,
  splitFallback,
  splitNumber,
} from '../src/lib/tokenize';

describe('splitFallback', () => {
  it('reconstitui o texto exatamente', () => {
    for (const texto of Object.values(ptBR.frases)) expect(splitFallback(texto).join('')).toBe(texto);
  });

  it('separa pontuação e quebra palavras longas em dois pedaços', () => {
    expect(splitFallback('Coloco IA em sistemas, e')).toEqual(['Coloco', ' IA', ' em', ' sist', 'emas', ',', ' e']);
  });

  it('mantém acentos dentro do token', () => {
    expect(splitFallback('meço onde')).toEqual(['meço', ' onde']);
  });
});

describe('splitNumber', () => {
  it('gera números dígito a dígito', () => {
    expect(splitNumber('~300')).toEqual(['~', '3', '0', '0']);
    expect(splitNumber('60–90 → 5 min')).toEqual(['6', '0', '–', '9', '0', ' →', ' 5', ' min']);
    expect(splitNumber('93 de 135').join('')).toBe('93 de 135');
  });
});

describe('alternativas.json', () => {
  const dados = parseAlternativas(raw);

  it('tem uma fonte declarada', () => {
    expect(['ilustrativa', 'gemini']).toContain(dados.fonte.tipo);
    if (dados.fonte.tipo === 'gemini') expect(dados.fonte.modelo).toBeTruthy();
  });

  it('cada frase do JSON bate com o texto do site e os tokens reconstituem a frase', () => {
    for (const [id, frase] of Object.entries(dados.frases)) {
      expect(ptBR.frases[id as keyof typeof ptBR.frases], id).toBe(frase.texto);
      expect(frase.tokens.map((k) => k.t).join(''), id).toBe(frase.texto);
    }
  });

  it('probabilidades ficam entre 0 e 1, top-5 ordenado e soma no máximo 1', () => {
    for (const frase of Object.values(dados.frases))
      for (const k of frase.tokens) {
        expect(k.alts.length).toBeLessThanOrEqual(5);
        const ps = k.alts.map((a) => a.p);
        expect([...ps].sort((a, b) => b - a)).toEqual(ps);
        expect(ps.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(1.0001);
      }
  });

  it('a abertura usa a divisão do JSON, com alternativas', () => {
    const toks = resolveFrase('abertura', ptBR.frases.abertura, dados);
    expect(toks.map((k) => k.lead + k.text).join('')).toBe(ptBR.frases.abertura);
    expect(toks[0].text).toBe('Coloco');
    expect(toks[0].alts.map((a) => a.t)).toContain('Construo');
  });
});

describe('parseAlternativas', () => {
  const base = { fonte: { tipo: 'ilustrativa', modelo: null, metodo: '', geradoEm: null }, frases: {} };

  it('rejeita fonte desconhecida e gemini sem modelo', () => {
    expect(() => parseAlternativas({ ...base, fonte: { tipo: 'chute' } })).toThrow();
    expect(() => parseAlternativas({ ...base, fonte: { tipo: 'gemini' } })).toThrow();
    expect(() => parseAlternativas(null)).toThrow();
  });

  it('descarta probabilidades inválidas e ordena o top-5', () => {
    const d = parseAlternativas({
      ...base,
      frases: {
        x: {
          texto: 'a',
          tokens: [{ t: 'a', p: 2, alts: [{ t: 'b', p: 0.1 }, { t: 'a', p: 0.8 }, { t: 'c', p: -1 }, { t: 'd', p: NaN }] }],
        },
      },
    });
    expect(d.frases.x.tokens[0].p).toBeNull();
    expect(d.frases.x.tokens[0].alts).toEqual([
      { t: 'a', p: 0.8 },
      { t: 'b', p: 0.1 },
    ]);
  });
});

describe('resolveFrase', () => {
  it('cai no tokenizador de reserva quando o texto mudou ou o JSON falta', () => {
    const dados = parseAlternativas(raw);
    const mudou = resolveFrase('abertura', 'Coloco IA em produção.', dados);
    expect(mudou.every((k) => k.alts.length === 0)).toBe(true);
    expect(mudou.map((k) => k.lead + k.text).join('')).toBe('Coloco IA em produção.');
    expect(resolveFrase('nao-existe', 'Olá mundo', null).length).toBeGreaterThan(0);
  });

  it('separa o espaço à esquerda do texto do token', () => {
    const [, ia] = resolveFrase('x', 'Coloco IA', null);
    expect(ia).toMatchObject({ lead: ' ', text: 'IA' });
  });
});

describe('generationTimes', () => {
  const toks = ['Coloco', ' IA', ',', ' e', ' meço', '.'];

  it('é crescente, começa em zero e é determinístico', () => {
    const a = generationTimes(toks, 3);
    expect(a[0]).toBe(0);
    for (let i = 1; i < a.length; i++) expect(a[i]).toBeGreaterThan(a[i - 1]);
    expect(generationTimes(toks, 3)).toEqual(a);
  });

  it('é irregular e pausa depois de pontuação', () => {
    const a = generationTimes(toks, 3);
    const gaps = a.slice(1).map((t, i) => t - a[i]);
    expect(new Set(gaps).size).toBeGreaterThan(1);
    expect(gaps[2]).toBeGreaterThan(160); // depois da vírgula
  });
});

describe('formatPct', () => {
  it('formata em pt-BR', () => {
    expect(formatPct(0.61)).toBe('61%');
    expect(formatPct(0.042)).toBe('4,2%');
    expect(formatPct(0.001)).toBe('<1%');
  });
});

describe('lente', async () => {
  const { aplicarTemperatura, maisDisputado, margem, maisProvavel } = await import('../src/lib/lens');
  const alts = [
    { t: 'testo', p: 0.31 },
    { t: 'meço', p: 0.29 },
    { t: 'avalio', p: 0.22 },
  ];

  it('temperatura 1 devolve os números originais; abaixo de 1 concentra; acima achata', () => {
    const t1 = aplicarTemperatura(alts, 1);
    t1.forEach((a, i) => expect(a.p).toBeCloseTo(alts[i].p));
    const t05 = aplicarTemperatura(alts, 0.5);
    expect(t05.reduce((s, a) => s + a.p, 0)).toBeCloseTo(0.82);
    expect(aplicarTemperatura(alts, 0.2)[0].p).toBeGreaterThan(t1[0].p);
    expect(aplicarTemperatura(alts, 2)[0].p).toBeLessThan(t1[0].p);
    expect(aplicarTemperatura([], 1)).toEqual([]);
  });

  it('acha a posição mais disputada da abertura: "meço" (31% contra 29%)', () => {
    const dados = parseAlternativas(raw);
    const toks = resolveFrase('abertura', ptBR.frases.abertura, dados);
    const i = maisDisputado(toks);
    expect(toks[i].text).toBe('meço');
    expect(margem(toks[i].alts)).toBeCloseTo(0.02);
    expect(maisProvavel(toks[i].alts)?.t.trim()).toBe('testo');
    expect(maisDisputado([{ alts: [] }])).toBe(-1);
  });
});

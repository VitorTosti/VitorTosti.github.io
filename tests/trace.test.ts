import { describe, expect, it } from 'vitest';
import { infocaijMcp } from '../src/data/projetos';
import { agendaPassos, jsonTokens, linhasCorrecao, validarRastro, type Passo } from '../src/lib/trace';

describe('validarRastro', () => {
  it('aceita o rastro do InfoCAIJ MCP', () => {
    expect(validarRastro(infocaijMcp.rastro!)).toEqual([]);
  });

  it('o rastro do MCP segue pergunta → chamada → saída → avaliação', () => {
    expect(infocaijMcp.rastro!.map((p) => p.tipo)).toEqual(['pergunta', 'chamada', 'saida', 'avaliacao']);
  });

  it('recusa saída antes de chamada, falta de pergunta e avaliação fora do fim', () => {
    const fora: Passo[] = [
      { tipo: 'saida', texto: 'x' },
      { tipo: 'avaliacao', itens: [] },
      { tipo: 'chamada', ferramenta: 'f', args: {} },
    ];
    const erros = validarRastro(fora);
    expect(erros).toContain('o rastro deve começar com a pergunta');
    expect(erros).toContain('o rastro deve terminar com a avaliação');
    expect(erros).toContain('saída antes de qualquer chamada de ferramenta');
  });
});

describe('agendaPassos', () => {
  it('passos aparecem em sequência e a chamada demora mais que os outros', () => {
    const tipos = ['pergunta', 'chamada', 'saida', 'avaliacao'];
    const t = agendaPassos(tipos, 280, 560);
    expect(t).toEqual([0, 280, 840, 1120]);
    for (let i = 1; i < t.length; i++) expect(t[i]).toBeGreaterThan(t[i - 1]);
  });
});

describe('linhasCorrecao', () => {
  it('mantém a ordem ✗ falhou → causa → ajuste → ✓ passou em todas as correções', () => {
    for (const c of infocaijMcp.correcoes!)
      expect(linhasCorrecao(c).map((l) => l.etapa)).toEqual(['falhou', 'causa', 'ajuste', 'passou']);
  });

  it('as duas correções do MCP carregam os números do briefing', () => {
    const [modelo, dados] = infocaijMcp.correcoes!;
    expect(modelo.rotulo).toBe('Teste com o modelo');
    expect(dados.falhou).toContain('0,8 h');
    expect(dados.falhou).toContain('p90 de 77,8 h');
  });
});

describe('jsonTokens', () => {
  it('reconstitui o JSON e marca chaves e strings', () => {
    const toks = jsonTokens({ de: 'Venda registrada', ate: 'Pronta' });
    expect(toks.map((t) => t.t).join('').replace(/\s/g, '')).toBe(
      JSON.stringify({ de: 'Venda registrada', ate: 'Pronta' }).replace(/\s/g, ''),
    );
    expect(toks.filter((t) => t.k === 'chave').map((t) => t.t)).toEqual(['"de"', '"ate"']);
    expect(toks.filter((t) => t.k === 'str').map((t) => t.t)).toEqual(['"Venda registrada"', '"Pronta"']);
  });

  it('reconhece números e literais', () => {
    const toks = jsonTokens({ n: 3, x: null, ok: true });
    expect(toks.find((t) => t.k === 'num')?.t).toBe('3');
    expect(toks.filter((t) => t.k === 'lit').map((t) => t.t)).toEqual(['null', 'true']);
  });
});

describe('outros projetos', () => {
  it('todos os rastros são válidos e etapas descritivas vêm marcadas', async () => {
    const { outrosProjetos } = await import('../src/data/projetos');
    expect(outrosProjetos.map((p) => p.slug)).toEqual(['cardapio-em-1-minuto', 'infocaij', 'infomachine', 'coreufabc']);
    for (const p of outrosProjetos) {
      expect(validarRastro(p.rastro), p.slug).toEqual([]);
      for (const passo of p.rastro) if (passo.tipo === 'chamada') expect(passo.etapa, p.slug).toBe(true);
    }
  });

  it('o Cardápio aparece como em andamento e o preliminar mostra os dois erros silenciosos', async () => {
    const { cardapio, avaliacaoCardapio } = await import('../src/data/projetos');
    expect(cardapio.status).toBe('em andamento');
    expect(avaliacaoCardapio.preliminar.erros).toEqual([
      { certo: '54,50', lido: '54,90' },
      { certo: '39,50', lido: '39,90' },
    ]);
    expect(avaliacaoCardapio.armadilhas.reduce((a, b) => a + b.n, 0)).toBe(172);
  });
});

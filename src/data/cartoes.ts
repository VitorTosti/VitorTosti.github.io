// Os cinco projetos como cartões: resumo, fatos, cor e o tipo de mídia. Usado na página inicial
// (cartões empilhados) e nas páginas de detalhe de cada projeto.
import { avaliacaoCardapio as av, cardapio, coreufabc, infocaij, infocaijMcp as mcp, infomachine } from './projetos';

const [erroA, erroB] = av.preliminar.erros;

export type Cartao = {
  slug: string;
  nome: string;
  status: string;
  resumo: string;
  fatos: string[];
  link: { rotulo: string; href: string | null };
  midia: 'video' | 'cardapio' | 'numeros' | 'carrossel' | 'rastro';
  /** Cor do projeto: número, status e detalhes do cartão. */
  cor: 'ambar' | 'coral' | 'agua' | 'violeta' | 'verde';
};

export const cartoes: Cartao[] = [
  {
    slug: mcp.slug,
    nome: mcp.nome,
    status: 'destaque',
    resumo:
      'Servidor MCP somente leitura que liga o sistema interno InfoCAIJ ao Claude: 8 ferramentas, 3 prompts prontos e 20 testes, sem dependências.',
    fatos: [
      '✗ gargalo escolhido pela mediana (0,8 h) → ✓ pela soma de horas, com teste da cauda longa',
      '✗ descrição ambígua de ferramenta → ✓ passou a dizer qual data define o período',
      'Achou que 93 de 135 máquinas pulavam a etapa "Pronta"',
    ],
    link: { rotulo: 'GitHub', href: mcp.link.href },
    midia: 'video',
    cor: 'ambar',
  },
  {
    slug: cardapio.slug,
    nome: cardapio.nome,
    status: 'em andamento',
    resumo:
      'A foto do cardápio de papel vira cardápio digital: itens, preços por tamanho, adicionais e observações em JSON validado por esquema, com o que precisa de revisão humana marcado.',
    fatos: [
      'Métrica: erro de preço silencioso (errado e sem pedir revisão)',
      `Preliminar, ${av.preliminar.cardapios} cardápios: 100% prontos em fotos limpas e comuns`,
      `✗ Foto difícil: R$ ${erroA.certo} → ${erroA.lido} e R$ ${erroB.certo} → ${erroB.lido}, sem pedir revisão`,
    ],
    link: { rotulo: 'TODO: repositório', href: null },
    midia: 'cardapio',
    cor: 'coral',
  },
  {
    slug: infocaij.slug,
    nome: infocaij.nome,
    status: 'em produção',
    resumo: 'Plataforma interna que tirou do WhatsApp a venda e a preparação de notebooks da CAIJ Informática.',
    fatos: ['Fila de 8 etapas com checklist técnico de 10 itens', 'Integração com o ERP, nota fiscal e garantia com QR Code', 'Código privado'],
    link: { rotulo: 'Estudo de caso', href: infocaij.link.href },
    midia: 'numeros',
    cor: 'agua',
  },
  {
    slug: infomachine.slug,
    nome: infomachine.nome,
    status: 'em uso na bancada',
    resumo: 'App portátil de triagem de notebooks: lê o hardware, roda 5 testes e imprime a etiqueta térmica.',
    fatos: ['Cerca de 100 máquinas por semana', 'Roda de pendrive, em Windows e macOS', 'Atualizações verificadas por SHA-256'],
    link: { rotulo: 'GitHub', href: infomachine.link.href },
    midia: 'carrossel',
    cor: 'violeta',
  },
  {
    slug: coreufabc.slug,
    nome: coreufabc.nome,
    status: 'protótipo',
    resumo: 'Lê o histórico do SIGAA, calcula CR, CA e CPk e simula a grade do próximo quadrimestre.',
    fatos: ['66 testes', 'CI no GitHub Actions'],
    link: { rotulo: 'GitHub', href: coreufabc.link.href },
    midia: 'rastro',
    cor: 'verde',
  },
];

/** Números do InfoCAIJ em produção. */
export const numeros = [
  { v: '~300', r: 'máquinas e pedidos por mês' },
  { v: '15', r: 'usuários em 4 perfis' },
  { v: '13 mil+', r: 'eventos de histórico' },
  { v: '95', r: 'arquivos de teste' },
];

// Conjunto de avaliação do Cardápio em 1 minuto, em grade.
export const avaliacao = [
  { v: String(av.cardapios), r: 'cardápios com gabarito', t: 'Cardápios sintéticos com gabarito exato' },
  { v: String(av.itens), r: 'itens', t: 'Itens no gabarito' },
  { v: String(av.estilos.length), r: 'estilos visuais', t: av.estilos.join(', ') },
  { v: String(av.armadilhas.reduce((a, b) => a + b.n, 0)), r: 'armadilhas', t: av.armadilhas.map((a) => `${a.n} ${a.rotulo}`).join(', ') },
];

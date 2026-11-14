// Os seis projetos como cartões: resumo, fatos, cor e o tipo de mídia. Usado na página inicial
// (cartões empilhados) e nas páginas de detalhe de cada projeto.
import { avaliacaoCardapio as av, cardapio, coreufabc, kairo, infocaij, infocaijMcp as mcp, infomachine } from './projetos';

export type Cartao = {
  slug: string;
  nome: string;
  status: string;
  resumo: string;
  problema: string;
  solucao: string;
  resultado: string;
  link: { rotulo: string; href: string | null };
  midia: 'video' | 'cardapio' | 'carrossel' | 'celulares' | 'telas';
  /** Cor do projeto: número, status e detalhes do cartão. */
  cor: 'ambar' | 'coral' | 'agua' | 'violeta' | 'verde' | 'azul';
};

export const cartoes: Cartao[] = [
  {
    slug: mcp.slug,
    nome: mcp.nome,
    status: 'destaque',
    resumo:
      'Servidor MCP somente leitura que liga o sistema interno InfoCAIJ ao Claude: 8 ferramentas com saída estruturada, horas úteis com feriados, tendência semanal, SQLite ou PostgreSQL e 65 testes, sem dependências obrigatórias.',
    problema: 'A gestão precisava abrir telas e planilhas para descobrir onde a fila de máquinas travava.',
    solucao: 'Conectei o InfoCAIJ ao Claude com um servidor MCP somente leitura.',
    resultado: 'Encontrou 93 de 135 máquinas que pulavam a etapa “Pronta”.',
    link: { rotulo: 'GitHub', href: mcp.link.href },
    midia: 'video',
    cor: 'ambar',
  },
  {
    slug: kairo.slug,
    nome: kairo.nome,
    status: 'time de agentes',
    resumo:
      'Agenda online para negócios de beleza construída por um time de agentes de IA: um orquestrador e cinco especialistas, com contratos, um branch por agente e testes antes de cada merge.',
    problema: 'Pequenos negócios precisam organizar a agenda sem parar o atendimento.',
    solucao: 'Construí uma agenda online com um time coordenado de agentes de IA.',
    resultado: 'Motor de agenda com 191 testes e 99,3% de cobertura; piloto em uma barbearia.',
    link: { rotulo: 'GitHub', href: kairo.link.href },
    midia: 'telas',
    cor: 'azul',
  },
  {
    slug: cardapio.slug,
    nome: cardapio.nome,
    status: 'em andamento',
    resumo:
      'A foto do cardápio de papel vira cardápio digital: itens, preços por tamanho, adicionais e observações em JSON validado por esquema, com o que precisa de revisão humana marcado.',
    problema: 'Cadastrar um cardápio de papel no delivery exige digitar cada item e preço.',
    solucao: 'Extraio os dados da foto em JSON validado e marco o que precisa de revisão.',
    resultado: `Teste preliminar com ${av.preliminar.cardapios} cardápios; fotos difíceis ainda geram erros de preço não sinalizados.`,
    link: { rotulo: 'TODO: repositório', href: null },
    midia: 'cardapio',
    cor: 'coral',
  },
  {
    slug: infocaij.slug,
    nome: infocaij.nome,
    status: 'em produção',
    resumo: 'Plataforma interna que tirou do WhatsApp a venda e a preparação de notebooks da CAIJ Informática.',
    problema: 'Vendas e preparação de notebooks eram coordenadas pelo WhatsApp.',
    solucao: 'Criei uma plataforma interna com fila técnica, ERP e garantia por QR Code.',
    resultado: '~300 máquinas e pedidos por mês, com 15 usuários em 4 perfis.',
    link: { rotulo: 'Estudo de caso', href: infocaij.link.href },
    midia: 'carrossel',
    cor: 'agua',
  },
  {
    slug: infomachine.slug,
    nome: infomachine.nome,
    status: 'em uso na bancada',
    resumo: 'App portátil de triagem de notebooks: lê o hardware, roda 5 testes e imprime a etiqueta térmica.',
    problema: 'Cada notebook que chega à bancada precisa de triagem consistente.',
    solucao: 'Criei um app portátil que lê o hardware, roda testes e imprime a etiqueta.',
    resultado: 'Em uso na triagem de cerca de 100 máquinas por semana.',
    link: { rotulo: 'GitHub', href: infomachine.link.href },
    midia: 'carrossel',
    cor: 'violeta',
  },
  {
    slug: coreufabc.slug,
    nome: coreufabc.nome,
    status: 'protótipo',
    resumo: 'Lê o histórico do SIGAA, calcula CR, CA e CPk e simula a grade do próximo quadrimestre.',
    problema: 'Planejar o próximo quadrimestre a partir do histórico acadêmico é trabalhoso.',
    solucao: 'O protótipo lê o histórico, calcula índices e simula a próxima grade.',
    resultado: '66 testes e integração contínua no GitHub Actions.',
    link: { rotulo: 'GitHub', href: coreufabc.link.href },
    midia: 'celulares',
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

// Conteúdo dos projetos. Só fatos do briefing; o que falta fica como TODO.
import type { Correcao, Passo } from '../lib/trace';

export type Projeto = {
  slug: string;
  nome: string;
  status?: string;
  problema: string;
  solucao: string;
  rastro?: Passo[];
  correcoes?: Correcao[];
  seguranca?: string[];
  link: { rotulo: string; href: string | null };
};

export const infocaijMcp: Projeto = {
  slug: 'infocaij-mcp',
  nome: 'InfoCAIJ MCP',
  problema:
    'A gestão da CAIJ Informática precisava abrir telas e montar planilhas para saber onde a fila de máquinas travava.',
  solucao:
    'Um servidor MCP (Model Context Protocol) somente leitura que conecta o sistema interno InfoCAIJ ao Claude. São 8 ferramentas, 3 prompts prontos (relatório semanal, diagnóstico de gargalo e status para vendedor) e 20 testes. Zero dependências: o protocolo é implementado direto em TypeScript, e o banco abre em modo somente leitura.',
  rastro: [
    {
      tipo: 'pergunta',
      texto:
        'Qual o tempo médio desde que a venda é registrada até os técnicos colocarem a máquina como pronta?',
    },
    {
      tipo: 'chamada',
      ferramenta: 'tempo_entre_etapas',
      args: { de: 'Venda registrada', ate: 'Pronta' },
      // TODO: tempo real da chamada em ms (medir no servidor e preencher `ms`).
    },
    {
      tipo: 'saida',
      texto: 'Mediana de 48 minutos entre a venda registrada e a máquina pronta.',
      aviso: '93 de 135 máquinas pularam a etapa "Pronta".',
    },
    { tipo: 'avaliacao', itens: ['20/20 testes', 'somente leitura', '0 dados de clientes'] },
  ],
  correcoes: [
    {
      rotulo: 'Teste com o modelo',
      falhou:
        'O Claude respondeu certo, mas disse não saber se as devoluções eram contadas pela data da venda ou da devolução.',
      causa: 'A descrição da ferramenta era ambígua.',
      ajuste: 'A descrição passou a dizer qual data define o período.',
      passou: 'A dúvida sumiu.',
    },
    {
      rotulo: 'Teste com dados reais',
      falhou:
        'O gargalo apontado tinha mediana de 0,8 h. O problema real era outra etapa, "Aguardando retirada": a maioria passava rápido, mas 10% esperavam mais de 3 dias (p90 de 77,8 h).',
      causa: 'O gargalo era escolhido pela mediana.',
      ajuste: 'O gargalo passou a ser escolhido pela soma de horas, com um teste que reproduz a cauda longa.',
      // TODO: confirmar o resultado depois do ajuste (qual etapa passou a ser apontada).
      passou: 'O teste da cauda longa entrou na suíte e passa.',
    },
  ],
  seguranca: [
    'Nenhuma ferramenta devolve dados de clientes. Um teste planta dados falsos e prova que nada vaza.',
    'Não existe ferramenta de SQL livre.',
  ],
  link: { rotulo: 'github.com/VitorTosti/infocaij-mcp', href: 'https://github.com/VitorTosti/infocaij-mcp' },
};

/** As 8 ferramentas do servidor. */
export const ferramentasMcp = [
  'resumo_fila',
  'itens_parados',
  'tempo_por_etapa',
  'tempo_entre_etapas',
  'produtividade',
  'vendas',
  'estoque',
  'consultar_maquina',
];

export type ProjetoCurto = {
  slug: string;
  nome: string;
  status?: string;
  resumo: string;
  rastro: Passo[];
  stack?: string;
  nota?: string;
  link: { rotulo: string; href: string | null };
};

export const cardapio: ProjetoCurto = {
  slug: 'cardapio-em-1-minuto',
  nome: 'Cardápio em 1 minuto',
  status: 'em andamento',
  resumo:
    'A foto do cardápio vira um cardápio digital estruturado: itens, preços por tamanho, adicionais e observações, com marcação do que precisa de revisão humana. Modelo: Gemini, com saída em JSON validada por esquema.',
  rastro: [
    {
      tipo: 'pergunta',
      rotulo: 'problema',
      texto:
        'Cadastrar um restaurante pequeno no delivery exige digitar o cardápio inteiro, e muitos só têm o cardápio de papel.',
    },
    {
      tipo: 'chamada',
      etapa: true,
      ferramenta: 'extrair_cardapio',
      args: { foto: 'cardapio.jpg', modelo: 'Gemini', saida: 'JSON validado por esquema' },
    },
    {
      tipo: 'saida',
      texto: 'Itens, preços por tamanho, adicionais e observações, com o que precisa de revisão humana marcado.',
    },
    {
      tipo: 'avaliacao',
      itens: ['60 cardápios sintéticos com gabarito', '991 itens', '172 armadilhas', 'métrica: erro de preço silencioso'],
    },
  ],
  // TODO: repositório cardapio-em-1-minuto
  link: { rotulo: 'TODO: repositório cardapio-em-1-minuto', href: null },
};

/** Conjunto de avaliação do Cardápio em 1 minuto. */
export const avaliacaoCardapio = {
  cardapios: 60,
  itens: 991,
  estilos: ['moderno', 'clássico', 'lousa', 'tabela', 'folheto', 'máquina de escrever'],
  niveisFoto: 3,
  armadilhas: [
    { n: 53, rotulo: 'promoções riscadas' },
    { n: 33, rotulo: 'itens sem preço' },
    { n: 44, rotulo: 'taxas que parecem item' },
    { n: 42, rotulo: 'blocos de adicionais' },
  ],
  preliminar: {
    cardapios: 5,
    limpas: '100% prontos para publicar em fotos limpas e comuns',
    // Na foto difícil: preço lido errado e não marcado para revisão.
    erros: [
      { certo: '54,50', lido: '54,90' },
      { certo: '39,50', lido: '39,90' },
    ],
  },
  // TODO: atualizar com a rodada completa de 60 cardápios.
};

export const infocaij: ProjetoCurto = {
  slug: 'infocaij',
  nome: 'InfoCAIJ',
  status: 'em produção',
  resumo:
    'Plataforma web interna da CAIJ Informática que tirou a venda e a preparação de notebooks do WhatsApp. Cada máquina vendida ganha identidade própria e passa por uma fila de 8 etapas, com checklist técnico de 10 itens, integração com o ERP, nota fiscal, embalagem, garantia com QR Code e histórico por número de série.',
  rastro: [
    {
      tipo: 'pergunta',
      rotulo: 'problema',
      texto: 'A venda e a preparação de notebooks da CAIJ Informática aconteciam pelo WhatsApp.',
    },
    { tipo: 'chamada', etapa: true, ferramenta: 'fila', args: { etapas: 8, checklist_tecnico: 10 } },
    { tipo: 'chamada', etapa: true, ferramenta: 'integrar_erp', args: { erp: 'AlterTag/VHSYS', nota_fiscal: true } },
    { tipo: 'chamada', etapa: true, ferramenta: 'garantia', args: { qr_code: true, historico: 'por número de série' } },
    {
      tipo: 'saida',
      texto:
        '~300 máquinas e pedidos por mês, 15 usuários, mais de 13 mil eventos de histórico e 8.207 movimentações de estoque conciliadas com o ERP.',
    },
    {
      tipo: 'avaliacao',
      itens: ['95 arquivos de teste', 'migração para VPS com plano de retorno', 'desenvolvido com Claude Code'],
    },
  ],
  stack: 'React · TypeScript · Node.js · Express · Zod · SQLite/PostgreSQL · Vitest',
  nota: 'Código privado.',
  link: { rotulo: 'estudo de caso', href: 'https://github.com/VitorTosti/infocaij-case-study' },
};

export const infomachine: ProjetoCurto = {
  slug: 'infomachine',
  nome: 'InfoMachine',
  status: 'em uso na bancada',
  resumo:
    'App portátil de bancada para a triagem de notebooks. Roda de pendrive, em Windows e macOS, e recebe atualizações verificadas por SHA-256. Desenvolvido com Codex.',
  rastro: [
    { tipo: 'pergunta', rotulo: 'problema', texto: 'Triar cada notebook que chega à bancada.' },
    { tipo: 'chamada', etapa: true, ferramenta: 'ler_hardware', args: {} },
    { tipo: 'chamada', etapa: true, ferramenta: 'consultar_historico', args: { chave: 'número de série' } },
    {
      tipo: 'chamada',
      etapa: true,
      ferramenta: 'rodar_testes',
      args: { testes: ['câmera', 'teclado', 'som', 'tela', 'touchpad'] },
    },
    { tipo: 'chamada', etapa: true, ferramenta: 'imprimir_etiqueta', args: { impressora: 'térmica', via: 'serviço no NAS' } },
    { tipo: 'saida', texto: 'Cerca de 100 máquinas por semana.' },
    { tipo: 'avaliacao', itens: ['5 testes de hardware', 'atualizações verificadas por SHA-256', 'Windows e macOS'] },
  ],
  link: { rotulo: 'github.com/VitorTosti/infomachine', href: 'https://github.com/VitorTosti/infomachine' },
};

export const coreufabc: ProjetoCurto = {
  slug: 'coreufabc',
  nome: 'CoreUFABC',
  status: 'protótipo',
  resumo:
    'Protótipo de planejamento acadêmico: lê o histórico do SIGAA, calcula CR, CA e CPk e simula a grade do próximo quadrimestre.',
  rastro: [
    { tipo: 'pergunta', rotulo: 'problema', texto: 'Planejar o próximo quadrimestre na UFABC a partir do histórico.' },
    { tipo: 'chamada', etapa: true, ferramenta: 'ler_historico', args: { fonte: 'SIGAA' } },
    { tipo: 'chamada', etapa: true, ferramenta: 'calcular', args: { indices: ['CR', 'CA', 'CPk'] } },
    { tipo: 'chamada', etapa: true, ferramenta: 'simular_grade', args: { periodo: 'próximo quadrimestre' } },
    { tipo: 'saida', texto: 'CR, CA e CPk calculados e a grade do próximo quadrimestre simulada.' },
    { tipo: 'avaliacao', itens: ['66 testes', 'CI no GitHub Actions'] },
  ],
  link: { rotulo: 'github.com/VitorTosti/CoreUFABC', href: 'https://github.com/VitorTosti/CoreUFABC' },
};

export const encaixe: ProjetoCurto = {
  slug: 'encaixe',
  nome: 'Encaixe',
  status: 'em construção',
  resumo:
    'Agenda online para pequenos negócios de beleza, construída por um time de agentes de IA: um orquestrador e cinco especialistas, cada um dono de uma área do código, com contratos de tipos, um branch por agente, testes antes de cada merge e, desde a Fase 2b, revisão independente. O cliente agenda pelo celular sem criar senha; o profissional vê o dia, encaixa a lista de espera nos horários vagos e avisa quem já deveria ter voltado. Piloto: uma barbearia de São Bernardo do Campo. Próxima etapa: um copiloto com agentes nomeados em que o modelo propõe e a pessoa confirma.',
  rastro: [
    {
      tipo: 'pergunta',
      rotulo: 'problema',
      texto:
        'O dono de uma barbearia atende o dia todo com as mãos ocupadas e precisa ver o dia, fechar a agenda e preencher os horários vagos sem parar o atendimento.',
    },
    { tipo: 'chamada', etapa: true, ferramenta: 'orquestrador', args: { plano: 'por fase', contratos: 'packages/domain/src/contracts' } },
    {
      tipo: 'chamada',
      etapa: true,
      ferramenta: 'especialistas',
      args: { agentes: ['motor-agenda', 'banco-dados', 'design-system', 'ui-cliente', 'ui-painel'], branch: 'agent/<nome>' },
    },
    { tipo: 'chamada', etapa: true, ferramenta: 'portao_antes_do_merge', args: { comandos: ['typecheck', 'lint', 'test'], revisao: 'independente' } },
    {
      tipo: 'saida',
      texto: 'Página pública, painel do profissional e motor de agenda integrados; cada negócio isolado no banco por RLS.',
      aviso: 'O copiloto com agentes (Fase 3) está especificado e ainda não foi construído.',
    },
    {
      tipo: 'avaliacao',
      itens: ['471 testes unitários', '191 testes no motor, 99,3% de cobertura', '146 asserções pgTAP', '9 arquivos E2E com axe'],
    },
  ],
  stack: 'Next.js 16 · TypeScript · Tailwind 4 · Supabase (Postgres, Auth, RLS) · Vitest · Playwright · pnpm',
  link: { rotulo: 'github.com/VitorTosti/sistema-agenda', href: 'https://github.com/VitorTosti/sistema-agenda' },
};

/** O time de agentes do Encaixe: quem é dono de quê e o que entregou. */
export const timeEncaixe = [
  { agente: 'Orquestrador', dono: 'contratos, integração, merges', entregou: 'Plano de cada fase, contratos de tipos, integração na main e o registro de andamento.' },
  { agente: 'motor-agenda', dono: 'packages/domain', entregou: 'Horários livres, reserva, remarcação, buracos, fechamento de período, lista de espera e indicadores. 191 testes, 99,3% de cobertura.' },
  { agente: 'banco-dados', dono: 'supabase/', entregou: '22 tabelas com RLS, restrição contra dois atendimentos no mesmo horário, RPCs atômicas e 146 asserções pgTAP.' },
  { agente: 'design-system', dono: 'packages/ui', entregou: 'Tema por negócio, o seletor de horários "Pente" e testes de contraste e acessibilidade.' },
  { agente: 'ui-cliente', dono: 'página pública', entregou: 'Agendamento em etapas, login por código SMS, remarcar e cancelar, lista de espera e links de uso único.' },
  { agente: 'ui-painel', dono: 'painel', entregou: 'Hoje, Agenda, lista de espera com "Encaixar", Retornos, Clientes, Serviços, Equipe, Configurações e Relatórios.' },
];

/** As regras que fizeram o time funcionar. */
export const regrasEncaixe = [
  'Contratos primeiro: os tipos compartilhados só mudam pelo orquestrador, que avisa os outros agentes.',
  'Um branch por agente (agent/<nome>), num worktree isolado; o orquestrador faz o merge.',
  'Subagente não chama subagente: toda coordenação passa pela sessão principal.',
  'Verifique, não acredite: nenhuma entrega entra sem typecheck, lint e testes verdes.',
  'Quem escreve não revisa: desde a Fase 2b, uma sessão que não escreveu o código revisa cada branch antes do merge. As revisões pegaram escritas que deveriam ser atômicas e um limite de 200 clientes que fazia o aviso por WhatsApp falhar.',
];

/** O copiloto (próxima etapa): agentes nomeados, todos com escrita em duas fases. */
export const copilotoEncaixe = {
  agentes: [
    { nome: 'Recepção', cuida: 'agenda, remarcações e bloqueios' },
    { nome: 'Retorno', cuida: 'clientes na hora de voltar' },
    { nome: 'Caixa', cuida: 'faturamento e números' },
    { nome: 'Vaga', cuida: 'horários vagos e lista de espera' },
  ],
  regras: [
    'Leitura executa direto; toda escrita é proposta, mostrada como prévia e só executa no Confirmar.',
    'O negócio e o usuário vêm sempre do servidor, nunca do modelo.',
    'Nomes e observações de clientes chegam ao modelo como dados não confiáveis.',
  ],
  metas: [
    { v: '95%', r: 'de ferramenta correta' },
    { v: '100%', r: 'das escritas por proposta' },
    { v: '0', r: 'execuções sem confirmação' },
  ],
};

export const outrosProjetos = [cardapio, infocaij, infomachine, coreufabc, encaixe];

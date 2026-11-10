// "Em números" de cada projeto: só números já documentados nos dados dos projetos e na trajetória.
// `decisao` é a escolha de projeto que mais pesou; `numeros` é o que ela produziu.
export type Impacto = { decisao: string; numeros: { v: string; r: string }[] };

export const impacto: Record<string, Impacto> = {
  'infocaij-mcp': {
    decisao: 'Servidor somente leitura, sem SQL livre e sem dependências: a IA consulta a fila sem poder alterar nada.',
    numeros: [
      { v: '93 de 135', r: 'máquinas pulavam a etapa "Pronta"' },
      { v: '77,8 h', r: 'p90 na etapa que a mediana escondia' },
      { v: '8', r: 'ferramentas e 3 prompts prontos' },
      { v: '65', r: 'testes, incluindo o de vazamento' },
    ],
  },
  kairo: {
    decisao: 'Contratos de tipos primeiro, um branch por agente e revisão feita por quem não escreveu o código.',
    numeros: [
      { v: '471', r: 'testes unitários' },
      { v: '99,3%', r: 'de cobertura no motor de agenda' },
      { v: '22', r: 'tabelas isoladas por negócio com RLS' },
      { v: '146', r: 'asserções pgTAP' },
    ],
  },
  'cardapio-em-1-minuto': {
    decisao: 'Medir o erro de preço silencioso, e não a acurácia geral: o pior erro é o que passa sem pedir revisão.',
    numeros: [
      { v: '60', r: 'cardápios sintéticos com gabarito' },
      { v: '991', r: 'itens avaliados' },
      { v: '172', r: 'armadilhas plantadas' },
    ],
  },
  infocaij: {
    decisao: 'Cada máquina vendida ganha identidade própria e passa por uma fila de 8 etapas com checklist técnico.',
    numeros: [
      { v: '~300', r: 'máquinas e pedidos por mês' },
      { v: '15', r: 'usuários em 4 perfis' },
      { v: '13 mil+', r: 'eventos de histórico' },
      { v: '8.207', r: 'movimentações de estoque conciliadas com o ERP' },
    ],
  },
  infomachine: {
    decisao: 'App portátil que roda de pendrive e se atualiza com verificação SHA-256, para funcionar em qualquer máquina da bancada.',
    numeros: [
      { v: '~100', r: 'máquinas por semana' },
      { v: '5', r: 'testes de hardware' },
      { v: '2', r: 'sistemas: Windows e macOS' },
    ],
  },
  coreufabc: {
    decisao: 'Partir do histórico real do SIGAA para calcular os índices, em vez de pedir que a pessoa digite as notas.',
    numeros: [
      { v: '66', r: 'testes' },
      { v: '3', r: 'índices: CR, CA e CPk' },
    ],
  },
};

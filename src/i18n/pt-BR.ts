// Todo o texto do site fica aqui. Uma versão em inglês (en.ts) deve seguir a mesma forma.

export const ptBR = {
  lang: 'pt-BR',
  meta: {
    title: 'Vitor Tosti · AI Builder',
    description:
      'Vitor Tosti, estudante de Ciência da Computação na UFABC. Servidor MCP somente leitura, avaliação com dados reais e ferramentas internas em produção.',
  },
  nome: 'Vitor Tosti',
  nav: [
    { href: '#sobre', rotulo: 'Sobre' },
    { href: '#projetos', rotulo: 'Projetos' },
    { href: '#trajetoria', rotulo: 'Trajetória' },
    { href: '#contato', rotulo: 'Contato' },
  ],
  intro: 'Estudante de Ciência da Computação na UFABC. Construo com IA sistemas que já estão em uso.',
  falar: 'Fale comigo',
  titulos: { sobre: 'Sobre', projetos: 'Projetos', trajetoria: 'Trajetória', contato: 'Vamos conversar' },
  // Cada frase gerada token a token tem um id, usado para achar as alternativas em alternativas.json.
  frases: {
    abertura: 'Estudante de Ciência da Computação na UFABC.',
    numeros: '~300 máquinas por mês passam pelo que eu construí',
    projetos: 'Cinco execuções, com os erros à mostra',
    latente: 'Projetos parecidos ficam perto',
    metodo: 'Do problema ao teste que impede o erro de voltar',
    trajetoria: 'Da usinagem CNC na Mercedes a IA em produção',
    contato: 'Me mande um problema real',
  },
  // A pergunta que abre cada seção, como num rastro: o título gerado é a resposta.
  perguntas: {
    numeros: 'o que já está em uso?',
    projetos: 'mostre o trabalho',
    latente: 'o que esses projetos têm em comum?',
    metodo: 'como você trabalha?',
    trajetoria: 'de onde você veio?',
    contato: 'e agora?',
  },
  lente: {
    titulo: 'próximo token',
    lista: 'Top-5 desta posição',
    temperatura: 'temperatura',
    ajuda: 'A temperatura decide o quanto o modelo arrisca. Em 1, as chances reais. Abaixo de 1, ele fica previsível e quase sempre escolhe a primeira opção; acima, as opções ficam parecidas e ele pode escolher outra palavra. Arraste e veja as barras mudarem.',
    denovo: 'gerar de novo',
    quase: (topo: string, escolhido: string) => `Quase escrevi “${topo}”. Escolhi “${escolhido}”.`,
    provavel: (t: string) => `“${t}” era o mais provável nesta posição.`,
    metaGerando: (i: number, n: number) => `decodificando · ${i}/${n} tokens`,
    metaFim: (n: number) => `${n} tokens · top-5 por posição`,
  },
  // As ferramentas que aparecem nos projetos e na trajetória; nada fora delas.
  // Agrupadas por IA, programação e ferramentas. Cada item tem prova num projeto ou na trajetória.
  skills: [
    {
      rot: 'IA',
      itens: ['Agentes com MCP (tool use)', 'Avaliação de LLMs com dados reais', 'Saída estruturada com esquema'],
    },
    { rot: 'programação', itens: ['Python', 'TypeScript', 'SQL · PostgreSQL', 'Node.js e Express', 'React', 'Streamlit'] },
    { rot: 'ferramentas', itens: ['Git e GitHub', 'Testes e CI (Vitest, GitHub Actions)', 'Deploy em VPS', 'Automação com n8n'] },
  ],
  skillsRotulo: 'Skills',
  sobre:
    'Trabalho como técnico de tecnologia na CAIJ Informática, onde desenvolvo o InfoCAIJ, a plataforma que tirou a venda e a preparação de notebooks do WhatsApp e hoje acompanha cerca de 300 máquinas por mês. Em cima dela construí um servidor MCP que deixa o Claude responder onde a fila trava, e testei com o modelo e com os dados reais até achar onde ele errava. Antes, automatizei testes de iluminação automotiva na Genesis e programei máquinas CNC na Mercedes-Benz.',
  avanco: {
    proximo: 'mostre o trabalho',
    em: (s: number) => `em ${s} s`,
    irAgora: 'ir agora',
    ficar: 'ficar aqui',
    verProjetos: 'ver projetos',
    rotulo: 'Avanço automático para os projetos',
  },
  subtitulo: 'AI Builder · São Bernardo do Campo, SP',
  links: {
    github: 'https://github.com/VitorTosti',
    linkedin: 'https://www.linkedin.com/in/vitortosti/',
    email: 'vitor.tosti@hotmail.com' as string | null,
  },
  numeros: [
    { valor: '~300', rotulo: 'máquinas e pedidos por mês no InfoCAIJ' },
    { valor: '15', rotulo: 'usuários em 4 perfis' },
    { valor: '60–90 → 5 min', rotulo: 'de instalação de sistema por máquina, com automação via FOG' },
    { valor: '93 de 135', rotulo: 'máquinas pulavam uma etapa, achado pelo MCP nos dados reais' },
  ],
  trajetoria: [
    {
      onde: 'CAIJ Informática',
      papel: 'Técnico de Tecnologia',
      quando: 'fev/2026 → hoje',
      texto: 'InfoCAIJ, InfoMachine e automação de instalação com FOG.',
    },
    {
      onde: 'Genesis Development & Equipment',
      papel: 'Estágio em engenharia',
      quando: 'set/2025 → fev/2026',
      texto:
        'Plataforma de testes automatizados para iluminação automotiva (Python, Raspberry Pi e PostgreSQL), dashboard em Streamlit usado pela gerência e acesso remoto às estações (Tailscale e VNC) para suporte da planta de São Paulo à da Bahia.',
    },
    {
      onde: 'Mercedes-Benz do Brasil',
      papel: 'Aprendiz',
      quando: 'jan/2025 → ago/2025',
      texto: 'Programação e operação de máquinas CNC.',
    },
  ],
  formacao: [
    { onde: 'UFABC', texto: 'Bacharelado em Ciência e Tecnologia', quando: 'previsão jul/2028' },
    { onde: 'UFABC', texto: 'Ciência da Computação', quando: 'previsão jul/2029' },
    { onde: 'ETEC Lauro Gomes', texto: 'Técnico em Eletrônica', quando: '2024' },
  ],
  idiomas: 'Inglês B2 (Cambridge PET, Grade A)',
  contato: 'Procuro estágio construindo com IA. Se quiser ver um desses rastros rodando de verdade, me chame.',
  painel: {
    dica: 'Passe o mouse ou toque numa palavra para ver o que o modelo quase escreveu.',
    foraDoTop: 'fora do top-5',
    escolhido: 'escolhido',
    fechar: 'Fechar',
    descricao: (token: string, alts: string) => `Alternativas para "${token}": ${alts}`,
  },
  rodape: {
    ilustrativas:
      'Probabilidades ilustrativas: escritas à mão enquanto as reais não são geradas. O script scripts/gerar-alternativas.ts as substitui por logprobs do Gemini.',
    reais: (modelo: string, data: string) =>
      `Probabilidades reais: top-5 logprobs de ${modelo}, geradas em ${data}. Cada posição foi medida dando ao modelo o começo da frase e lendo os 5 próximos tokens mais prováveis.`,
  },
};

export type Strings = typeof ptBR;

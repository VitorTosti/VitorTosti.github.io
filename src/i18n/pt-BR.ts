// Todo o texto do site fica aqui. Uma versão em inglês (en.ts) deve seguir a mesma forma.

export const ptBR = {
  lang: 'pt-BR',
  meta: {
    title: 'Vitor Tosti · AI Builder',
    description:
      'Vitor Tosti coloca IA em sistemas que as pessoas usam e mede onde ela erra. Servidor MCP somente leitura, avaliação com dados reais e ferramentas internas em produção.',
  },
  nome: 'Vitor Tosti',
  // Cada frase gerada token a token tem um id, usado para achar as alternativas em alternativas.json.
  frases: {
    abertura: 'Coloco IA em sistemas que as pessoas usam, e meço onde ela erra.',
    numeros: 'Em uso, com números',
    projetos: 'Projetos, contados como execuções',
    latente: 'Projetos parecidos ficam perto',
    metodo: 'Como trabalho',
    trajetoria: 'Trajetória',
    contato: 'Fale comigo',
  },
  subtitulo: 'AI Builder · Ciência da Computação @ UFABC · São Bernardo do Campo, SP',
  links: {
    github: 'https://github.com/VitorTosti',
    linkedin: 'https://www.linkedin.com/in/vitortosti/',
    // TODO: e-mail de contato
    email: null as string | null,
  },
  numeros: [
    { valor: '~300', rotulo: 'máquinas e pedidos por mês no InfoCAIJ' },
    { valor: '15', rotulo: 'usuários em 4 perfis' },
    { valor: '60–90 → 5 min', rotulo: 'de instalação de sistema por máquina, com automação via FOG' },
    { valor: '93 de 135', rotulo: 'máquinas pulavam uma etapa, achado pelo MCP nos dados reais' },
  ],
  metodo: [
    'Levanto o problema com quem vai usar.',
    'Construo com IA (Claude Code, Codex, n8n), revisando cada mudança.',
    'Avalio com o modelo e com dados reais, medindo o erro que custa caro.',
    'Corrijo com um teste que impede o erro de voltar.',
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
    dica: 'Passe o mouse ou toque numa palavra do título para ver o que o modelo quase escreveu.',
    foraDoTop: 'fora do top-5',
    escolhido: 'escolhido',
    fechar: 'Fechar',
    descricao: (token: string, alts: string) => `Alternativas para "${token}": ${alts}`,
  },
  tema: { claro: 'Usar tema claro', escuro: 'Usar tema escuro' },
  rodape: {
    ilustrativas:
      'Probabilidades ilustrativas: escritas à mão enquanto as reais não são geradas. O script scripts/gerar-alternativas.ts as substitui por logprobs do Gemini.',
    reais: (modelo: string, data: string) =>
      `Probabilidades reais: top-5 logprobs de ${modelo}, geradas em ${data}. Cada posição foi medida dando ao modelo o começo da frase e lendo os 5 próximos tokens mais prováveis.`,
  },
};

export type Strings = typeof ptBR;

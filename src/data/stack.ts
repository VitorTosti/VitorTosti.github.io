// Tecnologias por projeto. Só o que está documentado em cada projeto.
export type LinhaStack = { slug: string; nome: string; itens: string[]; itensEn: string[] };

export const stackPorProjeto: LinhaStack[] = [
  { slug: 'infocaij-mcp', nome: 'InfoCAIJ MCP', itens: ['MCP (tool use)', 'TypeScript', 'Banco somente leitura', 'Sem dependências', '20 testes'], itensEn: ['MCP (tool use)', 'TypeScript', 'Read-only database', 'Zero dependencies', '20 tests'] },
  { slug: 'kairo', nome: 'Kairo', itens: ['Next.js 16', 'TypeScript', 'Tailwind 4', 'Supabase (Postgres, Auth, RLS)', 'Vitest', 'Playwright', 'pgTAP', 'Time de agentes de IA'], itensEn: ['Next.js 16', 'TypeScript', 'Tailwind 4', 'Supabase (Postgres, Auth, RLS)', 'Vitest', 'Playwright', 'pgTAP', 'AI agent team'] },
  { slug: 'cardapio-em-1-minuto', nome: 'Cardápio em 1 minuto', itens: ['Gemini', 'Saída em JSON com esquema', 'Avaliação com gabarito'], itensEn: ['Gemini', 'Schema-validated JSON output', 'Ground-truth evaluation'] },
  { slug: 'infocaij', nome: 'InfoCAIJ', itens: ['React', 'TypeScript', 'Node.js', 'Express', 'Zod', 'SQLite / PostgreSQL', 'Vitest', 'Deploy em VPS'], itensEn: ['React', 'TypeScript', 'Node.js', 'Express', 'Zod', 'SQLite / PostgreSQL', 'Vitest', 'VPS deploy'] },
  { slug: 'infomachine', nome: 'InfoMachine', itens: ['App portátil (pendrive)', 'Windows e macOS', 'Atualização com SHA-256', 'Impressão térmica'], itensEn: ['Portable app (USB drive)', 'Windows and macOS', 'SHA-256 verified updates', 'Thermal printing'] },
  { slug: 'coreufabc', nome: 'CoreUFABC', itens: ['Leitura do histórico do SIGAA', 'CR, CA e CPk', '66 testes', 'GitHub Actions'], itensEn: ['SIGAA transcript parsing', 'CR, CA and CPk', '66 tests', 'GitHub Actions'] },
];

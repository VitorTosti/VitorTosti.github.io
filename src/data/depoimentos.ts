// Depoimentos reais, com autorização de quem os deu. Enquanto a lista estiver vazia, a seção não aparece.
// Exemplo de item: { texto: '...', autor: 'Nome', papel: 'Cargo, empresa' }
export type Depoimento = { texto: string; autor: string; papel: string; textoEn?: string; papelEn?: string };
export const depoimentos: Depoimento[] = [];

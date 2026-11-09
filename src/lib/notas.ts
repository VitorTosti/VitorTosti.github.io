// Notas: textos curtos em Markdown (src/content/notas/*.md) com título, data e resumo no frontmatter.
export type Nota = { slug: string; titulo: string; data: string; resumo: string; Content: any };

const arquivos = import.meta.glob('../content/notas/*.md', { eager: true }) as Record<string, any>;

export const notas: Nota[] = Object.entries(arquivos)
  .map(([caminho, m]) => ({
    slug: caminho.split('/').pop()!.replace(/\.md$/, ''),
    titulo: m.frontmatter.titulo as string,
    data: String(m.frontmatter.data).slice(0, 10),
    resumo: m.frontmatter.resumo as string,
    Content: m.Content,
  }))
  .sort((a, b) => b.data.localeCompare(a.data));

export const formatarData = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

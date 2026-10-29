# vitortosti.github.io

Site-portfólio de Vitor Tosti. Astro + TypeScript, estático, sem framework de UI no cliente.

A identidade visual vem de como modelos de linguagem funcionam:

- **Geração token a token**: os títulos se escrevem como um modelo gerando. Passar o mouse (ou tocar, ou focar com o teclado) num token mostra o top-5 de alternativas daquela posição.
- **Rastro de agente**: cada projeto é contado como uma execução: pergunta, chamadas de ferramenta, saída e avaliação, com os erros e correções como `✗ falhou → causa → ajuste → ✓ passou`.
- **Espaço latente**: os projetos como pontos num mapa 2D, com vizinhos pela distância entre vetores de habilidades.

## Rodar localmente

```bash
npm install
npm run dev        # http://localhost:4321
npm test           # testes unitários (Vitest)
npm run build      # gera dist/
```

## Probabilidades reais do Gemini

O site lê `src/data/alternativas.json` no build e nunca chama API em produção. O arquivo que está no repositório é **ilustrativo** (escrito à mão), e o rodapé do site diz isso.

Para gerar as probabilidades reais:

```bash
GEMINI_API_KEY=... npm run alternativas
# opcional: GEMINI_MODEL=gemini-2.5-flash (padrão)
```

O script `scripts/gerar-alternativas.ts` pede ao modelo, para cada posição de cada título, o próximo token com `responseLogprobs: true` e `logprobs: 5`, dando o começo da frase como contexto. Quando o token que está no título não aparece no top-5, ele fica marcado como "fora do top-5", sem número inventado. O modelo e a data vão para o JSON e aparecem no rodapé.

Se você mudar um título em `src/i18n/pt-BR.ts`, rode o script de novo. Enquanto isso, o título mudado é dividido pelo tokenizador de reserva e aparece sem alternativas.

## Verificação

```bash
npm run build && npm run preview   # em outro terminal
npm run shots        # capturas Playwright: 375/1440 px, claro/escuro, com/sem movimento → shots/
npm run a11y         # axe-core nos dois temas + teste de teclado do painel
npm run lighthouse   # Lighthouse mobile, 3 rodadas → shots/lighthouse.html
npm run og           # regenera public/og.png
```

Na primeira vez, instale o navegador do Playwright: `npx playwright install chromium`.

## Deploy no GitHub Pages

O workflow `.github/workflows/deploy.yml` roda os testes, faz o build e publica a cada push na `main`.

1. Crie o repositório **`VitorTosti/VitorTosti.github.io`** no GitHub (público).
2. Nesta pasta:
   ```bash
   git init
   git add .
   git commit -m "Site-portfólio"
   git branch -M main
   git remote add origin https://github.com/VitorTosti/VitorTosti.github.io.git
   git push -u origin main
   ```
3. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Acompanhe em **Actions**. O site sai em https://vitortosti.github.io.

Para publicar em outro repositório (por exemplo `VitorTosti/portfolio`), o site fica em `/portfolio/`: ajuste `site` e adicione `base: '/portfolio'` em `astro.config.mjs`.

Na Vercel: importe o repositório, framework "Astro", sem outras configurações. Troque `site` em `astro.config.mjs` pela URL final.

## Estrutura

```
src/
  pages/index.astro, 404.astro
  layouts/Base.astro            <head>, SEO/OG, fontes, tema
  components/                   GeneratedText, ProbPanel, AgentTrace, FixTrace, MenuToJson, LatentMap, ...
  data/alternativas.json        top-5 por token (ilustrativo até rodar o script)
  data/projetos.ts              conteúdo dos projetos e rastros
  i18n/pt-BR.ts                 todo o texto; en.ts deve seguir a mesma forma
  lib/tokenize.ts, trace.ts, latent.ts   lógica testada em tests/
  assets/                       imagens, vídeo e gabarito do cardápio
scripts/gerar-alternativas.ts, gerar-og.mjs
```

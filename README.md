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

## Entre vias: simulador de mobilidade

A demonstração independente fica em `/projetos/entrevias/`. O modelo executa localmente no navegador, sem API, mapas externos ou dados de trânsito reais. Há cenários de demanda, participação de ônibus, semáforos, faixa exclusiva e uma obra com desvio das novas rotas. O mapa permite ampliar e inspecionar interseções por clique ou teclado.

O motor está em `src/lib/city-engine.ts`; renderização e controles, em `src/lib/city-client.ts`. A maquete 3D em `src/lib/city-3d.ts` usa Three.js, com geometrias compartilhadas, prédios, parques, veículos, sinalização e obras. O modelo e os indicadores são os mesmos nas duas visualizações. A câmera permite girar e aproximar; em celular, dois dedos controlam a maquete e um dedo preserva a rolagem. Sem suporte a WebGL, ou se o contexto for perdido, o mapa 2D assume automaticamente.

Uma semente fixa torna as execuções reproduzíveis com a mesma sequência de ajustes e passos de tempo. O tempo médio contabiliza apenas viagens concluídas e não inclui espera anterior à entrada na rede. Os indicadores são educativos, não previsões de trânsito.

`npm test` cobre caminhos, desvio, conservação de passageiros e reprodução do modelo. Com o servidor local rodando, `node tests/city-browser.mjs` verifica controles, movimento reduzido, cenários por URL, teclado, acessibilidade e ausência de erros em desktop e celular. `--capture-preview` atualiza a imagem da demonstração usada no portfólio.

`node tests/city-camera.mjs` valida o gesto de dois dedos para zoom, a rolagem com um dedo e o retorno ao mapa 2D com preservação de estado após perda do contexto WebGL.

`node tests/city-detail.mjs` verifica vistas próximas, zoom até 8×, foco e tela cheia em desktop e celular. Os semáforos 3D têm vermelho, amarelo e verde sincronizados com a função `trafficSignal` compartilhada com o mapa e o motor. O entorno (rio, pontes, árvores e passeios) é cenográfico e não acrescenta demanda à rede.

### Introdução e desafio

A seção principal do portfólio contém uma prévia 3D real em `CityPreview.astro` e `city-preview.ts`. O módulo gráfico carrega somente quando a seção entra na tela. Veículos usam o mesmo motor do app; a prévia tem giro, zoom e pausa, suspende fora da tela e respeita movimento reduzido. Sem WebGL, permanece a imagem com acesso ao app completo.

No primeiro acesso da sessão, uma introdução de seis etapas explica o propósito do laboratório e demonstra mudanças reais de demanda, ônibus, semáforos e obras. Há avanço automático, pausa, voltar, pular, Escape e repetição pelo botão “Ver introdução guiada”. Com movimento reduzido, a pessoa avança manualmente e os cenários aparecem sem animação espacial. Sair restaura o cenário anterior. Links com parâmetros abrem diretamente no cenário compartilhado.

O desafio fixa a demanda em 95%. Referência e tentativas começam sem veículos, com a mesma semente, e executam 2.400 passos de 0,05 segundo (dois minutos simulados). A meta é aumentar as chegadas em pelo menos 20%, reduzir os veículos parados e não aumentar a fila de entrada. O tempo médio das viagens concluídas também é exibido, sem ocultar possíveis pioras. Alterar os ajustes após um teste sinaliza que a tabela ainda se refere ao resultado anterior. O cálculo ocorre em blocos que cedem tempo à interface e pode ser cancelado.

O fluxo fica em `src/lib/city-experience.ts`; cálculo e avaliação, em `src/lib/city-experiment.ts`. `node tests/city-experience.mjs` verifica introdução, preferências de movimento, restauração, comparação reproduzível e cancelamento.

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

## Recursos adicionais

- **Inglês**: `/en/` (texto em `src/i18n/en.ts`). O alternador PT/EN fica no canto superior direito.
- **Tema claro/escuro**: botão no canto superior direito; a escolha fica em `localStorage`. A abertura 3D continua escura.
- **SEO**: sitemap (`@astrojs/sitemap`), hreflang, JSON-LD `Person` e imagem OG por projeto (`npm run og` gera `public/og/<slug>.png`).
- **Notas**: Markdown em `src/content/notas/*.md` (frontmatter `titulo`, `data`, `resumo`).
- **Depoimentos**: preencha `src/data/depoimentos.ts`; vazio, a seção some.
- **Variáveis opcionais** (ver `.env.example`; no GitHub, em Settings › Variables › Actions):
  `PUBLIC_PLAUSIBLE_DOMAIN` liga estatísticas sem cookies; `PUBLIC_FORM_ENDPOINT` envia o formulário de contato
  (sem ele, o formulário abre o app de e-mail).
- **CI**: `.github/workflows/qualidade.yml` roda testes, `astro check`, build, axe e Lighthouse em PRs e branches.

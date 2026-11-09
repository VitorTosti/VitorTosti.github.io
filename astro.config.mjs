import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages: repositório VitorTosti/VitorTosti.github.io, servido na raiz.
export default defineConfig({
  site: 'https://vitortosti.github.io',
  build: { inlineStylesheets: 'auto' },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'pt-BR', locales: { 'pt-BR': 'pt-BR', en: 'en' } },
      // A rota antiga do Kairo é só um redirecionamento.
      filter: (page) => !page.includes('/projetos/encaixe'),
    }),
  ],
  // O projeto Encaixe passou a se chamar Kairo: o endereço antigo continua funcionando.
  redirects: { '/projetos/encaixe': '/projetos/kairo/' },
});

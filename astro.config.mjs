import { defineConfig } from 'astro/config';

// GitHub Pages: repositório VitorTosti/VitorTosti.github.io, servido na raiz.
export default defineConfig({
  site: 'https://vitortosti.github.io',
  build: { inlineStylesheets: 'auto' },
  // O projeto Encaixe passou a se chamar Kairo: o endereço antigo continua funcionando.
  redirects: { '/projetos/encaixe': '/projetos/kairo/' },
});

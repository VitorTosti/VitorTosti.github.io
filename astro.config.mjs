import { defineConfig } from 'astro/config';

// GitHub Pages: repositório VitorTosti/VitorTosti.github.io, servido na raiz.
export default defineConfig({
  site: 'https://vitortosti.github.io',
  build: { inlineStylesheets: 'auto' },
});

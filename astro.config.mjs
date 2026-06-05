import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import remarkDirective from 'remark-directive';
import remarkCallouts from './src/plugins/remarkCallouts.mjs';

export default defineConfig({
  site: 'https://QwentyToRanTiny73.github.io',
  base: '/Testing-LO/',
  output: 'static',
  integrations: [
    tailwind(),
    react(),
  ],
  markdown: {
    remarkPlugins: [remarkDirective, remarkCallouts],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});

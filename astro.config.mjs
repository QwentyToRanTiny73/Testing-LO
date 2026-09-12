import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import remarkDirective from 'remark-directive';
import remarkCallouts from './src/plugins/remarkCallouts.mjs';

export default defineConfig({
  site: 'https://QwentyToRanTiny73.github.io',
  base: '/Testing-LO/',
  output: 'static',
  // Предзагрузка по наведению для всех внутренних ссылок: курс из 66 уроков
  // читают последовательно, переход между уроками — основной сценарий.
  // Именно 'hover', а не 'viewport': на странице модуля со списком уроков
  // стратегия по видимости потянула бы сразу все уроки списка.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
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

import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import remarkDirective from 'remark-directive';
import remarkCallouts from './src/plugins/remarkCallouts.mjs';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Личная часть симулятора (свой сезон и справочник препаратов) живёт в
// src/data/private/ вне git и попадает в сборку только с SIM_PRIVATE=1.
// Публичная сборка подставляет пустую заглушку, поэтому в dist и в поисковый
// индекс не уходит ни строчки личных данных.
const privateEntry = fileURLToPath(new URL('./src/data/private/index.ts', import.meta.url));
const usePrivate = process.env.SIM_PRIVATE === '1';
if (usePrivate && !existsSync(privateEntry)) {
  throw new Error('SIM_PRIVATE=1, но нет src/data/private/index.ts — положите туда личную часть симулятора (см. README).');
}
const simPrivate = usePrivate ? privateEntry : fileURLToPath(new URL('./src/data/private-stub.ts', import.meta.url));

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
  vite: {
    resolve: { alias: { 'sim-private': simPrivate } },
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

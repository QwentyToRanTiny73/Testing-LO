import { defineCollection, z } from 'astro:content';

const lessons = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    module: z.string(),
    order: z.number(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    difficulty: z.enum(['базовый', 'средний', 'продвинутый']),
    durationMin: z.number(),
    status: z.enum(['готово', 'черновик']).default('черновик'),
    sources: z.array(z.string()).optional(),
    updated: z.date(),
  }),
});

const glossary = defineCollection({
  type: 'content',
  schema: z.object({
    term: z.string(),
    definition: z.string(),
    related: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { lessons, glossary };

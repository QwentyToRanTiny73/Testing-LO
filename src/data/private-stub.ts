// Пустая личная часть симулятора для публичной сборки. Настоящая лежит в
// src/data/private/ (вне git) и подставляется вместо этого файла при SIM_PRIVATE=1.

import type { SimScenario } from './simulation';
import type { Reagent } from './reagents';

export const privateScenarios: SimScenario[] = [];
export const privateReagents: Reagent[] = [];
export const privateReagentsNote: string | undefined = undefined;

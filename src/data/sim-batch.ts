// Паспорт партии для симулятора: реальные показатели, которые меняются от решений,
// и правила, по которым из этих чисел вычисляются последствия.
//
// Метрики симулятора (аромат, свежесть, структура, стабильность, чистота) остаются
// педагогической оценкой решений. Паспорт добавляет химию: что стало с партией,
// и какие риски из этого следуют — независимо от того, насколько удачно звучал выбор.
//
// Все числа — ориентиры учебной модели, а не прогноз для конкретного сусла.

import { molecularSO2, potentialAlcohol, freeSO2ForMolecular } from '../lib/enology';
import type { SimEffect } from './simulation';

export interface Batch {
  /** Сахар, г/л: в сусле — исходный, после брожения — остаточный */
  sugar: number;
  /** Спирт, % об. */
  alcohol: number;
  pH: number;
  /** Титруемая кислотность, г/л в пересчёте на винную */
  ta: number;
  /** Яблочная кислота, г/л */
  malic: number;
  /** Усвояемый азот, мг/л */
  yan: number;
  freeSO2: number;
  totalSO2: number;
  /** Температура партии, °C */
  temp: number;
  /** Летучая кислотность, г/л */
  va: number;
  volumeL: number;
  phase: 'must' | 'wine';
  /** Спиртоустойчивость выбранного штамма, % об. Без указания — 15 */
  tolerance?: number;
}

/** Постоянные свойства партии сценария. */
export interface BatchProfile {
  /** Подпись в паспорте: какую партию отслеживаем */
  label: string;
  color: 'white' | 'red' | 'rose' | 'orange';
  /** Сухое вино: остаточный сахар выше 2–4 г/л — дефект */
  dry: boolean;
  /** г/л сахара на 1 % об. спирта */
  gPerPct: number;
  /** Предел общего SO₂ для категории, мг/л */
  so2Limit: number;
  /** Целевой молекулярный SO₂ для стиля, мг/л: белые и розе ~0,8, красные ~0,5 */
  molTarget: number;
}

export type BatchOp =
  | { add: Partial<Omit<Batch, 'phase'>> }
  | { set: Partial<Omit<Batch, 'phase'>> }
  /** Внести SO₂, мг/л. bound — доля, которая сразу свяжется (молодое вино и сусло связывают больше). */
  | { so2: number; bound?: number }
  /** Сбраживание: сахар → спирт. residual — остаток при идеальных условиях. */
  | { ferment: { residual?: number } }
  /** Яблочно-молочное брожение */
  | { mlf: 'complete' | 'partial' }
  /** Потери свободного SO₂ на кислород (переливка, розлив) */
  | { oxygen: number }
  /** Довести свободный SO₂ до целевого молекулярного, мг/л */
  | { molecular: number }
  /** Разбавление водой: доля от объёма */
  | { dilute: number };

export interface Vintage {
  id: 'hot' | 'normal' | 'cool';
  label: string;
  icon: string;
  description: string;
  mod: Partial<Omit<Batch, 'phase'>>;
}

/** Год урожая сдвигает исходную партию: жара — больше сахара, выше pH, меньше кислоты и азота. */
export const VINTAGES: Vintage[] = [
  {
    id: 'hot',
    label: 'Жаркий год',
    icon: '☀️',
    description: 'Сахар набран быстро, кислотность и азот просели, pH выше обычного. Защита SO₂ при таком pH слабее.',
    mod: { sugar: 18, pH: 0.12, ta: -1.1, malic: -0.6, yan: -25 },
  },
  {
    id: 'normal',
    label: 'Типичный год',
    icon: '⛅',
    description: 'Показатели около многолетней нормы для сорта.',
    mod: {},
  },
  {
    id: 'cool',
    label: 'Прохладный год',
    icon: '🌧️',
    description: 'Сахара меньше, кислотность и яблочная выше, pH ниже. Свежесть есть, зрелость — под вопросом.',
    mod: { sugar: -16, pH: -0.1, ta: 1.2, malic: 0.7, yan: 15 },
  },
];

export function pickVintage(choice: 'random' | Vintage['id'] = 'random'): Vintage {
  if (choice !== 'random') return VINTAGES.find((v) => v.id === choice)!;
  return VINTAGES[Math.floor(Math.random() * VINTAGES.length)];
}

const round = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;

/** Порог потенциального спирта, выше которого штамм без специальной устойчивости сдаётся */
const DEFAULT_TOLERANCE = 15;

function normalize(b: Batch): Batch {
  return {
    ...b,
    sugar: Math.max(0, round(b.sugar, 1)),
    alcohol: Math.max(0, round(b.alcohol, 1)),
    pH: round(Math.min(Math.max(b.pH, 2.8), 4.2), 2),
    ta: Math.max(2, round(b.ta, 1)),
    malic: Math.max(0, round(b.malic, 1)),
    yan: Math.max(0, Math.round(b.yan)),
    freeSO2: Math.max(0, Math.round(b.freeSO2)),
    totalSO2: Math.max(0, Math.round(b.totalSO2)),
    temp: round(b.temp, 0),
    va: Math.max(0, round(b.va, 2)),
    volumeL: Math.round(b.volumeL),
  };
}

export function applyVintage(base: Batch, v: Vintage): Batch {
  return normalize(addTo(base, v.mod));
}

function addTo(b: Batch, d: Partial<Omit<Batch, 'phase'>>): Batch {
  const out = { ...b };
  for (const [k, v] of Object.entries(d)) (out as Record<string, unknown>)[k] = ((b as unknown as Record<string, number>)[k] ?? 0) + (v as number);
  return out;
}

/**
 * Остаток сахара после брожения. Учебная модель того, что видно в погребе:
 * холодный финиш, дефицит азота и избыток потенциального спирта останавливают дрожжи.
 */
export function residualAfterFermentation(b: Batch, profile: BatchProfile, ideal = 1.5): { residual: number; reasons: string[] } {
  let residual = ideal;
  const reasons: string[] = [];
  if (b.temp < 11) {
    residual += 12;
    reasons.push(`финиш при ${b.temp} °C`);
  } else if (b.temp < 13) {
    residual += 6;
    reasons.push(`финиш при ${b.temp} °C`);
  }
  if (b.temp > 32) {
    residual += 8;
    reasons.push(`перегрев до ${b.temp} °C`);
  }
  if (b.yan < 100) {
    residual += 6;
    reasons.push(`YAN ${b.yan} мг/л`);
  } else if (b.yan < 130) {
    residual += 2;
  }
  const potential = potentialAlcohol(b.sugar, profile.gPerPct);
  const tolerance = b.tolerance ?? DEFAULT_TOLERANCE;
  if (potential > tolerance) {
    residual += (potential - tolerance) * profile.gPerPct * 0.35;
    reasons.push(`потенциальный спирт ${potential.toFixed(1).replace('.', ',')} % об.`);
  }
  return { residual: Math.min(residual, b.sugar), reasons };
}

export function applyOps(b0: Batch, ops: BatchOp[] | undefined, profile: BatchProfile): Batch {
  if (!ops?.length) return b0;
  let b = { ...b0 };
  for (const op of ops) {
    if ('add' in op) b = addTo(b, op.add);
    else if ('set' in op) b = { ...b, ...op.set };
    else if ('so2' in op) {
      const bound = op.bound ?? (b.phase === 'must' ? 0.35 : 0.15);
      b.freeSO2 += op.so2 * (1 - bound);
      b.totalSO2 += op.so2;
    } else if ('ferment' in op) {
      if (b.phase === 'wine') continue;
      const { residual } = residualAfterFermentation(b, profile, op.ferment.residual);
      b.alcohol += potentialAlcohol(b.sugar - residual, profile.gPerPct);
      b.sugar = residual;
      b.yan = Math.max(0, b.yan - 150);
      // Обычные дрожжи сами дают 0,2–0,4 г/л летучей кислотности
      b.va += 0.25;
      // Брожение связывает SO₂ ацетальдегидом: свободного почти не остаётся
      b.freeSO2 *= 0.3;
      b.phase = 'wine';
    } else if ('mlf' in op) {
      const share = op.mlf === 'complete' ? 0.95 : 0.5;
      const converted = b.malic * share;
      b.malic -= converted;
      b.ta -= converted * 0.56; // яблочная (двухосновная) → молочная (одноосновная)
      b.pH += converted * 0.05;
      b.va += 0.04;
    } else if ('oxygen' in op) {
      b.freeSO2 -= op.oxygen;
    } else if ('molecular' in op) {
      const need = freeSO2ForMolecular(op.molecular, b.pH) - b.freeSO2;
      if (need > 0) {
        const bound = b.phase === 'must' ? 0.35 : 0.15;
        b.freeSO2 += need;
        b.totalSO2 += need / (1 - bound);
      }
    } else if ('dilute' in op) {
      // Вода разбавляет всё растворённое; буфер почти не меняется, pH растёт чуть-чуть
      const k = 1 / (1 + op.dilute);
      b.sugar *= k;
      b.ta *= k;
      b.malic *= k;
      b.yan *= k;
      b.freeSO2 *= k;
      b.totalSO2 *= k;
      b.pH += op.dilute * 0.2;
      b.volumeL *= 1 + op.dilute;
    }
  }
  return normalize(b);
}

export function molecular(b: Batch): number {
  return molecularSO2(b.freeSO2, b.pH);
}

// ─────────────────────────────── Правила последствий ───────────────────────────────

export interface RuleHit {
  id: string;
  fault: string;
  effects: SimEffect[];
  explain: string;
}

interface Rule {
  id: string;
  /** Ключевое слово: если дефект с ним уже назначил сам выбор, правило не дублирует штраф */
  keyword: string;
  check: (prev: Batch, next: Batch, profile: BatchProfile, audit: boolean) => RuleHit | null;
}

const fmt = (x: number, d = 1) => x.toFixed(d).replace('.', ',');

const RULES: Rule[] = [
  {
    id: 'h2s',
    keyword: 'Сероводород',
    check: (p, n) =>
      p.phase === 'must' && n.phase === 'wine' && p.yan < 140
        ? {
            id: 'h2s',
            fault: `Сероводород: брожение на дефиците азота (YAN ${p.yan} мг/л)`,
            effects: [{ metric: 'purity', delta: -6 }, { metric: 'aroma', delta: -2 }],
            explain: `Паспорт: к брожению в сусле было ${p.yan} мг/л усвояемого азота при ориентире от ~140. Дрожжи без азота восстанавливают серу до сероводорода.`,
          }
        : null,
  },
  {
    id: 'stuck',
    keyword: 'брожени',
    check: (p, n, profile) => {
      if (!(p.phase === 'must' && n.phase === 'wine' && profile.dry && n.sugar > 4)) return null;
      const { reasons } = residualAfterFermentation(p, profile);
      return {
        id: 'stuck',
        fault: `Брожение не добродило: остаток ${fmt(n.sugar)} г/л`,
        effects: [{ metric: 'stability', delta: -7 }, { metric: 'purity', delta: -2 }],
        explain: `Паспорт: после брожения осталось ${fmt(n.sugar)} г/л сахара${reasons.length ? ' — причина: ' + reasons.join(', ') : ''}. В сухом вине это субстрат для повторного брожения и Brettanomyces.`,
      };
    },
  },
  {
    id: 'va',
    keyword: 'етучая',
    check: (p, n) =>
      n.va > 0.8 && p.va <= 0.8
        ? {
            id: 'va',
            fault: `Летучая кислотность ${fmt(n.va, 2)} г/л`,
            effects: [{ metric: 'purity', delta: -8 }],
            explain: `Паспорт: летучая кислотность ${fmt(n.va, 2)} г/л — выше порога ~0,8, при котором уксусный тон становится заметен. Обратного хода нет.`,
          }
        : null,
  },
  {
    id: 'high-ph',
    keyword: 'pH',
    check: (p, n) =>
      n.pH >= 3.75 && p.pH < 3.75
        ? {
            id: 'high-ph',
            fault: `Высокий pH ${fmt(n.pH, 2)}: слабая защита SO₂`,
            effects: [{ metric: 'stability', delta: -4 }],
            explain: `Паспорт: pH ${fmt(n.pH, 2)}. При таком pH молекулярной формы всего ~${fmt(molecular({ ...n, freeSO2: 100 }), 1)} % от свободного SO₂ — для той же защиты нужно заметно больше сернистой.`,
          }
        : null,
  },
  {
    id: 'weak-so2',
    keyword: 'защита SO',
    check: (_p, n, _profile, audit) => {
      const mol = molecular(n);
      return audit && n.phase === 'wine' && mol < 0.4 && n.pH >= 3.45
        ? {
            id: 'weak-so2',
            fault: `Слабая защита SO₂: молекулярный ${fmt(mol, 2)} мг/л при pH ${fmt(n.pH, 2)}`,
            effects: [{ metric: 'purity', delta: -5 }, { metric: 'stability', delta: -4 }],
            explain: `Паспорт: свободный SO₂ ${n.freeSO2} мг/л при pH ${fmt(n.pH, 2)} даёт лишь ${fmt(mol, 2)} мг/л молекулярного — ниже рабочих 0,5–0,8. Brettanomyces и бактерии получают окно.`,
          }
        : null;
    },
  },
  {
    id: 'so2-limit',
    keyword: 'предел',
    check: (p, n, profile) =>
      n.totalSO2 > profile.so2Limit && p.totalSO2 <= profile.so2Limit
        ? {
            id: 'so2-limit',
            fault: `Общий SO₂ ${n.totalSO2} мг/л — выше предела ${profile.so2Limit}`,
            effects: [{ metric: 'stability', delta: -2 }, { metric: 'aroma', delta: -3 }],
            explain: `Паспорт: общий SO₂ ${n.totalSO2} мг/л превышает предел ${profile.so2Limit} мг/л для категории. Вино нельзя выпустить без купажа, а избыток сернистой глушит аромат.`,
          }
        : null,
  },
  {
    id: 'residual-bottle',
    keyword: 'сахар',
    check: (_p, n, profile, audit) =>
      audit && profile.dry && n.phase === 'wine' && n.sugar > 2 && n.sugar <= 4
        ? {
            id: 'residual-bottle',
            fault: `Остаточный сахар ${fmt(n.sugar)} г/л в сухом вине`,
            effects: [{ metric: 'stability', delta: -4 }],
            explain: `Паспорт: ${fmt(n.sugar)} г/л сахара — формально в пределах «сухого», но без стерильной фильтрации это риск дображивания в бутылке.`,
          }
        : null,
  },
];

/** Правила, сработавшие на переходе prev → next. Каждое — не чаще раза за прохождение. */
export function evaluateRules(
  prev: Batch,
  next: Batch,
  profile: BatchProfile,
  audit: boolean,
  fired: Set<string>,
  faults: string[]
): RuleHit[] {
  const hits: RuleHit[] = [];
  for (const r of RULES) {
    if (fired.has(r.id)) continue;
    if (faults.some((f) => f.includes(r.keyword))) continue;
    const hit = r.check(prev, next, profile, audit);
    if (hit) hits.push(hit);
  }
  return hits;
}

/** Подставляет показатели партии в текст: {pH}, {sugar}, {free}, {mol} и т. д. */
export function fillBatch(text: string, b: Batch, gPerPct?: number): string {
  const map: Record<string, string> = {
    sugar: String(Math.round(b.sugar)),
    potential: fmt(potentialAlcohol(b.sugar, gPerPct)),
    alcohol: fmt(b.alcohol),
    pH: fmt(b.pH, 2),
    ta: fmt(b.ta),
    malic: fmt(b.malic),
    yan: String(b.yan),
    free: String(b.freeSO2),
    total: String(b.totalSO2),
    mol: fmt(molecular(b), 2),
    temp: String(b.temp),
    va: fmt(b.va, 2),
    volume: String(b.volumeL),
  };
  return text.replace(/\{(\w+)\}/g, (m, k) => map[k] ?? m);
}

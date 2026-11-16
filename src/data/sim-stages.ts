// Общие кирпичики сценариев симулятора: этапы, где дозу считают и вводят числом.
// Вынесены из simulation.ts, чтобы ими пользовались и публичные, и личные сценарии.

import type { Batch } from './sim-batch';
import type { SimDose, SimStage } from './simulation';
import {
  freeSO2ForMolecular,
  molecularFraction,
  so2ReagentGrams,
  so2FromReagent,
  tartaricGrams,
  KMS_SO2_FRACTION,
  EU_ACID_LIMIT,
} from '../lib/enology';

// ───────────────────────────── Этапы с расчётом дозы SO₂ ─────────────────────────────

export const comma = (x: number, d = 1) => x.toFixed(d).replace('.', ',');

/** Как реальная навеска соотносится с расчётной — вердикт для разбора. */
export function doseVerdict(
  expected: number,
  entered: number,
  under: string,
  over: string,
  absTol = 0,
  ok = 'В пределах точности. После внесения перемерьте свободный SO₂ через 3–5 суток: часть сразу свяжется.'
): string {
  const target = Math.max(expected, 0);
  const diff = entered - target;
  if (Math.abs(diff) <= Math.max(0.1 * target, absTol)) {
    return target <= absTol && entered <= absTol
      ? 'Верно: добавка меньше погрешности анализа — вносить нечего, перемерить через неделю.'
      : ok;
  }
  return diff < 0 ? under : over;
}

/**
 * Этап «довести свободный SO₂ до целевого молекулярного перед розливом».
 * Формула та же, что в калькуляторе SO₂: свободный = молекулярный × (1 + 10^(pH − pKa)),
 * навеска = объём × нехватка / 1000 / 0,576.
 */
function so2MolecularDose(target: number, extraFormula = ''): SimDose {
  const needFree = (b: Batch) => freeSO2ForMolecular(target, b.pH);
  const expected = (b: Batch) => so2ReagentGrams(b.volumeL, needFree(b) - b.freeSO2);
  return {
    prompt: 'Навеска метабисульфита калия на {volume} л (0 — если вносить не нужно)',
    unit: 'г',
    formula:
      `Нужный свободный SO₂ = ${comma(target)} × (1 + 10^(pH − 1,81)).\n` +
      'Нехватка = нужный − текущий свободный.\n' +
      `Навеска (г) = объём (л) × нехватка (мг/л) / 1000 / ${comma(KMS_SO2_FRACTION, 3)}.` +
      extraFormula,
    expected,
    // Выдержанное вино связывает мало: почти всё внесённое остаётся свободным
    apply: (b, grams) => [{ so2: so2FromReagent(grams, b.volumeL), bound: 0.05 }],
    absTolerance: (b) => so2ReagentGrams(b.volumeL, 2),
    explain: (b, exp, grams) => {
      const need = needFree(b);
      const deficit = need - b.freeSO2;
      const share = comma(molecularFraction(b.pH) * 100);
      const calc =
        deficit > 0
          ? `При pH ${comma(b.pH, 2)} молекулярная форма — ${share} % свободного, значит для ${comma(target)} мг/л молекулярного нужно ${comma(need)} мг/л свободного. Сейчас ${b.freeSO2} — не хватает ${comma(deficit)} мг/л. Навеска: ${b.volumeL} × ${comma(deficit)} / 1000 / 0,576 ≈ ${comma(exp)} г.`
          : `При pH ${comma(b.pH, 2)} для ${comma(target)} мг/л молекулярного нужно ${comma(need)} мг/л свободного, а в партии уже ${b.freeSO2}.`;
      const added = so2FromReagent(grams, b.volumeL);
      const fact = grams > 0 ? ` Внесено ${comma(grams)} г — это +${Math.round(added)} мг/л SO₂.` : '';
      return (
        `${calc}${fact}\n` +
        doseVerdict(
          exp,
          grams,
          'Недобор: молекулярного SO₂ не хватит до цели, и вино уйдёт в бутылку с ослабленной защитой от бактерий и Brettanomyces.',
          'Перебор: лишняя сернистая приглушает аромат и приближает общий SO₂ к пределу категории.',
          so2ReagentGrams(b.volumeL, 2)
        )
      );
    },
    effects: {
      exact: [{ metric: 'stability', delta: 4 }, { metric: 'purity', delta: 2 }],
      close: [{ metric: 'stability', delta: 1 }],
      off: [{ metric: 'stability', delta: -4 }, { metric: 'aroma', delta: -1 }],
    },
    faults: { off: 'Доза SO₂ не по расчёту' },
    reagents: ['metabisulfite'],
  };
}

/** Этап сульфитации перед розливом (отгрузкой) с целевым молекулярным SO₂. */
export function so2BottlingStage(opts: {
  phase: string;
  target: number;
  /** Вводная: почему именно такая цель для этого стиля */
  note: string;
  title?: string;
  extraFormula?: string;
}): SimStage {
  return {
    id: 'so2-dose',
    phase: opts.phase,
    icon: '🧪',
    title: opts.title ?? 'Сульфитация перед розливом: расчёт навески',
    context: `${opts.note} Лаборатория дала свежие цифры: свободный SO₂ {free} мг/л, общий {total} мг/л, pH {pH}. Объём партии — {volume} л.`,
    data: [
      { label: 'Свободный SO₂', value: '{free} мг/л' },
      { label: 'pH', value: '{pH}' },
      { label: 'Цель', value: `${comma(opts.target)} мг/л молекулярного` },
      { label: 'Объём', value: '{volume} л' },
    ],
    question: 'Сколько метабисульфита калия внести?',
    choices: [],
    dose: so2MolecularDose(opts.target, opts.extraFormula),
  };
}

// ───────────────────────────── Подкисление сусла ─────────────────────────────

/** Практическое правило: 1 г/л винной кислоты снижает pH примерно на 0,1.
 *  Буферность конкретного сусла сдвигает цифру, поэтому pH после внесения перемеряют. */
const TARTARIC_PER_01_PH = 1;

/** Этап «подкислить сусло до целевого pH», с пределом ЕС для сусла. */
export function acidifyMustStage(opts: { phase: string; targetPH: number; note: string }): SimStage {
  const limit = EU_ACID_LIMIT.acidifyMust;
  const wanted = (b: Batch) => Math.max(0, (b.pH - opts.targetPH) * 10 * TARTARIC_PER_01_PH);
  const perLitre = (b: Batch) => Math.min(wanted(b), limit);
  // Погрешность pH-метра ~0,02 — это ~0,2 г/л кислоты
  const tolerance = (b: Batch) => 0.2 * b.volumeL;
  return {
    id: 'acid-dose',
    phase: opts.phase,
    icon: '🧪',
    title: 'Коррекция кислотности сусла: расчёт навески',
    context: `${opts.note} Объём партии — {volume} л.`,
    data: [
      { label: 'pH', value: '{pH}' },
      { label: 'ТК', value: '{ta} г/л' },
      { label: 'Цель', value: `pH ≈ ${comma(opts.targetPH, 2)}` },
      { label: 'Объём', value: '{volume} л' },
    ],
    question: 'Сколько винной кислоты внести?',
    choices: [],
    reagents: ['tartaric'],
    dose: {
      prompt: 'Навеска винной кислоты на {volume} л (0 — если подкислять не нужно)',
      unit: 'г',
      formula:
        'Ориентир: 1 г/л винной кислоты снижает pH примерно на 0,1.\n' +
        `Нужно, г/л = (pH − ${comma(opts.targetPH, 2)}) × 10, но не больше ${comma(limit)} г/л — предел ЕС для сусла.\n` +
        'Навеска (г) = г/л × объём (л).',
      expected: (b) => tartaricGrams(b.volumeL, perLitre(b)),
      apply: (b, grams) => {
        const gl = grams / b.volumeL;
        return [{ add: { ta: gl, pH: (-0.1 * gl) / TARTARIC_PER_01_PH } }];
      },
      absTolerance: tolerance,
      explain: (b, exp, grams) => {
        const w = wanted(b);
        const calc =
          w <= 0
            ? `pH ${comma(b.pH, 2)} уже не выше цели ${comma(opts.targetPH, 2)} — подкислять не нужно.`
            : w > limit
              ? `До цели не хватает ${comma((b.pH - opts.targetPH), 2)} pH, это ${comma(w)} г/л — больше предела ${comma(limit)} г/л для сусла. Вносим предел: ${comma(limit)} × ${b.volumeL} = ${comma(exp, 0)} г; остальное решают более ранним сбором или купажом.`
              : `До цели не хватает ${comma((b.pH - opts.targetPH), 2)} pH, это ${comma(w)} г/л. Навеска: ${comma(w)} × ${b.volumeL} = ${comma(exp, 0)} г.`;
        const fact = grams > 0 ? ` Внесено ${comma(grams, 0)} г — это ${comma(grams / b.volumeL)} г/л.` : '';
        return (
          `${calc}${fact}\n` +
          doseVerdict(
            exp,
            grams,
            'Недобор: pH останется высоким — сернистая будет работать слабее, а после ЯМБ pH вырастет ещё.',
            'Перебор: вино выйдет резким, а доза может выйти за допустимый предел подкисления.',
            tolerance(b),
            'В пределах точности. После внесения перемерьте pH: буферность сусла сдвигает расчёт.'
          )
        );
      },
      effects: {
        exact: [{ metric: 'freshness', delta: 3 }, { metric: 'stability', delta: 3 }],
        close: [{ metric: 'stability', delta: 1 }],
        off: [{ metric: 'freshness', delta: -2 }, { metric: 'stability', delta: -2 }],
      },
      faults: { off: 'Подкисление сусла не по расчёту' },
      reagents: ['tartaric'],
    },
  };
}

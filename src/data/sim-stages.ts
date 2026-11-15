// Общие кирпичики сценариев симулятора: этапы, где дозу считают и вводят числом.
// Вынесены из simulation.ts, чтобы ими пользовались и публичные, и личные сценарии.

import type { Batch } from './sim-batch';
import type { SimDose, SimStage } from './simulation';
import {
  freeSO2ForMolecular,
  molecularFraction,
  so2ReagentGrams,
  so2FromReagent,
  KMS_SO2_FRACTION,
} from '../lib/enology';

// ───────────────────────────── Этапы с расчётом дозы SO₂ ─────────────────────────────

export const comma = (x: number, d = 1) => x.toFixed(d).replace('.', ',');

/** Как реальная навеска соотносится с расчётной — вердикт для разбора. */
export function doseVerdict(expected: number, entered: number, under: string, over: string, absTol = 0): string {
  const target = Math.max(expected, 0);
  const diff = entered - target;
  if (Math.abs(diff) <= Math.max(0.1 * target, absTol)) {
    return target <= absTol && entered <= absTol
      ? 'Верно: добавка меньше погрешности анализа — вносить нечего, перемерить через неделю.'
      : 'В пределах точности. После внесения перемерьте свободный SO₂ через 3–5 суток: часть сразу свяжется.';
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

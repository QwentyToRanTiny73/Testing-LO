/**
 * Энологические расчёты — единый источник формул для калькуляторов и симулятора.
 *
 * Всё здесь — упрощённые модели для обучения и ориентировочных расчётов.
 * Коэффициенты подписаны источником; где практика расходится, это сказано.
 */

// ─────────────────────────────── SO₂ ───────────────────────────────

/** pKa₁ сернистой кислоты в воде при 20 °C. В вине этанол и ионная сила смещают
 *  равновесие, поэтому после внесения свободный SO₂ всегда перемеряют. */
export const PKA1_SO2 = 1.81;

/** Доля молекулярной формы от свободного SO₂ при данном pH. */
export function molecularFraction(pH: number): number {
  return 1 / (1 + Math.pow(10, pH - PKA1_SO2));
}

export function molecularSO2(freeSO2: number, pH: number): number {
  return freeSO2 * molecularFraction(pH);
}

/** Свободный SO₂, нужный для целевого молекулярного при данном pH. */
export function freeSO2ForMolecular(targetMolecular: number, pH: number): number {
  return targetMolecular / molecularFraction(pH);
}

/** Массовая доля SO₂ в метабисульфите калия K₂S₂O₅: 2·64,07 / 222,32 = 0,576. */
export const KMS_SO2_FRACTION = 0.576;

/**
 * Навеска твёрдого реагента (г), чтобы поднять SO₂ на deltaMgL в volumeL литрах.
 * efficiency — доля внесённого, которая останется свободной (0..1): в молодом вине
 * и сусле часть сразу свяжется с ацетальдегидом и кетокислотами.
 */
export function so2ReagentGrams(volumeL: number, deltaMgL: number, so2Fraction = KMS_SO2_FRACTION, efficiency = 1): number {
  if (deltaMgL <= 0 || volumeL <= 0) return 0;
  return (deltaMgL * volumeL) / 1000 / so2Fraction / Math.max(efficiency, 0.01);
}

/** Сколько SO₂ (мг/л) реально внесено навеской grams в volumeL литрах. */
export function so2FromReagent(grams: number, volumeL: number, so2Fraction = KMS_SO2_FRACTION): number {
  if (volumeL <= 0) return 0;
  return (grams * so2Fraction * 1000) / volumeL;
}

/** Объём раствора SO₂ (мл) концентрации gPer100ml (г SO₂ на 100 мл). */
export function so2SolutionMl(volumeL: number, deltaMgL: number, gPer100ml: number, efficiency = 1): number {
  if (deltaMgL <= 0 || volumeL <= 0 || gPer100ml <= 0) return 0;
  return ((deltaMgL * volumeL) / 1000 / Math.max(efficiency, 0.01)) * (100 / gPer100ml);
}

/**
 * Пределы общего SO₂ в ЕС (Регламент 2019/934, прил. I B), мг/л — ориентир.
 * В РФ действует ТР ЕАЭС 047/2018: сверяйте с его актуальной редакцией.
 */
export const EU_TOTAL_SO2_LIMIT = {
  redDry: 150,
  whiteRoseDry: 200,
  redSweet: 200, // остаточный сахар ≥ 5 г/л
  whiteRoseSweet: 250,
} as const;

// ─────────────────────────────── Сахар и спирт ───────────────────────────────

/** г/л сахара на 1 % об. спирта (Риберо-Гайон): белые ~16,8; красные ~18 —
 *  у красных больше потерь при брожении на мезге. */
export const SUGAR_PER_PCT_VOL = { white: 16.8, red: 18 } as const;

export function potentialAlcohol(sugarGL: number, gPerPct: number = SUGAR_PER_PCT_VOL.white): number {
  return sugarGL / gPerPct;
}

/** Растворённая сахароза добавляет объём: ~0,62 л на 1 кг. */
export const SUCROSE_L_PER_KG = 0.62;

/**
 * Масса сахара (кг), чтобы поднять сахаристость с fromGL до toGL в volumeL литрах,
 * с учётом прироста объёма от растворённого сахара:
 *   (V·S₁ + 1000·m) / (V + 0,62·m) = S₂  →  m = V·(S₂ − S₁) / (1000 − 0,62·S₂).
 * Простой расчёт V·(S₂ − S₁)/1000 занижает навеску на 10–15 %.
 */
export function chaptalizationKg(volumeL: number, fromGL: number, toGL: number): number {
  if (toGL <= fromGL || volumeL <= 0) return 0;
  const denom = 1000 - SUCROSE_L_PER_KG * toGL;
  return denom > 0 ? (volumeL * (toGL - fromGL)) / denom : 0;
}

/** Пределы обогащения в ЕС (Регламент 1308/2013, прил. VIII), % об. — ориентир. */
export const EU_ENRICHMENT_LIMIT = { A: 3, B: 2, C: 1.5 } as const;

// ─────────────────────────────── Плотность и Brix ───────────────────────────────

/** Brix → относительная плотность (20 °C), аппроксимация для 0–30 °Brix. */
export function brixToSG(brix: number): number {
  return 1 + brix / (258.6 - (brix / 258.2) * 227.1);
}

/** Поправка ареометра, калиброванного на 20 °C, ~0,07 °Brix на °C. */
export const BRIX_TEMP_CORR_PER_C = 0.07;

/** Потенциальный спирт по Brix (принятая вилка 0,55–0,60). */
export const BRIX_TO_ALCOHOL = 0.575;

/** Убыль сахара (г/л) на 1 г/л убыли плотности по ходу брожения: этанол сам
 *  снижает плотность, поэтому коэффициент ~2,2, а не 2,6 как для несброженного сусла. */
export const SUGAR_PER_DENSITY_FERMENTING = 2.2;

// ─────────────────────────────── Кислотность ───────────────────────────────

/** Винная кислота: 1 г/л поднимает ТК (в пересчёте на винную) на 1 г/л. */
export function tartaricGrams(volumeL: number, deltaTA: number): number {
  return deltaTA > 0 ? deltaTA * volumeL : 0;
}

/** Бикарбонат калия: ~0,9 г/л на 1 г/л снижения ТК (AWRI), с учётом выпадения КГТ. */
export const KHCO3_PER_TA = 0.9;
export function khco3Grams(volumeL: number, deltaTA: number): number {
  return deltaTA > 0 ? deltaTA * volumeL * KHCO3_PER_TA : 0;
}

/** Пределы ЕС (Регламент 1308/2013, прил. VIII), г/л в пересчёте на винную — ориентир. */
export const EU_ACID_LIMIT = { acidifyMust: 1.5, acidifyWine: 2.5, deacidifyWine: 1 } as const;

// ─────────────────────────────── Ёмкости ───────────────────────────────

/** Насыпная плотность дроблёного гребнеотделённого винограда, кг/л (~1,09: как у сусла). */
export const MASH_DENSITY_KG_PER_L = 1.09;

/** Объём мезги (л) из массы винограда (т). */
export function mashVolumeL(tonnes: number): number {
  return (tonnes * 1000) / MASH_DENSITY_KG_PER_L;
}

/** Навеска бентонита (кг) при дозе г/гл на volumeL литров. */
export function bentoniteKg(volumeL: number, doseGhL: number): number {
  return (doseGhL * volumeL) / 100 / 1000;
}

// ─────────────────────────────── Проверка ответа ───────────────────────────────

export type Accuracy = 'exact' | 'close' | 'off';

/**
 * Оценка введённого значения относительно расчётного: ±10 % — точно, ±30 % — приемлемо.
 * absTol — допуск в абсолютных единицах для малых доз: когда расчёт сам меньше точности
 * анализа (свободный SO₂ меряют с погрешностью ~2 мг/л), процентный допуск теряет смысл.
 */
export function gradeAnswer(entered: number, expected: number, exactTol = 0.1, closeTol = 0.3, absTol = 0): Accuracy {
  if (!Number.isFinite(entered)) return 'off';
  const target = Math.max(expected, 0);
  const diff = Math.abs(entered - target);
  if (diff <= Math.max(exactTol * target, absTol)) return 'exact';
  if (diff <= Math.max(closeTol * target, 2 * absTol)) return 'close';
  return 'off';
}

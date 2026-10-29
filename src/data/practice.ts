// Где применить знания модуля: калькуляторы, симулятор, планировщик.
// Пути — относительно BASE_URL; якоря совпадают с id секций на /tools.

export interface PracticeLink {
  icon: string;
  label: string;
  href: string;
  /** Что именно здесь потренировать */
  hint: string;
}

const so2Calc: PracticeLink = { icon: '⚗️', label: 'Калькулятор SO₂', href: 'tools#so2', hint: 'навеска метабисульфита по pH и целевому молекулярному SO₂' };
const sugarCalc: PracticeLink = { icon: '🍬', label: 'Калькулятор сахара', href: 'tools#sugar', hint: 'шаптализация с учётом прироста объёма' };
const acidCalc: PracticeLink = { icon: '🧪', label: 'Калькулятор кислотности', href: 'tools#acid', hint: 'подкисление и раскисление с пределами ЕС' };
const brixCalc: PracticeLink = { icon: '📏', label: 'Конвертер Brix', href: 'tools#brix', hint: 'сахаристость, потенциальный спирт, поправка на температуру' };
const macerationCalc: PracticeLink = { icon: '🍇', label: 'Калькулятор мацерации', href: 'tools#maceration', hint: 'дни мацерации по сорту, стилю и температуре' };
const bentoniteCalc: PracticeLink = { icon: '🏺', label: 'Пробная оклейка бентонитом', href: 'tools#bentonite', hint: 'доза по результату пробной оклейки' };
const vesselCalc: PracticeLink = { icon: '🛢️', label: 'Парк ёмкостей', href: 'tools#vessel-park', hint: 'объём мезги и сусла от массы винограда' };
const harvest: PracticeLink = { icon: '📅', label: 'Планировщик урожая', href: 'harvest', hint: 'лоты и этапы переработки сезона' };
const simulator: PracticeLink = { icon: '🎮', label: 'Симулятор', href: 'simulator', hint: 'те же решения на партии с паспортом и последствиями' };

export const practiceByModule: Record<string, PracticeLink[]> = {
  'priem-drobl-press': [vesselCalc, so2Calc, simulator],
  fermenty: [simulator],
  'deburb-osvetlenie': [simulator],
  drozhzhi: [brixCalc, sugarCalc, simulator],
  'temperatura-kinetika': [brixCalc, macerationCalc, simulator],
  ymf: [acidCalc, so2Calc, simulator],
  so2: [so2Calc, simulator],
  okleyka: [bentoniteCalc, simulator],
  stabilizatsiya: [bentoniteCalc, acidCalc],
  filtratsiya: [simulator],
  vyderzhka: [so2Calc, simulator],
  rozliv: [so2Calc, simulator],
  analitika: [brixCalc, so2Calc, acidCalc],
  sorta: [harvest, macerationCalc, simulator],
  defekty: [so2Calc, simulator],
  'stili-vina': [sugarCalc, macerationCalc, simulator],
  'eno-vinograd-suslo': [brixCalc, sugarCalc],
  'eno-brozhenie-biohimiya': [sugarCalc, brixCalc],
  'eno-kisloty-ph': [acidCalc, so2Calc],
  'eno-redoks-kislorod': [so2Calc],
  'eno-kolloidy-stabilnost': [bentoniteCalc],
  'eno-fenoly-cvet': [macerationCalc],
};

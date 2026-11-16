// Дополнительные сценарии симулятора: игристые и разборы аварий.
// Тот же движок, что у основных: паспорт партии, правила последствий, этапы с расчётом дозы.
// Все числа — ориентиры учебной модели, а не нормативы.

import type { SimScenario, SimStage } from './simulation';
import type { Batch } from './sim-batch';
import { SUGAR_PER_BAR } from './sim-batch';
import { comma, doseVerdict, so2BottlingStage } from './sim-stages';

// ───────────────────────────── Игристое традиционным методом ─────────────────────────────

/** Тиражный сахар (кг) на партию, чтобы получить targetBar в бутылке. */
function tirageStage(targetBar: number): SimStage {
  const gl = (b: Batch) => Math.max(0, targetBar * SUGAR_PER_BAR - b.sugar);
  const kg = (b: Batch) => (gl(b) * b.volumeL) / 1000;
  // 0,25 бар — разброс, который даёт сама бутылка: ~1 г/л сахара
  const tol = (b: Batch) => b.volumeL / 1000;
  return {
    id: 'tirage',
    phase: 'Тираж',
    icon: '🧪',
    title: 'Тираж: расчёт тиражного сахара',
    context:
      'Базовое вино готово. В бутылку вносят тиражный ликёр — сахар, дрожжи и питание — и укупоривают кроной. Из каждых ~4 г/л сброженного сахара получится ~1 бар давления CO₂. ' +
      `Цель — ${comma(targetBar, 0)} бар. В базовом вине осталось {sugar} г/л сахара; объём партии — {volume} л.`,
    data: [
      { label: 'Остаточный сахар', value: '{sugar} г/л' },
      { label: 'Цель', value: `${comma(targetBar, 0)} бар` },
      { label: 'Правило', value: '~4 г/л сахара = 1 бар' },
      { label: 'Объём', value: '{volume} л' },
    ],
    question: 'Сколько сахара внести в тиражный ликёр на всю партию?',
    choices: [],
    reagents: ['yeast-robust', 'rehydration-protector'],
    dose: {
      prompt: 'Тиражный сахар на {volume} л',
      unit: 'кг',
      formula:
        `Нужно, г/л = ${comma(targetBar, 0)} бар × 4 − остаточный сахар.\n` +
        'Сахар (кг) = г/л × объём (л) / 1000.\n' +
        'Остаточный сахар базового вина тоже сбродится в бутылке, поэтому его вычитают.',
      expected: kg,
      apply: (b, entered) => [{ add: { sugar: (entered * 1000) / b.volumeL } }],
      absTolerance: tol,
      explain: (b, exp, entered) => {
        const need = gl(b);
        const bar = (b.sugar + (entered * 1000) / b.volumeL - 1) / SUGAR_PER_BAR;
        return (
          `Расчёт: ${comma(targetBar, 0)} × 4 − ${comma(b.sugar)} = ${comma(need)} г/л; на ${b.volumeL} л это ${comma(exp, 2)} кг. ` +
          `С вашей навеской в бутылке будет около ${comma(Math.max(0, bar))} бар.\n` +
          doseVerdict(
            exp,
            entered,
            'Недобор: вино выйдет вялым, пузырь — редким и быстро уходящим.',
            'Перебор: давление выше 6–7 бар — фонтан при открывании и риск разрыва бутылок.',
            tol(b),
            'В пределах точности: давление ляжет около цели. Проверьте его афрометром на контрольной бутылке через 6–8 недель.'
          )
        );
      },
      effects: {
        exact: [{ metric: 'structure', delta: 5 }, { metric: 'stability', delta: 3 }],
        close: [{ metric: 'structure', delta: 2 }],
        off: [{ metric: 'structure', delta: -4 }, { metric: 'stability', delta: -3 }],
      },
      faults: { off: 'Тиражный сахар не по расчёту' },
    },
  };
}

const sparkling: SimScenario = {
  id: 'sparkling-traditional',
  title: 'Игристое традиционным методом',
  grape: 'Белый сорт с высокой кислотностью',
  style: 'Брют с выдержкой на осадке в бутылке',
  icon: '🍾',
  difficulty: 'Сложный',
  noteStyle: 'white',
  noteText: {
    aromaHigh: 'Тонкий нос: цитрус, яблоко, бриошь и хлебная корка от выдержки на осадке.',
    aromaLow: 'Нос простой, без тонов выдержки на осадке.',
    freshHigh: 'Живая кислотность и мелкий стойкий перляж.',
    structHigh: 'Сливочный мусс и долгое послевкусие.',
    structMid: 'Мусс обычный, тело среднее.',
    structLow: 'Пузырь грубый и быстро уходит, тело пустое.',
  },
  intro:
    'Классическая схема: сначала тихое базовое вино, затем вторичное брожение в бутылке, выдержка на осадке, ремюаж и дегоржаж. Здесь ценят кислотность и нейтральность базы, а не сахар и мощь.',
  goal: 'Свежая база, точный тираж на ~6 бар, чистый дегоржаж и брют без огрехов.',
  batch: { sugar: 175, alcohol: 0, pH: 3.05, ta: 9.5, malic: 4.5, yan: 160, freeSO2: 0, totalSO2: 0, temp: 20, va: 0.05, volumeL: 100, phase: 'must' },
  // Сухое не задаём: дозаж намеренно оставляет сахар
  profile: { label: 'Игристое, брют', color: 'white', dry: false, gPerPct: 16.8, so2Limit: 185, molTarget: 0.8, minPressure: 4.5 },
  stages: [
    {
      id: 'harvest',
      phase: 'Сбор урожая',
      icon: '🍇',
      title: 'Срок сбора под базовое вино',
      context:
        'Для игристого виноград снимают раньше, чем для тихого вина: при вторичном брожении спирт вырастет ещё на ~1,3 % об., а кислотность — основа свежести и долгой выдержки на осадке.',
      data: [
        { label: 'Сахар', value: '{sugar} г/л' },
        { label: 'Потенц. спирт', value: '≈{potential} % об.' },
        { label: 'pH', value: '{pH}' },
        { label: 'ТК', value: '{ta} г/л' },
      ],
      question: 'Когда снимать?',
      choices: [
        {
          id: 'early',
          label: 'Сейчас, по кислотности',
          detail: '{sugar} г/л, ТК {ta} г/л',
          effects: [{ metric: 'freshness', delta: 10 }, { metric: 'stability', delta: 3 }],
          feedback:
            'Классика для игристого: база выйдет на 10,5–11 % об., после тиража — около 12 %. Высокая кислотность выдержит годы на осадке.',
          quality: 'best',
        },
        {
          id: 'ripe',
          label: 'Через неделю-две, «для полноты»',
          detail: 'сахар +25 г/л, pH +0,12, ТК −1,5 г/л',
          effects: [{ metric: 'structure', delta: 3 }, { metric: 'freshness', delta: -4 }],
          feedback:
            'База станет полнее, но и тяжелее: вместе с тиражом спирт уйдёт к 13 %, свежесть просядет. Для некоторых стилей допустимо, для брюта — компромисс.',
          quality: 'ok',
          batch: [{ add: { sugar: 25, pH: 0.12, ta: -1.5, malic: -0.8 } }],
        },
        {
          id: 'late',
          label: 'В полной зрелости, как для тихого',
          detail: 'сахар +50 г/л, pH +0,25, ТК −2,8 г/л',
          effects: [{ metric: 'freshness', delta: -12 }, { metric: 'structure', delta: -2 }, { metric: 'stability', delta: -4 }],
          feedback:
            'Тяжёлая база с высоким pH: спирт после тиража уйдёт за 14 %, дрожжам в бутылке будет трудно, а вкус потеряет лёгкость.',
          quality: 'poor',
          fault: 'Тяжёлое базовое вино',
          batch: [{ add: { sugar: 50, pH: 0.25, ta: -2.8, malic: -1.5 } }],
        },
      ],
    },
    {
      id: 'press',
      phase: 'Прессование',
      icon: '🗜️',
      title: 'Прессование целыми гроздями и фракции',
      context:
        'Для базы игристого виноград не дробят, а прессуют целыми гроздями. Первая, самая чистая часть сока (кюве) — лучшая; поздние прессовые фракции несут фенолы и горечь, которые в игристом проявятся особенно резко.',
      question: 'Как прессуете?',
      reagents: ['metabisulfite'],
      choices: [
        {
          id: 'cuvee',
          label: 'Целыми гроздями, только кюве, лёгкий SO₂',
          detail: 'Поздние фракции — в отдельную ёмкость',
          effects: [{ metric: 'purity', delta: 6 }, { metric: 'aroma', delta: 3 }],
          feedback: 'Чистое, бледное, малофенольное сусло — то, что нужно для тонкого игристого.',
          quality: 'best',
          batch: [{ set: { temp: 12 } }, { so2: 30 }],
        },
        {
          id: 'crush',
          label: 'Дробить и прессовать как для тихого белого',
          effects: [{ metric: 'purity', delta: -2 }, { metric: 'structure', delta: 1 }],
          feedback: 'Рабочий вариант, но контакт с кожицей и семенами добавит фенолов и цвета: база станет грубее.',
          quality: 'ok',
          batch: [{ add: { pH: 0.04 } }, { so2: 30 }],
        },
        {
          id: 'all',
          label: 'Все фракции вместе, до последней капли',
          effects: [{ metric: 'purity', delta: -6 }, { metric: 'aroma', delta: -3 }],
          feedback: 'Поздние фракции дают горечь, окисляемые фенолы и высокий pH. В игристом это выйдет наружу на дегоржаже.',
          quality: 'poor',
          fault: 'Фенольная горечь из прессовых фракций',
          batch: [{ add: { pH: 0.08 } }, { so2: 30 }],
        },
      ],
    },
    {
      id: 'base-ferment',
      phase: 'Брожение базового вина',
      icon: '🫧',
      title: 'Первое брожение',
      context:
        'База должна выбродить досуха и чисто: остаток сахара исказит расчёт тиража, а лишние эфиры и сероводород потом закрепятся в бутылке. Азот сусла — {yan} мг/л.',
      question: 'Как ведёте брожение?',
      reagents: ['yeast-robust', 'nutrient-organic'],
      choices: [
        {
          id: 'clean',
          label: 'Нейтральный штамм, питание, 16 °C',
          effects: [{ metric: 'purity', delta: 5 }, { metric: 'aroma', delta: 2 }],
          feedback: 'Чистое полное брожение: нейтральная база, на которую лягут тона выдержки на осадке.',
          quality: 'best',
          batch: [{ add: { yan: 40 } }, { set: { temp: 16 } }, { ferment: {} }],
        },
        {
          id: 'warm',
          label: 'Без охлаждения, около 22 °C',
          effects: [{ metric: 'aroma', delta: -4 }, { metric: 'purity', delta: -1 }],
          feedback: 'Добродит, но часть свежести и фруктовых тонов уйдёт с CO₂. База получится простоватой.',
          quality: 'ok',
          batch: [{ set: { temp: 22 } }, { ferment: {} }],
        },
        {
          id: 'cold',
          label: 'В холодном погребе, 10 °C, без питания',
          effects: [{ metric: 'stability', delta: -6 }, { metric: 'purity', delta: -3 }],
          feedback:
            'В холоде и без азота дрожжи остановятся, не добродив. Остаток сахара придётся учитывать в тираже, а риск микробиологии растёт.',
          quality: 'poor',
          fault: 'Недоброд базового вина',
          batch: [{ set: { temp: 10 } }, { ferment: {} }],
        },
      ],
    },
    {
      id: 'mlf',
      phase: 'После брожения',
      icon: '🔬',
      title: 'ЯМБ в базовом вине',
      context:
        'Яблочной кислоты в базе {malic} г/л. В игристом ЯМБ проводят часто: кислотность и так высока, а оставленная яблочная — риск, что бактерии запустят малолактику уже в бутылке.',
      question: 'Что делаете с ЯМБ?',
      reagents: ['oenococcus', 'metabisulfite'],
      choices: [
        {
          id: 'do',
          label: 'Провести ЯМБ, затем сульфитировать',
          effects: [{ metric: 'stability', delta: 5 }, { metric: 'freshness', delta: -2 }, { metric: 'structure', delta: 2 }],
          feedback: 'Кислотность мягче, база биологически стабильна — бутылка не взорвётся от малолактики через год.',
          quality: 'best',
          batch: [{ mlf: 'complete' }, { so2: 25, bound: 0.3 }],
        },
        {
          id: 'block',
          label: 'Блокировать ЯМБ сернистой и холодом',
          effects: [{ metric: 'freshness', delta: 4 }, { metric: 'stability', delta: -1 }],
          feedback:
            'Свежее и острее, но базу придётся стерильно фильтровать перед тиражом, а лишний SO₂ мешает дрожжам в бутылке.',
          quality: 'ok',
          batch: [{ so2: 40, bound: 0.4 }],
        },
        {
          id: 'ignore',
          label: 'Ничего не делать',
          effects: [{ metric: 'stability', delta: -8 }, { metric: 'purity', delta: -3 }],
          feedback: 'Спонтанная частичная ЯМБ сейчас — и продолжение в бутылке потом: муть, лишнее давление, посторонние тона.',
          quality: 'poor',
          fault: 'Риск ЯМБ в бутылке',
          batch: [{ mlf: 'partial' }, { add: { va: 0.1 } }],
        },
      ],
    },
    {
      id: 'stab',
      phase: 'Стабилизация базы',
      icon: '❄️',
      title: 'Стабилизация перед тиражом',
      context:
        'В игристом нестабильность выходит наружу сильнее, чем в тихом: кристаллы винного камня в бутылке под давлением провоцируют фонтан при открывании, а белковая муть не уйдёт с дегоржажем.',
      question: 'Как стабилизируете базу?',
      reagents: ['bentonite', 'cmc'],
      choices: [
        {
          id: 'full',
          label: 'Бентонит по тепловой пробе и холод',
          effects: [{ metric: 'stability', delta: 6 }],
          feedback: 'База стабильна по белку и тартратам. Бентонит заодно помогает осадку в бутылке собраться при ремюаже.',
          quality: 'best',
          batch: [{ add: { ta: -0.5, pH: -0.02 } }, { oxygen: 5 }],
        },
        {
          id: 'protein-only',
          label: 'Только бентонит, без холода',
          effects: [{ metric: 'stability', delta: 1 }],
          feedback: 'Белок закрыт, тартраты — нет. В холодильнике покупателя кристаллы выпадут и могут вызвать фонтан при открывании.',
          quality: 'ok',
          batch: [{ oxygen: 4 }],
        },
        {
          id: 'skip',
          label: 'Пропустить — всё равно будет дегоржаж',
          effects: [{ metric: 'stability', delta: -9 }],
          feedback: 'Дегоржаж убирает дрожжевой осадок, но не белковую муть и не будущие кристаллы.',
          quality: 'poor',
          fault: 'Муть и кристаллы в бутылке',
        },
      ],
    },
    tirageStage(6),
    {
      id: 'second-ferment',
      phase: 'Бутылка',
      icon: '🌡️',
      title: 'Вторичное брожение в бутылке',
      context:
        'Бутылки лежат горизонтально. Медленное прохладное брожение даёт мелкий стойкий пузырь, тёплое — грубый, слишком холодное — останавливается.',
      question: 'Где держите бутылки?',
      choices: [
        {
          id: 'cool',
          label: '11–13 °C, 6–8 недель',
          effects: [{ metric: 'structure', delta: 5 }, { metric: 'aroma', delta: 2 }],
          feedback: 'Медленное полное брожение: давление набрано, пузырь мелкий.',
          quality: 'best',
          batch: [{ set: { temp: 12 } }, { referment: {} }],
        },
        {
          id: 'warm',
          label: 'В тёплом помещении, около 20 °C',
          effects: [{ metric: 'structure', delta: -3 }],
          feedback: 'Быстро добродит, но пузырь крупнее и быстрее уходит из бокала.',
          quality: 'ok',
          batch: [{ set: { temp: 20 } }, { referment: {} }],
        },
        {
          id: 'cold',
          label: 'В неотапливаемом погребе, 7–8 °C',
          effects: [{ metric: 'structure', delta: -6 }, { metric: 'stability', delta: -5 }],
          feedback:
            'В таком холоде дрожжи в бутылке встают: давление недобрано, сахар остался — и может «проснуться» весной уже на складе.',
          quality: 'poor',
          fault: 'Вторичное брожение остановилось',
          batch: [{ set: { temp: 8 } }, { referment: {} }],
        },
      ],
    },
    {
      id: 'disgorge',
      phase: 'Выдержка и дегоржаж',
      icon: '🔄',
      title: 'Выдержка на осадке, ремюаж, дегоржаж',
      context:
        'Автолиз дрожжей в бутылке даёт тона бриоши и сливочную текстуру. Затем осадок сгоняют в горлышко (ремюаж) и удаляют (дегоржаж); при этом теряется немного давления и вина.',
      question: 'Как завершаете?',
      choices: [
        {
          id: 'long',
          label: 'Не меньше 9 месяцев на осадке, ремюаж, дегоржаж с заморозкой горлышка',
          effects: [{ metric: 'aroma', delta: 6 }, { metric: 'structure', delta: 4 }, { metric: 'purity', delta: 3 }],
          feedback: 'Тона выдержки, сливочный мусс, чистое удаление осадка с минимальной потерей давления.',
          quality: 'best',
          batch: [{ add: { pressure: -0.3 } }, { oxygen: 2 }],
        },
        {
          id: 'short',
          label: '2–3 месяца, дегоржаж без заморозки',
          effects: [{ metric: 'aroma', delta: -2 }],
          feedback: 'Свежее и проще; при «горячем» дегоржаже теряется больше давления и вина, кислорода попадает больше.',
          quality: 'ok',
          batch: [{ add: { pressure: -0.8 } }, { oxygen: 5 }],
        },
        {
          id: 'none',
          label: 'Без ремюажа и дегоржажа, сразу в продажу',
          effects: [{ metric: 'purity', delta: -8 }],
          feedback: 'Для брюта традиционного метода — брак: при наливе осадок взмучивается, вино мутное.',
          quality: 'poor',
          fault: 'Дрожжевой осадок в бокале',
        },
      ],
    },
    {
      id: 'dosage',
      phase: 'Дозаж',
      icon: '🥂',
      title: 'Дозаж: категория по сахару',
      context:
        'После дегоржажа доливают экспедиционный ликёр — вино с сахаром и небольшой дозой SO₂ для защиты. Количество сахара задаёт категорию: брют натюр — почти без сахара, брют — до 12 г/л, полусладкое — заметно сладкое. Цель партии — брют.',
      audit: true,
      question: 'Какой дозаж?',
      choices: [
        {
          id: 'brut',
          label: 'Брют: 6–8 г/л',
          effects: [{ metric: 'freshness', delta: 3 }, { metric: 'structure', delta: 3 }],
          feedback: 'Сахар сглаживает высокую кислотность, не делая вино сладким. Классика для такой базы.',
          quality: 'best',
          batch: [{ add: { sugar: 7 } }, { so2: 20, bound: 0.2 }],
        },
        {
          id: 'nature',
          label: 'Брют натюр: без сахара',
          effects: [{ metric: 'freshness', delta: 4 }, { metric: 'structure', delta: -3 }],
          feedback: 'Честно и строго, но при ТК {ta} г/л вино может показаться резким. Подходит более зрелым и долго выдержанным базам.',
          quality: 'ok',
          batch: [{ so2: 20, bound: 0.2 }],
        },
        {
          id: 'sweet',
          label: 'Полусладкое: 40 г/л',
          effects: [{ metric: 'freshness', delta: -6 }, { metric: 'aroma', delta: -2 }],
          feedback: 'Сахар забивает тонкие тона выдержки. Для брюта — мимо стиля.',
          quality: 'poor',
          fault: 'Дозаж мимо стиля',
          batch: [{ add: { sugar: 40 } }, { so2: 20, bound: 0.2 }],
        },
      ],
    },
  ],
};

// ───────────────────────────── Петнат ─────────────────────────────

/** Петнат: при каком остатке сахара разливать, чтобы получить targetBar. */
function petnatBottlingStage(targetBar: number): SimStage {
  const left = 1;
  const exp = () => targetBar * SUGAR_PER_BAR + left;
  return {
    id: 'bottling-point',
    phase: 'Розлив',
    icon: '🧪',
    title: 'Момент розлива: расчёт остатка сахара',
    context:
      'Петнат разливают, пока он ещё бродит: остаток сахара досбраживается в закрытой бутылке и даёт газ. Разлить слишком рано — бутылки станут бомбами; слишком поздно — вино выйдет почти тихим. ' +
      `Цель — около ${comma(targetBar, 0)} бар. Каждые ~4 г/л сахара дают ~1 бар, и около 1 г/л обычно остаётся несброженным.`,
    data: [
      { label: 'Сейчас в сусле', value: '{sugar} г/л' },
      { label: 'Цель', value: `${comma(targetBar, 0)} бар` },
      { label: 'Правило', value: '~4 г/л = 1 бар' },
      { label: 'Остаётся в вине', value: '~1 г/л' },
    ],
    question: 'При каком остатке сахара разливать?',
    choices: [],
    dose: {
      prompt: 'Остаток сахара в момент розлива',
      unit: 'г/л',
      formula: `Сахар при розливе = ${comma(targetBar, 0)} бар × 4 + 1 (несброженный остаток).\nСахар контролируют ареометром и проверяют лабораторным анализом.`,
      expected: exp,
      apply: (_b, entered) => [{ ferment: { residual: entered } }],
      absTolerance: () => 1,
      explain: (_b, e, entered) => {
        const bar = Math.max(0, (entered - left) / SUGAR_PER_BAR);
        return (
          `Расчёт: ${comma(targetBar, 0)} × 4 + 1 = ${comma(e, 0)} г/л. При розливе на ${comma(entered)} г/л в бутылке будет около ${comma(bar)} бар.\n` +
          doseVerdict(
            e,
            entered,
            'Поздно: газа будет мало, вино выйдет вялым, почти тихим.',
            'Рано: давление уйдёт за 6–7 бар — фонтан при открывании и риск разрыва бутылок.',
            1,
            'В пределах точности: давление ляжет около цели.'
          )
        );
      },
      effects: {
        exact: [{ metric: 'structure', delta: 5 }, { metric: 'stability', delta: 3 }],
        close: [{ metric: 'structure', delta: 2 }],
        off: [{ metric: 'structure', delta: -4 }, { metric: 'stability', delta: -3 }],
      },
      faults: { off: 'Момент розлива петната не по расчёту' },
    },
  };
}

const petnat: SimScenario = {
  id: 'petnat',
  title: 'Петнат',
  grape: 'Белый сорт',
  style: 'Игристое предкового метода: одно брожение, закончившееся в бутылке',
  icon: '🫧',
  difficulty: 'Средний',
  noteStyle: 'white',
  noteText: {
    aromaHigh: 'Живой фруктовый нос, лёгкие дрожжевые тона.',
    aromaLow: 'Аромат приглушён, фрукт ушёл.',
    freshHigh: 'Сочная кислотность и игривый пузырь.',
    structHigh: 'Мягкий пузырь, приятная лёгкая текстура.',
    structMid: 'Пузырь скромный, тело лёгкое.',
    structLow: 'Газа почти нет — вино ощущается тихим и плоским.',
  },
  intro:
    'Петнат (pétillant naturel) — самый древний способ получить игристое: вино разливают недобродившим, и брожение заканчивается в бутылке. Без тиражного ликёра, но с одним критичным расчётом — моментом розлива.',
  goal: 'Чистое брожение, точный момент розлива на ~3 бар, безопасные бутылки.',
  batch: { sugar: 190, alcohol: 0, pH: 3.2, ta: 7.5, malic: 3.2, yan: 170, freeSO2: 0, totalSO2: 0, temp: 20, va: 0.05, volumeL: 100, phase: 'must' },
  profile: { label: 'Петнат, белый', color: 'white', dry: false, gPerPct: 16.8, so2Limit: 200, molTarget: 0.6, minPressure: 2 },
  stages: [
    {
      id: 'harvest',
      phase: 'Сбор урожая',
      icon: '🍇',
      title: 'Срок сбора',
      context: 'Петнат пьют молодым и свежим: нужна живая кислотность и умеренный спирт, а не максимальная зрелость.',
      data: [
        { label: 'Сахар', value: '{sugar} г/л' },
        { label: 'pH', value: '{pH}' },
        { label: 'ТК', value: '{ta} г/л' },
      ],
      question: 'Когда снимать?',
      choices: [
        {
          id: 'fresh',
          label: 'Сейчас, при живой кислотности',
          detail: '{sugar} г/л (≈{potential} % об.)',
          effects: [{ metric: 'freshness', delta: 8 }, { metric: 'aroma', delta: 3 }, { metric: 'aroma', delta: 2 }, { metric: 'structure', delta: 2 }],
          feedback: 'Хороший баланс: около 11 % об., свежая кислотность, ясный фрукт.',
          quality: 'best',
        },
        {
          id: 'ripe',
          label: 'Подождать две недели',
          detail: 'сахар +30 г/л, pH +0,15',
          effects: [{ metric: 'structure', delta: 2 }, { metric: 'freshness', delta: -6 }],
          feedback: 'Полнее, но тяжелее и с высоким pH: петнат теряет лёгкость, а брожение в бутылке идёт труднее.',
          quality: 'ok',
          batch: [{ add: { sugar: 30, pH: 0.15, ta: -1.4, malic: -0.8 } }],
        },
        {
          id: 'green',
          label: 'Снять совсем рано',
          detail: 'сахар −25 г/л, ТК +1,2 г/л',
          effects: [{ metric: 'freshness', delta: 2 }, { metric: 'aroma', delta: -6 }, { metric: 'structure', delta: -4 }],
          feedback: 'Кисло и пусто: фрукт не набран, вино получится резким и худым.',
          quality: 'poor',
          fault: 'Незрелое сырьё',
          batch: [{ add: { sugar: -25, ta: 1.2, pH: -0.08, malic: 0.6 } }],
        },
      ],
    },
    {
      id: 'press',
      phase: 'Прессование и отстой',
      icon: '🗜️',
      title: 'Сусло и сернистая',
      context:
        'Петнат обычно делают с минимумом вмешательства. Но совсем без защиты сусло легко окисляется и захватывается дикой микрофлорой, а избыток SO₂ затормозит брожение, которое должно закончиться в бутылке.',
      question: 'Как готовите сусло?',
      reagents: ['metabisulfite', 'enzyme-pectolytic'],
      choices: [
        {
          id: 'light',
          label: 'Мягкий пресс, ~20 мг/л SO₂, холодный отстой',
          effects: [{ metric: 'purity', delta: 5 }, { metric: 'aroma', delta: 2 }, { metric: 'aroma', delta: 2 }, { metric: 'structure', delta: 2 }],
          feedback: 'Минимальная, но достаточная защита: сусло чистое, дрожжи стартуют без помех.',
          quality: 'best',
          batch: [{ so2: 20 }, { set: { temp: 12 } }],
        },
        {
          id: 'none',
          label: 'Совсем без SO₂',
          effects: [{ metric: 'purity', delta: -3 }],
          feedback: 'Возможно при идеальном сырье и гигиене, но риск летучей кислотности и окисления выше.',
          quality: 'ok',
          batch: [{ add: { va: 0.05 } }],
        },
        {
          id: 'heavy',
          label: '60 мг/л SO₂ «для надёжности»',
          effects: [{ metric: 'aroma', delta: -3 }, { metric: 'stability', delta: -3 }],
          feedback: 'Брожение стартует с трудом, а в бутылке может и вовсе не дойти до конца.',
          quality: 'poor',
          fault: 'Брожение тормозит избыток SO₂',
          batch: [{ so2: 60 }],
        },
      ],
    },
    {
      id: 'ferment',
      phase: 'Брожение',
      icon: '🫧',
      title: 'Старт брожения',
      context: 'Ровное прохладное брожение даёт время поймать момент розлива. Бурное тёплое брожение проскакивает нужный сахар за часы.',
      question: 'Как ведёте брожение?',
      reagents: ['yeast-aromatic', 'nutrient-organic'],
      choices: [
        {
          id: 'cool',
          label: 'Выбранный штамм, 15–16 °C, замеры дважды в сутки',
          effects: [{ metric: 'aroma', delta: 4 }, { metric: 'purity', delta: 3 }, { metric: 'aroma', delta: 2 }, { metric: 'structure', delta: 2 }],
          feedback: 'Предсказуемая кинетика — момент розлива видно заранее.',
          quality: 'best',
          batch: [{ set: { temp: 15 } }],
        },
        {
          id: 'wild',
          label: 'Спонтанное брожение',
          effects: [{ metric: 'aroma', delta: 1 }, { metric: 'purity', delta: -3 }],
          feedback: 'Классика стиля, но кинетика непредсказуема и выше риск летучей кислотности.',
          quality: 'ok',
          batch: [{ add: { va: 0.1 } }, { set: { temp: 17 } }],
        },
        {
          id: 'hot',
          label: 'Без охлаждения, 24 °C',
          effects: [{ metric: 'aroma', delta: -5 }, { metric: 'purity', delta: -2 }],
          feedback: 'Брожение мчится: аромат уходит с газом, а момент розлива легко пропустить.',
          quality: 'poor',
          fault: 'Бурное тёплое брожение',
          batch: [{ set: { temp: 24 } }, { add: { va: 0.15 } }],
        },
      ],
    },
    petnatBottlingStage(3),
    {
      id: 'in-bottle',
      phase: 'Бутылка',
      icon: '🌡️',
      title: 'Брожение в бутылке',
      context: 'Бутылки укупорены кроной. Теперь брожение должно спокойно дойти до конца.',
      question: 'Где держите бутылки?',
      choices: [
        {
          id: 'cool',
          label: '14–16 °C, несколько недель',
          effects: [{ metric: 'structure', delta: 4 }, { metric: 'aroma', delta: 2 }, { metric: 'structure', delta: 2 }],
          feedback: 'Спокойное полное дображивание: давление набрано, сахар выеден.',
          quality: 'best',
          batch: [{ set: { temp: 15 } }, { referment: {} }],
        },
        {
          id: 'warm',
          label: 'В тёплом помещении, 25 °C',
          effects: [{ metric: 'aroma', delta: -3 }],
          feedback: 'Добродит быстро, но аромат беднее, а при открывании вино охотнее фонтанирует.',
          quality: 'ok',
          batch: [{ set: { temp: 25 } }, { referment: {} }],
        },
        {
          id: 'cold',
          label: 'В холодном погребе, 8 °C',
          effects: [{ metric: 'stability', delta: -6 }],
          feedback: 'Дрожжи встали: газа мало, сахар остался — и может досбродиться позже, уже у покупателя.',
          quality: 'poor',
          fault: 'Брожение в бутылке встало',
          batch: [{ set: { temp: 8 } }, { referment: {} }],
        },
      ],
    },
    {
      id: 'release',
      phase: 'Выпуск',
      icon: '📦',
      title: 'Осадок и выпуск',
      context:
        'В бутылке остался дрожжевой осадок. Его можно оставить — мутный петнат законен как стиль, — или удалить дегоржажем. Давление сейчас {pressure} бар.',
      audit: true,
      question: 'Как выпускаете?',
      choices: [
        {
          id: 'disgorge',
          label: 'Охладить до 2–4 °C, дегоржировать, добавить немного SO₂, укупорить заново',
          effects: [{ metric: 'purity', delta: 4 }, { metric: 'stability', delta: 3 }, { metric: 'aroma', delta: 2 }, { metric: 'structure', delta: 2 }],
          feedback: 'Чистое прозрачное вино с минимальной защитой. Холод удерживает газ: потери давления минимальны.',
          quality: 'best',
          batch: [{ add: { pressure: -0.3 } }, { so2: 15, bound: 0.2 }],
        },
        {
          id: 'cloudy',
          label: 'Оставить осадок, предупредить на этикетке',
          effects: [{ metric: 'purity', delta: -1 }, { metric: 'structure', delta: 1 }],
          feedback: 'Законный стиль: мутноватое вино с дрожжевыми тонами. Покупателя честно предупреждают.',
          quality: 'ok',
        },
        {
          id: 'warm-open',
          label: 'Дегоржировать тёплым, без охлаждения',
          effects: [{ metric: 'purity', delta: -3 }, { metric: 'structure', delta: -5 }],
          feedback: 'Фонтан: ушла часть вина и газа, в бутылку попал воздух.',
          quality: 'poor',
          fault: 'Потеря газа при дегоржаже',
          batch: [{ add: { pressure: -1.5 } }, { oxygen: 6 }],
        },
      ],
    },
  ],
};

// ───────────────────────────── Аварийные сценарии ─────────────────────────────

const stuck: SimScenario = {
  id: 'crisis-stuck',
  group: 'crisis',
  fixedBatch: true,
  title: 'Брожение встало',
  grape: 'Белое сухое',
  style: 'Остановка на 28 г/л сахара',
  icon: '🛑',
  difficulty: 'Сложный',
  noteStyle: 'white',
  initialMetrics: { stability: 45, purity: 62 },
  intro:
    'Плотность третий день не меняется. В вине ещё {sugar} г/л сахара, спирта уже {alcohol} % об. Погреб холодный, азот съеден, летучая растёт. Оставшийся сахар — корм для микрофлоры порчи, а вино должно было стать сухим.',
  goal: 'Поставить диагноз, перезапустить брожение досуха и защитить вино.',
  batch: { sugar: 28, alcohol: 12.2, pH: 3.4, ta: 6.2, malic: 2.5, yan: 30, freeSO2: 0, totalSO2: 30, temp: 12, va: 0.45, volumeL: 100, phase: 'must' },
  profile: { label: 'Белое сухое, недоброд', color: 'white', dry: true, gPerPct: 16.8, so2Limit: 200, molTarget: 0.8 },
  stages: [
    {
      id: 'diagnose',
      phase: 'Диагноз',
      icon: '🩺',
      title: 'Что делать первым',
      context: 'Плотность стоит, температура в вине {temp} °C, летучая кислотность {va} г/л, YAN {yan} мг/л.',
      data: [
        { label: 'Сахар', value: '{sugar} г/л' },
        { label: 'Спирт', value: '{alcohol} % об.' },
        { label: 'Летучая', value: '{va} г/л' },
        { label: 'Температура', value: '{temp} °C' },
      ],
      question: 'С чего начинаете?',
      choices: [
        {
          id: 'measure',
          label: 'Замерить: плотность, сахар, летучую, температуру в вине, посмотреть дрожжи под микроскопом',
          effects: [{ metric: 'stability', delta: 4 }, { metric: 'aroma', delta: 3 }, { metric: 'freshness', delta: 3 }, { metric: 'structure', delta: 2 }],
          feedback: 'Правильно: причины остановки — холод, голод, спирт, токсины, — и от диагноза зависит лечение.',
          quality: 'best',
        },
        {
          id: 'dump-yeast',
          label: 'Сразу высыпать пачку сухих дрожжей',
          effects: [{ metric: 'stability', delta: -3 }],
          feedback: 'Сухие дрожжи, брошенные прямо в вино с 12 % спирта и токсинами, гибнут или работают вяло. Деньги на ветер.',
          quality: 'poor',
          fault: 'Свежие дрожжи погибли в спирту',
        },
        {
          id: 'wait',
          label: 'Подождать неделю — само пойдёт',
          effects: [{ metric: 'purity', delta: -5 }, { metric: 'stability', delta: -4 }],
          feedback: 'Без защиты и с сахаром летучая кислотность растёт с каждым днём.',
          quality: 'poor',
          batch: [{ add: { va: 0.25 } }],
        },
      ],
    },
    {
      id: 'warm-up',
      phase: 'Условия',
      icon: '🌡️',
      title: 'Температура',
      context: 'Дрожжи в конце брожения особенно чувствительны к холоду. Температура в вине — {temp} °C.',
      question: 'Что с температурой?',
      choices: [
        {
          id: 'warm',
          label: 'Поднять до 18–20 °C нагревателем с датчиком в вине',
          effects: [{ metric: 'stability', delta: 4 }, { metric: 'aroma', delta: 3 }, { metric: 'freshness', delta: 3 }, { metric: 'structure', delta: 2 }],
          feedback: 'Тепло — первое условие рестарта.',
          quality: 'best',
          batch: [{ set: { temp: 20 } }],
        },
        {
          id: 'leave',
          label: 'Оставить как есть',
          effects: [{ metric: 'stability', delta: -4 }],
          feedback: 'При {temp} °C рестарт почти обречён.',
          quality: 'poor',
          fault: 'Рестарт в холоде',
        },
        {
          id: 'hot',
          label: 'Разогреть до 30 °C, чтобы наверняка',
          effects: [{ metric: 'aroma', delta: -4 }, { metric: 'purity', delta: -2 }],
          feedback: 'Перегрев в спирту губит дрожжи и будит бактерии — летучая растёт.',
          quality: 'poor',
          batch: [{ set: { temp: 30 } }, { add: { va: 0.1 } }],
        },
      ],
    },
    {
      id: 'detox',
      phase: 'Подготовка',
      icon: '🧹',
      title: 'Снять токсины',
      context: 'Остановившиеся дрожжи выделяют жирные кислоты, которые тормозят новых. Их связывают дрожжевыми оболочками.',
      reagents: ['rehydration-protector', 'dap'],
      question: 'Как готовите вино к рестарту?',
      choices: [
        {
          id: 'hulls',
          label: 'Дрожжевые оболочки, через сутки — снять с осадка',
          effects: [{ metric: 'stability', delta: 4 }, { metric: 'purity', delta: 2 }, { metric: 'aroma', delta: 3 }, { metric: 'freshness', delta: 3 }, { metric: 'structure', delta: 2 }],
          feedback: 'Оболочки адсорбируют токсины, снятие с осадка убирает мёртвые клетки.',
          quality: 'best',
          batch: [{ oxygen: 1 }],
        },
        {
          id: 'dap',
          label: 'Внести DAP прямо в вино',
          effects: [{ metric: 'stability', delta: -2 }],
          feedback: 'На 12 % спирта минеральный азот уже почти не усваивается — он останется в вине и накормит бактерии.',
          quality: 'poor',
          fault: 'Поздний азот',
        },
        {
          id: 'skip',
          label: 'Ничего, сразу к рестарту',
          effects: [{ metric: 'stability', delta: -1 }],
          feedback: 'Можно, но шанс рестарта ниже.',
          quality: 'ok',
        },
      ],
    },
    {
      id: 'restart',
      phase: 'Рестарт',
      icon: '🔁',
      title: 'Перезапуск брожения',
      context: 'Сейчас в вине {sugar} г/л сахара и {alcohol} % об. спирта.',
      reagents: ['yeast-robust', 'rehydration-protector'],
      question: 'Как перезапускаете?',
      choices: [
        {
          id: 'starter',
          label: 'Закваска спиртоустойчивых дрожжей, приученная к вину порциями',
          detail: 'Сначала вода с сахаром и протектором, затем доливки застрявшего вина 1:1, 1:2…',
          effects: [{ metric: 'stability', delta: 8 }, { metric: 'purity', delta: 2 }, { metric: 'aroma', delta: 3 }, { metric: 'freshness', delta: 3 }, { metric: 'structure', delta: 2 }],
          feedback: 'Классический рестарт: дрожжи успевают привыкнуть к спирту и добирают сахар.',
          quality: 'best',
          batch: [{ set: { tolerance: 16, yan: 140 } }, { ferment: {} }],
        },
        {
          id: 'blend',
          label: 'Влить в активно бродящую партию',
          effects: [{ metric: 'stability', delta: 4 }],
          feedback: 'Работает, если есть подходящая бродящая партия того же стиля: она дотащит сахар.',
          quality: 'ok',
          batch: [{ set: { yan: 120 } }, { ferment: { residual: 3 } }],
        },
        {
          id: 'dry-yeast',
          label: 'Высыпать сухие дрожжи прямо в вино',
          effects: [{ metric: 'stability', delta: -5 }],
          feedback: 'Без адаптации дрожжи в спирту не стартуют: сахар почти весь остаётся.',
          quality: 'poor',
          fault: 'Рестарт не удался',
          batch: [{ set: { yan: 60 } }, { ferment: { residual: 15 } }],
        },
      ],
    },
    {
      ...so2BottlingStage({
        phase: 'Защита',
        target: 0.8,
        title: 'Сульфитация после дображивания',
        note: 'Брожение закончилось — вино нужно сразу защитить: свободного SO₂ почти нет, а пауза открывает дорогу бактериям.',
      }),
      audit: true,
    },
  ],
};

/** Медный купорос раствором 1 %: доза по результату пробы в бокалах. */
function copperStage(targetMg: number): SimStage {
  // CuSO₄·5H₂O: 63,55 / 249,69 = 0,2545 — доля меди в соли
  const cuPerMl = 10 * 0.2545;
  const ml = (b: Batch) => (targetMg * b.volumeL) / cuPerMl;
  return {
    id: 'copper',
    phase: 'Обработка',
    icon: '🧪',
    title: 'Медь по результату пробы',
    context:
      `Проба в бокалах показала: запах уходит при ${comma(targetMg)} мг/л меди. Работаете 1 % раствором медного купороса (CuSO₄·5H₂O): в 1 мл — 10 мг соли, то есть ~2,5 мг меди. Объём — {volume} л. ` +
      'Остаток меди в вине ограничен (в ЕС — 1 мг/л), а избыток грозит медным кассом.',
    data: [
      { label: 'Доза меди', value: `${comma(targetMg)} мг/л` },
      { label: '1 мл раствора', value: '~2,5 мг Cu' },
      { label: 'Объём', value: '{volume} л' },
    ],
    question: 'Сколько миллилитров 1 % раствора внести?',
    choices: [],
    dose: {
      prompt: '1 % раствор медного купороса на {volume} л',
      unit: 'мл',
      formula: 'Медь (мг) = доза (мг/л) × объём (л).\nРаствор (мл) = медь (мг) / 2,545.\n(в 1 мл 1 % раствора 10 мг CuSO₄·5H₂O, меди в соли 25,45 %)',
      expected: ml,
      apply: () => [],
      explain: (b, exp, entered) => {
        const mgL = (entered * cuPerMl) / b.volumeL;
        return (
          `Расчёт: ${comma(targetMg)} × ${b.volumeL} = ${comma(targetMg * b.volumeL, 0)} мг меди; / 2,545 = ${comma(exp)} мл. Вы внесли ~${comma(mgL, 2)} мг/л меди.` +
          (mgL > 1 ? ' Это больше 1 мг/л — предела остатка меди: вино придётся обрабатывать от меди.' : '') +
          '\n' +
          doseVerdict(
            exp,
            entered,
            'Недобор: часть сероводорода останется, запах вернётся.',
            'Перебор: лишняя медь — риск медного касса и металлического привкуса.',
            0,
            'Точно по пробе. Через несколько дней снимите вино с осадка сульфидов меди.'
          )
        );
      },
      effects: {
        exact: [{ metric: 'purity', delta: 10 }, { metric: 'aroma', delta: 4 }],
        close: [{ metric: 'purity', delta: 5 }],
        off: [{ metric: 'purity', delta: -2 }, { metric: 'stability', delta: -4 }],
      },
      faults: { off: 'Медь не по расчёту' },
    },
  };
}

const h2s: SimScenario = {
  id: 'crisis-h2s',
  group: 'crisis',
  fixedBatch: true,
  title: 'Сероводород после брожения',
  grape: 'Белое сухое',
  style: 'Запах тухлых яиц в молодом вине',
  icon: '🥚',
  difficulty: 'Средний',
  noteStyle: 'white',
  initialMetrics: { purity: 40, aroma: 45 },
  intro:
    'Брожение закончилось на азоте {yan} мг/л, и от ёмкости тянет тухлыми яйцами. Пока это свежий сероводород — его ещё можно убрать. Если промедлить, он превратится в меркаптаны и дисульфиды, с которыми справиться намного труднее.',
  goal: 'Определить, что именно пахнет, убрать запах минимально нужной обработкой и защитить вино.',
  batch: { sugar: 1.8, alcohol: 12.5, pH: 3.35, ta: 6.5, malic: 2.8, yan: 20, freeSO2: 8, totalSO2: 35, temp: 16, va: 0.35, volumeL: 100, phase: 'wine' },
  profile: { label: 'Белое сухое, сероводород', color: 'white', dry: true, gPerPct: 16.8, so2Limit: 200, molTarget: 0.8 },
  stages: [
    {
      id: 'diagnose',
      phase: 'Диагноз',
      icon: '🩺',
      title: 'Что именно пахнет',
      context:
        'Тухлые яйца — сероводород; варёная капуста, лук, резина — меркаптаны; сырой лук и чеснок, не уходящие ни от чего, — часто дисульфиды. Медь снимает сероводород и меркаптаны, но не дисульфиды.',
      question: 'Как определяете?',
      choices: [
        {
          id: 'bench',
          label: 'Проба в бокалах: контроль, медь, медь с аскорбиновой кислотой',
          effects: [{ metric: 'purity', delta: 3 }, { metric: 'aroma', delta: 3 }, { metric: 'freshness', delta: 3 }, { metric: 'structure', delta: 2 }],
          feedback: 'Правильно: если запах уходит от одной меди — это сероводород или меркаптаны, если только с аскорбинкой — дисульфиды.',
          quality: 'best',
        },
        {
          id: 'nose',
          label: 'Понюхать и решить по опыту',
          effects: [],
          feedback: 'Опытный нос часто прав, но доза меди «на глаз» — лишний риск.',
          quality: 'ok',
        },
        {
          id: 'copper-blind',
          label: 'Сразу внести медь «на глаз»',
          effects: [{ metric: 'stability', delta: -4 }],
          feedback: 'Без пробы легко перебрать меди или лечить не ту проблему.',
          quality: 'poor',
          fault: 'Медь без пробы',
        },
      ],
    },
    {
      id: 'aerate',
      phase: 'Первая помощь',
      icon: '💨',
      title: 'Переливка',
      context: 'Свежий сероводород летуч: открытая переливка с аэрацией снимает значительную его часть, пока он не связался.',
      question: 'Как переливаете?',
      choices: [
        {
          id: 'open',
          label: 'Открытая переливка с разбрызгиванием, снять с грубого осадка',
          effects: [{ metric: 'purity', delta: 8 }, { metric: 'aroma', delta: 3 }, { metric: 'freshness', delta: 3 }, { metric: 'structure', delta: 2 }],
          feedback: 'Сероводород улетучивается, грубый осадок — его источник — остаётся.',
          quality: 'best',
          batch: [{ oxygen: 6 }],
        },
        {
          id: 'closed',
          label: 'Закрытая переливка под инертом',
          effects: [{ metric: 'purity', delta: 2 }],
          feedback: 'Осадок сняли, но без кислорода сероводород почти весь остался в вине.',
          quality: 'ok',
          batch: [{ oxygen: 1 }],
        },
        {
          id: 'leave',
          label: 'Оставить на грубом осадке',
          effects: [{ metric: 'purity', delta: -8 }],
          feedback: 'Сероводород связывается в меркаптаны — запах станет стойким.',
          quality: 'poor',
          fault: 'Меркаптаны: сероводород связался',
        },
      ],
    },
    copperStage(0.2),
    {
      ...so2BottlingStage({
        phase: 'Защита',
        target: 0.8,
        title: 'Сульфитация после обработки',
        note: 'Через несколько дней вино сняли с осадка сульфидов меди. Теперь его нужно защитить.',
      }),
      audit: true,
    },
  ],
};

const brett: SimScenario = {
  id: 'crisis-brett',
  group: 'crisis',
  fixedBatch: true,
  fixedVolume: true,
  title: 'Brettanomyces в бочке',
  grape: 'Красное сухое',
  style: 'Тона конюшни и пластыря в выдержке',
  icon: '🐴',
  difficulty: 'Сложный',
  noteStyle: 'red',
  initialMetrics: { purity: 45, stability: 45 },
  intro:
    'На дегустации бочки — лёгкие тона пластыря и кожи. pH {pH}, свободного SO₂ {free} мг/л: молекулярной защиты почти нет. Brettanomyces образует 4-этилфенол, убрать который из вина практически нельзя. Цель — остановить рост, пока дефект не стал выраженным.',
  goal: 'Подтвердить Brett анализом, остановить его и не дать заразить другие бочки.',
  batch: { sugar: 1.2, alcohol: 13.8, pH: 3.75, ta: 5.2, malic: 0.1, yan: 10, freeSO2: 12, totalSO2: 60, temp: 18, va: 0.55, volumeL: 225, phase: 'wine' },
  profile: { label: 'Красное, бочка 225 л', color: 'red', dry: true, gPerPct: 18, so2Limit: 150, molTarget: 0.5 },
  stages: [
    {
      id: 'diagnose',
      phase: 'Диагноз',
      icon: '🩺',
      title: 'Подтвердить',
      context: 'Похожие тона дают и другие дефекты. Анализ на 4-этилфенол и 4-этилгваякол или микробиологический тест показывают, есть ли Brett и сколько.',
      question: 'Что делаете?',
      choices: [
        {
          id: 'lab',
          label: 'Анализ на этилфенолы и тест на Brettanomyces',
          effects: [{ metric: 'stability', delta: 3 }, { metric: 'aroma', delta: 3 }, { metric: 'freshness', delta: 3 }, { metric: 'structure', delta: 2 }],
          feedback: 'Цифры дают точку отсчёта: можно оценить, насколько далеко зашло, и проверять потом результат.',
          quality: 'best',
        },
        {
          id: 'nose',
          label: 'Довериться носу',
          effects: [],
          feedback: 'Нос замечает Brett, когда этилфенолов уже много. Без анализа не узнать, помогли ли меры.',
          quality: 'ok',
        },
        {
          id: 'ignore',
          label: 'Это «терруар», оставить',
          effects: [{ metric: 'purity', delta: -8 }],
          feedback: 'Brett продолжит расти, и тона станут доминирующими.',
          quality: 'poor',
          fault: 'Brettanomyces развивается',
          batch: [{ add: { va: 0.1 } }],
        },
      ],
    },
    {
      id: 'isolate',
      phase: 'Изоляция',
      icon: '🚧',
      title: 'Вино и бочка',
      context: 'Brett живёт в древесине бочки на глубину нескольких миллиметров. Пока вино в этой бочке, оно заражается снова.',
      question: 'Что делаете с бочкой?',
      choices: [
        {
          id: 'move',
          label: 'Перелить в нержавейку, бочку отпарить и вывести из оборота, снизить температуру',
          effects: [{ metric: 'stability', delta: 6 }, { metric: 'aroma', delta: 3 }, { metric: 'freshness', delta: 3 }, { metric: 'structure', delta: 2 }],
          feedback: 'Вино ушло от источника, температура ниже — Brett растёт медленнее.',
          quality: 'best',
          batch: [{ oxygen: 3 }, { set: { temp: 13 } }],
        },
        {
          id: 'topup',
          label: 'Оставить в бочке, но доливать регулярно',
          effects: [{ metric: 'stability', delta: 1 }],
          feedback: 'Доливки убирают кислород, но источник остаётся в древесине.',
          quality: 'ok',
        },
        {
          id: 'rotate',
          label: 'Перелить в другую бочку из той же партии',
          effects: [{ metric: 'stability', delta: -4 }],
          feedback: 'Заражение переходит в чистую бочку.',
          quality: 'poor',
          fault: 'Заражена вторая бочка',
        },
      ],
    },
    so2BottlingStage({
      phase: 'Защита',
      target: 0.6,
      title: 'Подавление Brett: расчёт навески',
      note: 'Brett подавляют молекулярным SO₂: для красного с этим риском ориентир выше обычного — 0,6 мг/л. При высоком pH это много свободного SO₂.',
    }),
    {
      id: 'finish',
      phase: 'Выход',
      icon: '🧫',
      title: 'Добить и решить судьбу вина',
      context: 'SO₂ подавил рост, но живые клетки могут остаться. 4-этилфенол, который уже образовался, никуда не денется.',
      audit: true,
      reagents: ['chitosan'],
      question: 'Что дальше?',
      choices: [
        {
          id: 'filter',
          label: 'Хитозан или стерилизующая фильтрация, контроль анализом через месяц',
          effects: [{ metric: 'stability', delta: 6 }, { metric: 'purity', delta: 2 }, { metric: 'aroma', delta: 3 }, { metric: 'freshness', delta: 3 }, { metric: 'structure', delta: 2 }],
          feedback: 'Клетки удалены, повторный анализ покажет, остановлен ли процесс.',
          quality: 'best',
          batch: [{ oxygen: 3 }],
        },
        {
          id: 'blend',
          label: 'Купажировать с чистым вином, чтобы разбавить ниже порога',
          effects: [{ metric: 'purity', delta: 3 }],
          feedback: 'Разбавление снижает заметность тонов, но если Brett жив — он заразит и купаж.',
          quality: 'ok',
          batch: [{ oxygen: 3 }],
        },
        {
          id: 'bottle',
          label: 'Разлить как есть',
          effects: [{ metric: 'purity', delta: -6 }, { metric: 'stability', delta: -5 }],
          feedback: 'Brett продолжит работать и в бутылке.',
          quality: 'poor',
          fault: 'Brett в бутылке',
        },
      ],
    },
  ],
};

const oxidation: SimScenario = {
  id: 'crisis-oxidation',
  group: 'crisis',
  fixedBatch: true,
  title: 'Окисление',
  grape: 'Белое сухое',
  style: 'Побурение и тона яблока',
  icon: '🍂',
  difficulty: 'Средний',
  noteStyle: 'white',
  initialMetrics: { aroma: 42, purity: 52, freshness: 48 },
  intro:
    'Ёмкость простояла неполной. Вино пожелтело в сторону соломы, в аромате — печёное яблоко и орех (ацетальдегид). Свободного SO₂ {free} мг/л. Свежесть уже не вернуть, но можно остановить процесс и спасти то, что осталось.',
  goal: 'Остановить доступ кислорода, защитить вино и смягчить окислительные тона.',
  batch: { sugar: 1.5, alcohol: 12.3, pH: 3.45, ta: 6, malic: 2, yan: 10, freeSO2: 2, totalSO2: 45, temp: 16, va: 0.4, volumeL: 100, phase: 'wine' },
  profile: { label: 'Белое сухое, окисленное', color: 'white', dry: true, gPerPct: 16.8, so2Limit: 200, molTarget: 0.8 },
  stages: [
    {
      id: 'stop-oxygen',
      phase: 'Первая помощь',
      icon: '🛢️',
      title: 'Убрать воздух',
      context: 'Пока над вином воздушная подушка, окисление продолжается, а на поверхности могут развиться уксусные бактерии и плёнка.',
      question: 'Что делаете?',
      choices: [
        {
          id: 'top-up',
          label: 'Долить доверху или перелить в меньшую ёмкость, продуть инертным газом',
          effects: [{ metric: 'stability', delta: 6 }, { metric: 'purity', delta: 2 }, { metric: 'aroma', delta: 3 }, { metric: 'freshness', delta: 3 }, { metric: 'structure', delta: 2 }],
          feedback: 'Без кислорода окисление останавливается.',
          quality: 'best',
        },
        {
          id: 'lid',
          label: 'Закрыть крышкой плотнее',
          effects: [{ metric: 'stability', delta: 1 }],
          feedback: 'Лучше, чем ничего, но воздух в ёмкости остался.',
          quality: 'ok',
          batch: [{ oxygen: 2 }],
        },
        {
          id: 'leave',
          label: 'Оставить как есть до розлива',
          effects: [{ metric: 'purity', delta: -6 }, { metric: 'stability', delta: -4 }],
          feedback: 'Окисление идёт дальше, на поверхности — уксусные бактерии.',
          quality: 'poor',
          fault: 'Уксусные бактерии на поверхности',
          batch: [{ oxygen: 3 }, { add: { va: 0.2 } }],
        },
      ],
    },
    so2BottlingStage({
      phase: 'Защита',
      target: 0.8,
      title: 'Сульфитация окисленного вина',
      note: 'Сернистая остановит дальнейшее окисление и свяжет часть ацетальдегида. Учтите: ацетальдегид заберёт часть внесённого — через 3–5 суток свободный SO₂ перемеряют и при необходимости добавляют.',
    }),
    {
      id: 'fining',
      phase: 'Обработка',
      icon: '🧪',
      title: 'Смягчить окисленные тона',
      context: 'Окисленные фенолы дают желтизну и горечь. Их частично снимает оклейка.',
      reagents: ['pvpp', 'bentonite'],
      question: 'Как обрабатываете?',
      choices: [
        {
          id: 'pvpp',
          label: 'Пробная оклейка ПВПП, затем минимальная рабочая доза',
          effects: [{ metric: 'aroma', delta: 4 }, { metric: 'purity', delta: 4 }, { metric: 'aroma', delta: 3 }, { metric: 'freshness', delta: 3 }, { metric: 'structure', delta: 2 }],
          feedback: 'ПВПП снимает окисляемые фенолы: цвет светлеет, горечь уходит.',
          quality: 'best',
          batch: [{ oxygen: 3 }],
        },
        {
          id: 'none',
          label: 'Не обрабатывать',
          effects: [],
          feedback: 'Тона останутся, но и лишних потерь нет.',
          quality: 'ok',
        },
        {
          id: 'heavy',
          label: 'Большая доза без пробы',
          effects: [{ metric: 'aroma', delta: -4 }, { metric: 'structure', delta: -4 }],
          feedback: 'Вместе с окисленными фенолами ушло и то немногое, что было хорошего.',
          quality: 'poor',
          fault: 'Переоклейка',
          batch: [{ oxygen: 4 }],
        },
      ],
    },
    {
      id: 'decide',
      phase: 'Выход',
      icon: '🧭',
      title: 'Судьба партии',
      context: 'Вино защищено и стабилизировано, но свежесть потеряна.',
      audit: true,
      question: 'Что делаете с партией?',
      choices: [
        {
          id: 'blend',
          label: 'Ввести небольшой долей в купаж со свежим вином после пробных купажей',
          effects: [{ metric: 'freshness', delta: 4 }, { metric: 'aroma', delta: 3 }, { metric: 'aroma', delta: 3 }, { metric: 'freshness', delta: 3 }, { metric: 'structure', delta: 2 }],
          feedback: 'В малой доле окисленные тона растворяются в купаже — партия спасена без ущерба для основного вина.',
          quality: 'best',
          batch: [{ oxygen: 2 }],
        },
        {
          id: 'quick',
          label: 'Разлить и продать быстро как простое столовое',
          effects: [{ metric: 'freshness', delta: -2 }],
          feedback: 'Честный вариант: вино без претензий, но и без дефектов.',
          quality: 'ok',
          batch: [{ oxygen: 2 }],
        },
        {
          id: 'mask',
          label: 'Замаскировать сахаром',
          effects: [{ metric: 'purity', delta: -4 }, { metric: 'stability', delta: -5 }],
          feedback: 'Сахар окисление не прячет, а для сухого вина добавленный сахар — субстрат для микрофлоры.',
          quality: 'poor',
          fault: 'Маскировка дефекта',
          batch: [{ add: { sugar: 8 } }],
        },
      ],
    },
  ],
};

export const extraCycleScenarios: SimScenario[] = [sparkling, petnat];
export const crisisScenarios: SimScenario[] = [stuck, h2s, brett, oxidation];

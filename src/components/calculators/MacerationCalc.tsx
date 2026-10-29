import { useId, useState } from 'react';
import { num } from './num';

const DISCLAIMER = 'Ориентир, не норматив — все значения требуют калибровки под конкретный сорт, год, технологическое оборудование и регламент предприятия.';

interface MacData {
  minDays: number;
  maxDays: number;
  notes: string[];
}

type Style = 'light' | 'medium' | 'full';
type Method = 'open' | 'closed' | 'remontage' | 'pigeage' | 'batonnage';

const macTable: Record<string, Record<Style, MacData>> = {
  'Каберне Совиньон': {
    light:  { minDays: 4,  maxDays: 7,  notes: ['Короткая мацерация, типична для розе или лёгкого красного', 'Контролируйте экстракцию зелёных таннинов'] },
    medium: { minDays: 8,  maxDays: 14, notes: ['Классический стиль Каберне', 'Рекомендуется ремонтаж 2–3×/день (ориентир)'] },
    full:   { minDays: 15, maxDays: 21, notes: ['Интенсивный стиль, максимальная экстракция', 'Требует опытного контроля таннинов', 'Рассмотрите пижаж на пике мацерации'] },
  },
  'Саперави': {
    light:  { minDays: 3,  maxDays: 6,  notes: ['Тейнтурье — даже короткая мацерация даёт глубокий цвет', 'Подходит для розе "самотёк"'] },
    medium: { minDays: 7,  maxDays: 12, notes: ['Достаточно для плотного красного', 'Высокая кислотность — следите за ТК'] },
    full:   { minDays: 13, maxDays: 18, notes: ['Мощный экстрактивный стиль, классика Кагора', 'Возможна тепловая обработка мезги вместо традиционной мацерации'] },
  },
  'Мерло': {
    light:  { minDays: 4,  maxDays: 7,  notes: ['Мягкий стиль, шёлковые таннины', 'Низкая температура → фруктовость'] },
    medium: { minDays: 7,  maxDays: 12, notes: ['Балансированный Мерло', 'Не перемацерируйте — потеря фруктовости'] },
    full:   { minDays: 12, maxDays: 16, notes: ['Структурированный стиль для выдержки', 'Контроль VA при длинной мацерации'] },
  },
  'Другой красный': {
    light:  { minDays: 3,  maxDays: 7,  notes: ['Базовый ориентир для незнакомого сорта', 'Проводите регулярную дегустацию'] },
    medium: { minDays: 7,  maxDays: 14, notes: ['Стандартный режим', 'Ориентируйтесь на дегустацию, не на дни'] },
    full:   { minDays: 14, maxDays: 20, notes: ['Длинная мацерация требует строгого контроля VA', 'Риск нежелательной микробиологии'] },
  },
};

const methodNotes: Record<Method, string> = {
  open:      'Открытый чан обеспечивает лучшую аэрацию, облегчает работу с шапкой.',
  closed:    'Закрытый чан снижает риск окисления, контроль шапки через ремонтаж.',
  remontage: 'Ремонтаж (перекачка с орошением шапки) — мягкое воздействие, типично 2–3× в день (ориентир).',
  pigeage:   'Пижаж (погружение шапки) — интенсивная экстракция, особенно эффективен в первые дни.',
  batonnage: 'Батонаж (взмучивание осадка) — приём для белых и оранжевых вин на выдержке на дрожжевом осадке: периодическое перемешивание обогащает вино маннопротеинами, придаёт объём и округлость текстуры. Не является методом работы с шапкой при мацерации красных вин.',
};

export default function MacerationCalc() {
  const uid = useId();
  const [variety, setVariety] = useState('Каберне Совиньон');
  const [style, setStyle] = useState<Style>('medium');
  const [temp, setTemp] = useState('18');
  const [mustTemp, setMustTemp] = useState('');
  const [method, setMethod] = useState<Method>('remontage');

  const varieties = Object.keys(macTable);
  const styles: { value: Style; label: string }[] = [
    { value: 'light',  label: 'Лёгкий (розе / лёгкое красное)' },
    { value: 'medium', label: 'Средний (классика)' },
    { value: 'full',   label: 'Насыщенный (для выдержки)' },
  ];
  const methods: { value: Method; label: string }[] = [
    { value: 'open',      label: 'Открытый чан' },
    { value: 'closed',    label: 'Закрытый чан' },
    { value: 'remontage', label: 'Ремонтаж' },
    { value: 'pigeage',   label: 'Пижаж' },
    { value: 'batonnage', label: 'Батонаж' },
  ];

  // Считаем при рендере, иначе диапазон дней остаётся от прошлого нажатия
  // рядом с уже изменённой температурой в подписи.
  const base = macTable[variety]?.[style];
  const cellar = num(temp, 18);
  // Экстракцию определяет температура мезги, а не помещения. В активной фазе
  // брожение само греет мезгу на 4–8 °C выше помещения; берём середину, если
  // температуру мезги не измеряли.
  const measured = mustTemp.trim() !== '' && Number.isFinite(parseFloat(mustTemp));
  const must = measured ? num(mustTemp) : cellar + 6;
  let tempAdj = 0;
  if (must < 20) tempAdj = 2;
  else if (must < 24) tempAdj = 1;
  else if (must > 32) tempAdj = -2;
  else if (must > 30) tempAdj = -1;
  const tooCold = must < 20;
  const tooHot = must > 32;
  const result: MacData | null = base
    ? {
        minDays: Math.max(1, base.minDays + tempAdj),
        maxDays: Math.max(2, base.maxDays + tempAdj),
        notes: base.notes,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor={`${uid}-variety`}>Сорт винограда</label>
          <select id={`${uid}-variety`} className="select" value={variety} onChange={e => setVariety(e.target.value)}>
            {varieties.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-style`}>Целевой стиль</label>
          <select id={`${uid}-style`} className="select" value={style} onChange={e => setStyle(e.target.value as Style)}>
            {styles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-temp`}>Температура в погребе/помещении (°C) <span className="text-stone-400 text-xs">(ориентир: 14–22°C)</span></label>
          <input
            id={`${uid}-temp`}
            type="number"
            className="input"
            value={temp}
            min={5}
            max={35}
            onChange={e => setTemp(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-must`}>Температура мезги, если измерена (°C) <span className="text-stone-400 text-xs">(необязательно)</span></label>
          <input
            id={`${uid}-must`}
            type="number"
            className="input"
            value={mustTemp}
            placeholder={`оценка ~${Math.round(cellar + 6)} °C`}
            onChange={e => setMustTemp(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-method`}>Способ работы с мезгой и осадком</label>
          <select id={`${uid}-method`} className="select" value={method} onChange={e => setMethod(e.target.value as Method)}>
            {methods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {result && (
        <div className="space-y-4" aria-live="polite">
          <div className="rounded-xl bg-wine-50 dark:bg-wine-950/30 border border-wine-200 dark:border-wine-800 p-5">
            <div className="text-sm text-wine-700 dark:text-wine-400 font-medium mb-1">Рекомендованный диапазон мацерации</div>
            <div className="text-3xl font-bold text-wine-900 dark:text-wine-200">
              {result.minDays}–{result.maxDays} дней
            </div>
            <div className="text-xs text-wine-600 dark:text-wine-400 mt-1">
              {measured
                ? `По измеренной температуре мезги ${Math.round(must)} °C`
                : `Мезга в активной фазе ~${Math.round(cellar + 4)}–${Math.round(cellar + 8)} °C при помещении ${Math.round(cellar)} °C`}
              {tempAdj !== 0 && ` · поправка ${tempAdj > 0 ? '+' : ''}${tempAdj} дн.`}
            </div>
          </div>

          {tooCold && (
            <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-300">
              Мезга ниже ~20 °C: экстракция идёт медленно, а брожение рискует не стартовать или встать на финише. Нужен подогрев —
              прогреть часть объёма и вернуть в массу, на финише греющий кабель или погружной нагреватель по датчику в вине.
            </div>
          )}
          {tooHot && (
            <div className="rounded-lg border-l-4 border-red-400 bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-800 dark:text-red-300">
              Мезга выше ~32 °C: растёт риск гибели дрожжей, остановки брожения и летучей кислотности, вытягиваются грубые танины.
              Охлаждайте постепенно и чаще работайте с шапкой.
            </div>
          )}

          <div className="rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4">
            <div className="font-medium text-stone-700 dark:text-stone-300 text-sm mb-2">Способ: {methods.find(m => m.value === method)?.label}</div>
            <p className="text-sm text-stone-600 dark:text-stone-400">{methodNotes[method]}</p>
          </div>

          <div className="space-y-2">
            {result.notes.map((note, i) => (
              <div key={i} className="flex gap-2 text-sm text-stone-600 dark:text-stone-400">
                <span className="text-wine-500 flex-shrink-0">•</span>
                <span>{note}</span>
              </div>
            ))}
          </div>

          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-300">
            <strong>⚠️ {DISCLAIMER}</strong>
            <br />
            Ориентируйтесь на регулярную дегустацию и аналитику, а не только на количество дней. Фенольная зрелость сырья, винодельня, год урожая — всё влияет на результат.
            Кинетику мацерации задаёт температура самой мезги. Калькулятор оценивает её как температуру помещения плюс 4–8 °C тепла брожения в активной фазе; если мезгу измеряли, введите её температуру — это точнее. Оптимум экстракции для красных — около 24–30 °C.
          </div>
        </div>
      )}
    </div>
  );
}

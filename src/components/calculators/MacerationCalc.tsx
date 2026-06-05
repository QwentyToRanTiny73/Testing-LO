import { useState } from 'react';

const DISCLAIMER = 'Ориентир, не норматив — все значения требуют калибровки под конкретный сорт, год, технологическое оборудование и регламент предприятия.';

interface MacData {
  minDays: number;
  maxDays: number;
  notes: string[];
}

type Style = 'light' | 'medium' | 'full';
type Method = 'open' | 'closed' | 'remontage' | 'pigeage';

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
};

export default function MacerationCalc() {
  const [variety, setVariety] = useState('Каберне Совиньон');
  const [style, setStyle] = useState<Style>('medium');
  const [temp, setTemp] = useState(28);
  const [method, setMethod] = useState<Method>('remontage');
  const [result, setResult] = useState<MacData | null>(null);

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
  ];

  function calculate() {
    const base = macTable[variety]?.[style];
    if (!base) return;
    // Temperature correction: warmer → slightly shorter (orientation)
    let tempAdj = 0;
    if (temp > 30) tempAdj = -1;
    if (temp > 33) tempAdj = -2;
    if (temp < 22) tempAdj = 1;

    setResult({
      minDays: Math.max(1, base.minDays + tempAdj),
      maxDays: Math.max(2, base.maxDays + tempAdj),
      notes: base.notes,
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Сорт винограда</label>
          <select className="select" value={variety} onChange={e => setVariety(e.target.value)}>
            {varieties.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Целевой стиль</label>
          <select className="select" value={style} onChange={e => setStyle(e.target.value as Style)}>
            {styles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Температура мацерации (°C) <span className="text-stone-400 text-xs">(ориентир: 26–32°C)</span></label>
          <input
            type="number"
            className="input"
            value={temp}
            min={15}
            max={40}
            onChange={e => setTemp(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Способ работы с шапкой</label>
          <select className="select" value={method} onChange={e => setMethod(e.target.value as Method)}>
            {methods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <button onClick={calculate} className="btn-primary">Рассчитать</button>

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl bg-wine-50 dark:bg-wine-950/30 border border-wine-200 dark:border-wine-800 p-5">
            <div className="text-sm text-wine-700 dark:text-wine-400 font-medium mb-1">Рекомендованный диапазон мацерации</div>
            <div className="text-3xl font-bold text-wine-900 dark:text-wine-200">
              {result.minDays}–{result.maxDays} дней
            </div>
            <div className="text-xs text-wine-600 dark:text-wine-400 mt-1">Ориентир с учётом температуры {temp}°C</div>
          </div>

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
            Ориентируйтесь на регулярную дегустацию и аналитику, а не только на количество дней. Фенольная зрелость сырья, виноделен, год урожая — всё влияет на результат.
          </div>
        </div>
      )}
    </div>
  );
}

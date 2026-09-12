import { useId, useState } from 'react';
import { num } from './num';

// «Парк ёмкостей» — планировщик распределения кампании по бродильным ёмкостям.
// Вход: тоннаж по сортам + доли (розе-самотёк, разбавление) + коэффициенты.
// Выход: объём каждого потока и рекомендованный список ёмкостей (объём, кол-во, назначение).
// Все коэффициенты — ориентиры, уточняются по факту переработки.

const DISCLAIMER =
  'Ориентиры, не нормативы. Коэффициент выхода, доля заполнения и множитель мезги зависят от сорта, зрелости, пресса и регламента. Разбавление на лицензированном производстве регулируется законом — под чужой лицензией может быть недопустимо.';

interface Row {
  purpose: string;
  net: number;        // объём вина/сусла, л
  brutto: number;     // с запасом на заполнение, л
  vessel: number;     // рекомендуемый объём ёмкости, л
  count: number;      // количество
  note?: string;
}

export default function VesselParkCalc() {
  const uid = useId();
  // Сырьё, т
  const [tMuscat, setTMuscat] = useState('1.1');
  const [tKokur, setTKokur] = useState('0.9');
  const [tCab, setTCab] = useState('1.0');
  const [tSap, setTSap] = useState('1.0');
  // Коэффициенты (ориентиры)
  const [yield_, setYield] = useState('700');   // л/т
  const [fill, setFill] = useState('78');        // % заполнения бродильной
  const [redFactor, setRedFactor] = useState('1.55'); // красные на мезге ×
  const [rosePct, setRosePct] = useState('10');  // розе-самотёк, %
  const [dilPct, setDilPct] = useState('0');     // разбавление, %

  const y = num(yield_, 0);
  const f = Math.min(Math.max(num(fill, 78), 40), 95) / 100;
  const rf = Math.max(num(redFactor, 1.55), 1);
  const rose = Math.min(Math.max(num(rosePct, 0), 0), 30) / 100;
  const dil = 1 + Math.min(Math.max(num(dilPct, 0), 0), 20) / 100;

  // Объёмы вина/сусла по потокам (нетто)
  const muscatJuice = num(tMuscat) * y * dil;
  const kokurJuice = num(tKokur) * y * dil;
  const cabWine = num(tCab) * y;
  const sapWine = num(tSap) * y;

  const roseVol = (cabWine * rose + sapWine * rose) * dil;
  const cabRed = cabWine * (1 - rose);
  const sapRed = sapWine * (1 - rose);

  // Занятость ёмкости: белые/розе — по объёму сусла; красные — на мезге ×redFactor
  const capNeed = (occupancy: number) => (f > 0 ? occupancy / f : occupancy);

  function mkRow(purpose: string, net: number, occupancy: number, vessel: number, note?: string): Row {
    const brutto = capNeed(occupancy);
    const count = vessel > 0 ? Math.max(1, Math.ceil(brutto / vessel)) : 0;
    return { purpose, net: Math.round(net), brutto: Math.round(brutto), vessel, count, note };
  }

  const rows: Row[] = [
    mkRow('Каберне на мезге', cabRed, cabRed * rf, 1500, 'красное на мезге ×' + rf.toFixed(2)),
    mkRow('Саперави на мезге', sapRed, sapRed * rf, 1500, 'красное на мезге ×' + rf.toFixed(2)),
    mkRow('Мускат (брожение → хранение)', muscatJuice, muscatJuice, 1000),
    mkRow('Кокур + резерв белого', kokurJuice, kokurJuice, 800),
    mkRow('Розе (купаж)', roseVol, roseVol, 300, 'плюс 150 л ×2 для раздельного самотёка/отстоя'),
  ];

  const totalNet = Math.round(muscatJuice + kokurJuice + cabRed + sapRed + roseVol);
  const totalVessels = rows.reduce((s, r) => s + r.count, 0);

  // Функция, а не компонент: как компонент поле пересоздавалось бы на каждый
  // символ и теряло фокус.
  const numField = (key: string, label: string, val: string, set: (v: string) => void, hint?: string, step = '0.1') => {
    const id = `${uid}-${key}`;
    return (
      <div>
        <label className="label" htmlFor={id}>{label}</label>
        <input id={id} type="number" className="input" value={val} min={0} step={step} onChange={(e) => set(e.target.value)} />
        {hint && <p className="text-xs text-stone-400 mt-1">{hint}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Сырьё */}
      <div>
        <div className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Сырьё кампании (тонны)</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {numField('muscat', 'Мускат, т', tMuscat, setTMuscat)}
          {numField('kokur', 'Кокур, т', tKokur, setTKokur)}
          {numField('cab', 'Каберне, т', tCab, setTCab)}
          {numField('sap', 'Саперави, т', tSap, setTSap)}
        </div>
      </div>

      {/* Коэффициенты */}
      <div>
        <div className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Коэффициенты (ориентиры)</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {numField('yield', 'Выход, л/т', yield_, setYield, 'ориентир 650–750 л/т', '10')}
          {numField('fill', 'Заполнение бродильной, %', fill, setFill, 'запас на шапку/пену', '1')}
          {numField('redfactor', 'Красные на мезге, ×', redFactor, setRedFactor, 'объём мезги к вину', '0.05')}
          {numField('rose', 'Розе-самотёк, %', rosePct, setRosePct, 'съём с каждого красного', '1')}
          {numField('dilution', 'Разбавление, %', dilPct, setDilPct, 'см. дисклеймер о легальности', '1')}
        </div>
      </div>

      {/* Результат */}
      <div className="grid grid-cols-2 gap-4" aria-live="polite">
        <div className="rounded-xl bg-wine-50 dark:bg-wine-950/30 border border-wine-200 dark:border-wine-800 p-4">
          <div className="text-2xl font-bold text-wine-800 dark:text-wine-300">{totalNet} л</div>
          <div className="text-xs text-wine-600 dark:text-wine-400 mt-1">Суммарный объём вина/сусла</div>
        </div>
        <div className="rounded-xl bg-wine-700 dark:bg-wine-800 p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalVessels}</div>
          <div className="text-xs text-wine-200 mt-1">Ёмкостей в парке (рекомендация)</div>
        </div>
      </div>

      {/* Таблица ёмкостей */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400">
              <th className="text-left py-2 px-3 font-medium">Назначение</th>
              <th className="text-right py-2 px-3 font-medium">Объём, л</th>
              <th className="text-right py-2 px-3 font-medium">С запасом, л</th>
              <th className="text-right py-2 px-3 font-medium">Ёмкость</th>
              <th className="text-right py-2 px-3 font-medium">Кол-во</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.purpose} className="border-b border-stone-100 dark:border-stone-800 align-top">
                <td className="py-2 px-3">
                  <div className="text-stone-700 dark:text-stone-200">{r.purpose}</div>
                  {r.note && <div className="text-[11px] text-stone-400">{r.note}</div>}
                </td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{r.net}</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums text-stone-500">{r.brutto}</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">{r.vessel} л</td>
                <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-wine-700 dark:text-wine-400">×{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-stone-600 dark:text-stone-400 space-y-1">
        <p>• «С запасом» — объём с учётом заполнения бродильной на {Math.round(f * 100)} %; красные посчитаны на мезге (×{rf.toFixed(2)}).</p>
        <p>• Розе-самотёк снимается с красных и уменьшает их объём; для раздельного отстоя удобны малые ёмкости 150 л.</p>
        <p>• Запасы на мезгу и на заполнение частично перекрываются: множитель ×1,5–1,6 у многих поставщиков уже включает место под шапку. Расчёт получается консервативным — при подборе реального парка сверяйтесь с практикой (распространённый ориентир — около 950 л бродильной на тонну красного).</p>
      </div>

      <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-300">
        <strong>⚠️ {DISCLAIMER}</strong>
      </div>
    </div>
  );
}

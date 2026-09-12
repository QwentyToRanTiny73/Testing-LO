import { useId, useState } from 'react';
import { num } from './num';

export default function AcidCalc() {
  const [currentTA, setCurrentTA] = useState('6.5');
  const [targetTA, setTargetTA] = useState('7.5');
  const [volumeL, setVolumeL] = useState('1000');
  const [mode, setMode] = useState<'acidify' | 'deacidify'>('acidify');
  const uid = useId();

  // Результат выводится при рендере, а не хранится в состоянии: иначе карточка
  // показывает навеску от прошлого расчёта рядом с уже изменённым объёмом.
  const volume = num(volumeL);
  const diff = Math.abs(num(targetTA) - num(currentTA));
  // Раскисление: ~0,9 г/л KHCO₃ на каждый 1 г/л снижения ТК (AWRI).
  // 0,67 г/л — коэффициент для карбоната кальция, не для бикарбоната калия.
  const grams = mode === 'acidify' ? diff * volume : diff * volume * 0.9;
  const reagent = mode === 'acidify' ? 'винная кислота (L-tartaric acid)' : 'бикарбонат калия (KHCO₃)';

  return (
    <div className="space-y-5">
      <div className="flex gap-3 mb-2">
        <button
          onClick={() => setMode('acidify')}
          aria-pressed={mode === 'acidify'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'acidify' ? 'bg-wine-700 text-white' : 'btn-secondary'}`}
        >
          Подкисление
        </button>
        <button
          onClick={() => setMode('deacidify')}
          aria-pressed={mode === 'deacidify'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'deacidify' ? 'bg-wine-700 text-white' : 'btn-secondary'}`}
        >
          Раскисление
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label" htmlFor={`${uid}-current`}>Текущая ТК (г/л по винной)</label>
          <input id={`${uid}-current`} type="number" className="input" value={currentTA} step={0.1}
            onChange={e => setCurrentTA(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-target`}>Целевая ТК (г/л)</label>
          <input id={`${uid}-target`} type="number" className="input" value={targetTA} step={0.1}
            onChange={e => setTargetTA(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-volume`}>Объём (л)</label>
          <input id={`${uid}-volume`} type="number" className="input" value={volumeL} min={1}
            onChange={e => setVolumeL(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3" aria-live="polite">
        <div className="rounded-xl bg-wine-50 dark:bg-wine-950/30 border border-wine-200 dark:border-wine-800 p-4">
          <div className="text-2xl font-bold text-wine-800 dark:text-wine-300">{grams.toFixed(0)} г</div>
          <div className="text-sm text-wine-600 dark:text-wine-400 mt-1">{reagent} на {volume} л</div>
        </div>
        <p className="text-xs text-stone-400">
          Коэффициенты — ориентиры. Для раскисления взято 0,9 г/л KHCO₃ на 1 г/л снижения ТК: значение
          предполагает последующее выпадение гидротартрата калия, без холодной стабилизации эффект ближе
          к 1,3 г/л. Для карбоната кальция коэффициент другой — 0,67 г/л. Подкисление винной кислотой
          тоже частично отыгрывается назад: после выпадения КГТ прирост ТК обычно меньше внесённого
          на 0,1–0,3 г/л. KHCO₃ поднимает pH и может стимулировать ЯМБ. Раскисление проводите поэтапно,
          контролируя ТК и pH после каждого добавления.
        </p>
      </div>
    </div>
  );
}

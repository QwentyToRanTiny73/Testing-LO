import { useId, useState } from 'react';
import { num } from './num';
import { tartaricGrams, khco3Grams, KHCO3_PER_TA, EU_ACID_LIMIT } from '../../lib/enology';

type Mode = 'acidify' | 'deacidify';
type Stage = 'must' | 'wine';

export default function AcidCalc() {
  const [currentTA, setCurrentTA] = useState('6.5');
  const [targetTA, setTargetTA] = useState('7.5');
  const [volumeL, setVolumeL] = useState('100');
  const [mode, setMode] = useState<Mode>('acidify');
  const [stage, setStage] = useState<Stage>('must');
  const uid = useId();

  const volume = num(volumeL);
  const cur = num(currentTA);
  const tgt = num(targetTA);
  // Направление важно: раньше разница бралась по модулю, и при целевой ТК выше
  // текущей режим «раскисление» всё равно выдавал навеску бикарбоната
  const delta = mode === 'acidify' ? tgt - cur : cur - tgt;
  const wrongDirection = delta <= 0;
  const grams = wrongDirection ? 0 : mode === 'acidify' ? tartaricGrams(volume, delta) : khco3Grams(volume, delta);
  const reagent = mode === 'acidify' ? 'винной кислоты (L-винная)' : 'бикарбоната калия (KHCO₃)';

  const euLimit =
    mode === 'acidify'
      ? stage === 'must' ? EU_ACID_LIMIT.acidifyMust : EU_ACID_LIMIT.acidifyWine
      : stage === 'wine' ? EU_ACID_LIMIT.deacidifyWine : undefined;
  const overEU = !wrongDirection && euLimit !== undefined && delta > euLimit;
  const tooLowTarget = mode === 'deacidify' && !wrongDirection && tgt < 5;
  // После выпадения гидротартрата калия часть внесённой винной кислоты уходит в осадок
  const keptLow = delta * 0.7;
  const keptHigh = delta * 0.9;

  const toggle = (on: boolean) => `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${on ? 'bg-wine-700 text-white' : 'btn-secondary'}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2" role="group" aria-label="Операция">
          <button type="button" onClick={() => setMode('acidify')} aria-pressed={mode === 'acidify'} className={toggle(mode === 'acidify')}>Подкисление</button>
          <button type="button" onClick={() => setMode('deacidify')} aria-pressed={mode === 'deacidify'} className={toggle(mode === 'deacidify')}>Раскисление</button>
        </div>
        <div className="flex gap-2" role="group" aria-label="Что корректируем">
          <button type="button" onClick={() => setStage('must')} aria-pressed={stage === 'must'} className={toggle(stage === 'must')}>Сусло</button>
          <button type="button" onClick={() => setStage('wine')} aria-pressed={stage === 'wine'} className={toggle(stage === 'wine')}>Вино</button>
        </div>
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
        {wrongDirection ? (
          <div className="rounded-xl border border-dashed border-stone-300 dark:border-stone-700 p-4 text-sm text-stone-500 dark:text-stone-400">
            {mode === 'acidify'
              ? 'Целевая ТК не выше текущей — подкисление не нужно. Если кислотность избыточна, переключитесь на раскисление.'
              : 'Целевая ТК не ниже текущей — раскисление не нужно. Если кислотности не хватает, переключитесь на подкисление.'}
          </div>
        ) : (
          <div className="rounded-xl bg-wine-50 dark:bg-wine-950/30 border border-wine-200 dark:border-wine-800 p-4">
            <div className="text-2xl font-bold text-wine-800 dark:text-wine-300">{grams.toFixed(0)} г</div>
            <div className="text-sm text-wine-600 dark:text-wine-400 mt-1">
              {reagent} на {volume} л · изменение ТК на {delta.toFixed(1)} г/л
            </div>
            {mode === 'acidify' && (
              <div className="text-xs text-stone-500 dark:text-stone-400 mt-2">
                После холодной стабилизации реальный прирост ТК обычно {keptLow.toFixed(1)}–{keptHigh.toFixed(1)} г/л: часть кислоты
                выпадает с гидротартратом калия.
              </div>
            )}
          </div>
        )}

        {overEU && (
          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-300">
            Изменение {delta.toFixed(1)} г/л больше ориентира ЕС для {stage === 'must' ? 'сусла' : 'вина'} ({euLimit?.toString().replace('.', ',')} г/л в пересчёте на винную).
            Проверьте допустимость по действующему регламенту и подумайте о купаже вместо разовой коррекции.
          </div>
        )}
        {tooLowTarget && (
          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-300">
            Раскисление ниже ТК ~5 г/л редко оправдано: вино теряет свежесть, а pH поднимается и ослабляет защиту SO₂.
          </div>
        )}

        <p className="text-xs text-stone-400">
          Коэффициенты — ориентиры. Винная кислота: 1 г/л поднимает ТК на 1 г/л. Бикарбонат калия: ~{KHCO3_PER_TA.toString().replace('.', ',')} г/л
          на 1 г/л снижения ТК (AWRI) с учётом последующего выпадения КГТ; без холодной стабилизации эффект ближе к 1,3 г/л.
          Для карбоната кальция коэффициент другой — 0,67 г/л. KHCO₃ поднимает pH и может стимулировать ЯМБ: раскисляйте поэтапно,
          с контролем ТК и pH после каждого внесения. Пределы ЕС (Регламент 1308/2013): подкисление сусла до 1,5 г/л, вина до 2,5 г/л,
          раскисление вина до 1 г/л; в РФ сверяйте с ТР ЕАЭС 047/2018.
        </p>
      </div>
    </div>
  );
}

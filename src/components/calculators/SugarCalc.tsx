import { useId, useState } from 'react';
import { num } from './num';

const SUGAR_TO_ALCOHOL = 0.0595;

export default function SugarCalc() {
  const [currentSugar, setCurrentSugar] = useState('200');
  const [targetSugar, setTargetSugar] = useState('220');
  const [volumeL, setVolumeL] = useState('1000');
  const uid = useId();

  // Выводится при рендере, чтобы результат всегда соответствовал полям ввода.
  const cs = num(currentSugar);
  const ts = num(targetSugar);
  const vl = num(volumeL);
  const diff = Math.max(0, ts - cs);
  const sugarKg = (diff * vl) / 1000;
  const extraAlcohol = diff * SUGAR_TO_ALCOHOL;
  const totalAlcohol = ts * SUGAR_TO_ALCOHOL;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label" htmlFor={`${uid}-current`}>Текущий сахар (г/л)</label>
          <input id={`${uid}-current`} type="number" className="input" value={currentSugar} min={0}
            onChange={e => setCurrentSugar(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-target`}>Целевой сахар (г/л)</label>
          <input id={`${uid}-target`} type="number" className="input" value={targetSugar} min={0}
            onChange={e => setTargetSugar(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-volume`}>Объём (л)</label>
          <input id={`${uid}-volume`} type="number" className="input" value={volumeL} min={1}
            onChange={e => setVolumeL(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3" aria-live="polite">
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <div className="text-2xl font-bold text-wine-700 dark:text-wine-400">{sugarKg.toFixed(2)} кг</div>
            <div className="text-xs text-stone-500 mt-1">Добавить сахара</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-wine-700 dark:text-wine-400">+{extraAlcohol.toFixed(1)}%</div>
            <div className="text-xs text-stone-500 mt-1">Прирост спирта</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-wine-700 dark:text-wine-400">~{totalAlcohol.toFixed(1)}%</div>
            <div className="text-xs text-stone-500 mt-1">Ожид. спирт (ориентир)</div>
          </div>
        </div>
        <p className="text-xs text-stone-400">Коэффициент 0,0595 %об/г×л — ориентир; реальный выход зависит от штамма дрожжей и условий брожения. Шаптализация регулируется законодательством — проверяйте допустимость.</p>
      </div>
    </div>
  );
}

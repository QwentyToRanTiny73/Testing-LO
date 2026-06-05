import { useState } from 'react';

// Simplified: 1 g/L sugar → ~0.0595% alcohol (orientation, varies by yeast/conditions)
const SUGAR_TO_ALCOHOL = 0.0595;

export default function SugarCalc() {
  const [currentSugar, setCurrentSugar] = useState(200);
  const [targetSugar, setTargetSugar] = useState(220);
  const [volumeL, setVolumeL] = useState(1000);
  const [result, setResult] = useState<{ sugarKg: number; extraAlcohol: number; totalAlcohol: number } | null>(null);

  function calculate() {
    const diff = Math.max(0, targetSugar - currentSugar);
    const sugarKg = (diff * volumeL) / 1000;
    const extraAlcohol = diff * SUGAR_TO_ALCOHOL;
    const totalAlcohol = targetSugar * SUGAR_TO_ALCOHOL;
    setResult({ sugarKg, extraAlcohol, totalAlcohol });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Текущий сахар (г/л)</label>
          <input type="number" className="input" value={currentSugar} min={0}
            onChange={e => setCurrentSugar(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Целевой сахар (г/л)</label>
          <input type="number" className="input" value={targetSugar} min={0}
            onChange={e => setTargetSugar(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Объём (л)</label>
          <input type="number" className="input" value={volumeL} min={1}
            onChange={e => setVolumeL(Number(e.target.value))} />
        </div>
      </div>

      <button onClick={calculate} className="btn-primary">Рассчитать</button>

      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center">
              <div className="text-2xl font-bold text-wine-700 dark:text-wine-400">{result.sugarKg.toFixed(2)} кг</div>
              <div className="text-xs text-stone-500 mt-1">Добавить сахара</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-wine-700 dark:text-wine-400">+{result.extraAlcohol.toFixed(1)}%</div>
              <div className="text-xs text-stone-500 mt-1">Прирост спирта</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-wine-700 dark:text-wine-400">~{result.totalAlcohol.toFixed(1)}%</div>
              <div className="text-xs text-stone-500 mt-1">Ожид. спирт (ориентир)</div>
            </div>
          </div>
          <p className="text-xs text-stone-400">Коэффициент 0,0595 %об/г×л — ориентир; реальный выход зависит от штамма дрожжей и условий брожения. Шаптализация регулируется законодательством — проверяйте допустимость.</p>
        </div>
      )}
    </div>
  );
}

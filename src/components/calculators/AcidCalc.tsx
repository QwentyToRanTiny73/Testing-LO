import { useState } from 'react';

export default function AcidCalc() {
  const [currentTA, setCurrentTA] = useState(6.5);
  const [targetTA, setTargetTA] = useState(7.5);
  const [volumeL, setVolumeL] = useState(1000);
  const [mode, setMode] = useState<'acidify' | 'deacidify'>('acidify');
  const [result, setResult] = useState<{ grams: number; reagent: string } | null>(null);

  function calculate() {
    const diff = Math.abs(targetTA - currentTA); // g/L as tartaric eq
    const grams = diff * volumeL; // total grams needed

    if (mode === 'acidify') {
      // Tartaric acid: 1 g/L increases TA by ~1 g/L (as tartaric)
      setResult({ grams, reagent: 'винная кислота (L-tartaric acid)' });
    } else {
      // KHCO3 (potassium bicarbonate): ~0.67 g/L reduces TA by 1 g/L (orientation)
      setResult({ grams: grams * 0.67, reagent: 'бикарбонат калия (KHCO₃)' });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3 mb-2">
        <button
          onClick={() => setMode('acidify')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'acidify' ? 'bg-wine-700 text-white' : 'btn-secondary'}`}
        >
          Подкисление
        </button>
        <button
          onClick={() => setMode('deacidify')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'deacidify' ? 'bg-wine-700 text-white' : 'btn-secondary'}`}
        >
          Раскисление
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Текущая ТК (г/л по винной)</label>
          <input type="number" className="input" value={currentTA} step={0.1}
            onChange={e => setCurrentTA(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Целевая ТК (г/л)</label>
          <input type="number" className="input" value={targetTA} step={0.1}
            onChange={e => setTargetTA(Number(e.target.value))} />
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
          <div className="rounded-xl bg-wine-50 dark:bg-wine-950/30 border border-wine-200 dark:border-wine-800 p-4">
            <div className="text-2xl font-bold text-wine-800 dark:text-wine-300">{result.grams.toFixed(0)} г</div>
            <div className="text-sm text-wine-600 dark:text-wine-400 mt-1">{result.reagent} на {volumeL} л</div>
          </div>
          <p className="text-xs text-stone-400">
            Коэффициенты — ориентиры. KHCO₃ также влияет на pH и может стимулировать ЯМБ. Раскисление проводите поэтапно, контролируя ТК и pH после каждого добавления.
          </p>
        </div>
      )}
    </div>
  );
}

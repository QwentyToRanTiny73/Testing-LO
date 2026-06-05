import { useState } from 'react';

const DISCLAIMER = 'Ориентир. Пробная оклейка — лабораторный тест, результаты которого зависят от конкретного бентонита, состава вина и технологии применения. Всегда проводите пробную оклейку перед рабочей обработкой.';

interface Trial {
  dose: number; // g/hL
  heatStable: boolean;
}

const PRESET_DOSES = [20, 40, 60, 80, 100, 120];

export default function BentoniteCalc() {
  const [trials, setTrials] = useState<Trial[]>(
    PRESET_DOSES.map(dose => ({ dose, heatStable: false }))
  );
  const [volume, setVolume] = useState(1000);
  const [result, setResult] = useState<{ recDose: number; weightKg: number } | null>(null);
  const [customDose, setCustomDose] = useState('');

  function toggleStable(idx: number) {
    setTrials(t => t.map((tr, i) => i === idx ? { ...tr, heatStable: !tr.heatStable } : tr));
  }

  function addCustomDose() {
    const d = Number(customDose);
    if (d > 0 && !trials.find(t => t.dose === d)) {
      setTrials(t => [...t, { dose: d, heatStable: false }].sort((a, b) => a.dose - b.dose));
      setCustomDose('');
    }
  }

  function removeTrial(idx: number) {
    setTrials(t => t.filter((_, i) => i !== idx));
  }

  function calculate() {
    const stable = trials.filter(t => t.heatStable);
    if (stable.length === 0) {
      setResult(null);
      return;
    }
    // Recommended dose = lowest dose that passes heat test + safety margin
    const minStable = Math.min(...stable.map(t => t.dose));
    const recDose = minStable; // g/hL (apply directly; some prefer +10% margin)
    const weightKg = (recDose * volume) / 100 / 1000; // g/hL × hL / 1000 → kg
    setResult({ recDose, weightKg });
  }

  const stableCount = trials.filter(t => t.heatStable).length;

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 text-sm text-stone-600 dark:text-stone-400">
        <strong className="text-stone-800 dark:text-stone-200">Протокол:</strong>
        <ol className="list-decimal ml-4 mt-2 space-y-1 text-xs">
          <li>Приготовьте 5% суспензию бентонита (гидратация 24 ч).</li>
          <li>Отберите пробы вина 100 мл, внесите дозы из таблицы ниже.</li>
          <li>Перемешайте, выдержите при комнатной температуре 30 мин, осветлите.</li>
          <li>Прогрейте пробы при 80°C × 30 мин (ориентир), охладите, оцените прозрачность.</li>
          <li>Отметьте «стабильно» для доз, не давших помутнения.</li>
        </ol>
      </div>

      <div>
        <label className="label">Объём вина (л)</label>
        <input type="number" className="input max-w-xs" value={volume} min={1}
          onChange={e => setVolume(Number(e.target.value))} />
      </div>

      {/* Trial doses table */}
      <div>
        <div className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Результаты пробной оклейки</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-700">
                <th className="text-left py-2 px-3 font-medium text-stone-600 dark:text-stone-400">Доза (г/гл)</th>
                <th className="text-center py-2 px-3 font-medium text-stone-600 dark:text-stone-400">Тепловой тест пройден?</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {trials.map((t, i) => (
                <tr key={t.dose} className="border-b border-stone-100 dark:border-stone-800">
                  <td className="py-2 px-3 font-mono">{t.dose}</td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => toggleStable(i)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto transition-colors
                        ${t.heatStable
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-stone-300 dark:border-stone-600 text-transparent'}`}
                    >
                      ✓
                    </button>
                  </td>
                  <td className="py-2 px-3">
                    <button onClick={() => removeTrial(i)} className="text-stone-300 hover:text-red-400 transition-colors text-xs">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add custom dose */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 max-w-xs">
          <label className="label">Добавить дозу (г/гл)</label>
          <input type="number" className="input" value={customDose} min={1}
            onChange={e => setCustomDose(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomDose()}
          />
        </div>
        <button onClick={addCustomDose} className="btn-secondary mb-0">Добавить</button>
      </div>

      <button onClick={calculate} className="btn-primary" disabled={stableCount === 0}>
        {stableCount === 0 ? 'Отметьте хотя бы одну стабильную дозу' : 'Рассчитать рабочую дозу'}
      </button>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-wine-50 dark:bg-wine-950/30 border border-wine-200 dark:border-wine-800 p-4">
              <div className="text-2xl font-bold text-wine-800 dark:text-wine-300">{result.recDose} г/гл</div>
              <div className="text-xs text-wine-600 dark:text-wine-400 mt-1">Рекомендованная рабочая доза</div>
            </div>
            <div className="rounded-xl bg-wine-700 dark:bg-wine-800 p-4 text-center">
              <div className="text-2xl font-bold text-white">{result.weightKg.toFixed(2)} кг</div>
              <div className="text-xs text-wine-200 mt-1">Навеска на {volume} л</div>
            </div>
          </div>

          <div className="text-sm text-stone-600 dark:text-stone-400 space-y-1">
            <p>• Бентонит вносить в виде 5% суспензии (гидратация ≥24 ч, ориентир) при перемешивании.</p>
            <p>• Предварительно темперируйте бентонитовую суспензию до температуры вина.</p>
            <p>• Некоторые специалисты применяют рабочую дозу +10% к минимальной стабилизирующей (калибруйте по своей практике).</p>
          </div>

          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-300">
            <strong>⚠️ {DISCLAIMER}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

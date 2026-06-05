import { useState } from 'react';

const DISCLAIMER = 'Ориентир, не норматив. Точная потребность зависит от состава вина (связывающие вещества, ацетальдегид, пируват и др.). Калибруйте под свой анализ.';

// Fraction of free SO2 that is molecular at given pH
// [SO2]mol = [SO2]free / (1 + 10^(pH - pKa1))  pKa1 ≈ 1.77 → simplified table
function molecularFraction(pH: number): number {
  const pKa1 = 1.77;
  return 1 / (1 + Math.pow(10, pH - pKa1));
}

// Required free SO2 = target_molecular / fraction
function requiredFreeSO2(targetMolecular: number, pH: number): number {
  const f = molecularFraction(pH);
  if (f <= 0) return 0;
  return targetMolecular / f;
}

// Potassium metabisulfite (K2S2O5) contains ~57.6% SO2 by weight
const K2S2O5_SO2_PCT = 0.576;

export default function SO2Calc() {
  const [pH, setPH] = useState(3.4);
  const [volume, setVolume] = useState(100);
  const [currentFreeSO2, setCurrentFreeSO2] = useState(20);
  const [targetMolecular, setTargetMolecular] = useState(0.6);
  const [result, setResult] = useState<{
    fraction: number;
    requiredFree: number;
    additionNeeded: number;
    kmsGrams: number;
  } | null>(null);

  function calculate() {
    const f = molecularFraction(pH) * 100; // as %
    const reqFree = requiredFreeSO2(targetMolecular, pH);
    const addition = Math.max(0, reqFree - currentFreeSO2);
    // addition in mg/L × volume L / 1000 = g of SO2
    // KMS needed = gSO2 / 0.576
    const kmsGrams = (addition * volume) / K2S2O5_SO2_PCT / 1000;

    setResult({
      fraction: f,
      requiredFree: reqFree,
      additionNeeded: addition,
      kmsGrams: kmsGrams,
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-800 dark:text-blue-300">
        <strong>Формула:</strong><br />
        <code className="block mt-1 font-mono text-xs bg-blue-100 dark:bg-blue-900/30 rounded p-2 mt-2">
          [SO₂]мол = [SO₂]св / (1 + 10^(pH − 1,77))<br/>
          Навеска КМС (г) = добавляемый SO₂ (мг/л) × объём (л) / 1000 / 0,576
        </code>
        <p className="mt-2 text-xs">Молекулярная форма SO₂ — основная антимикробная фракция. Коэффициент 0,576 — содержание SO₂ в метабисульфите калия (ориентир; проверяйте по паспорту конкретного препарата).</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">pH вина</label>
          <input type="number" className="input" value={pH} min={2.8} max={4.5} step={0.05}
            onChange={e => setPH(Number(e.target.value))} />
          <p className="text-xs text-stone-400 mt-1">Диапазон столовых вин: 3,0–3,8 (ориентир)</p>
        </div>
        <div>
          <label className="label">Объём вина (л)</label>
          <input type="number" className="input" value={volume} min={1}
            onChange={e => setVolume(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Текущий свободный SO₂ (мг/л)</label>
          <input type="number" className="input" value={currentFreeSO2} min={0}
            onChange={e => setCurrentFreeSO2(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Целевой молекулярный SO₂ (мг/л)</label>
          <input type="number" className="input" value={targetMolecular} min={0.1} max={2.0} step={0.1}
            onChange={e => setTargetMolecular(Number(e.target.value))} />
          <p className="text-xs text-stone-400 mt-1">Ориентир для большинства вин: 0,5–0,8 мг/л</p>
        </div>
      </div>

      <button onClick={calculate} className="btn-primary">Рассчитать</button>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-stone-100 dark:bg-stone-800 p-3 text-center">
              <div className="text-xl font-bold text-stone-800 dark:text-stone-200">{result.fraction.toFixed(3)}%</div>
              <div className="text-xs text-stone-500 mt-0.5">Доля мол. SO₂</div>
            </div>
            <div className="rounded-lg bg-wine-50 dark:bg-wine-950/30 border border-wine-200 dark:border-wine-800 p-3 text-center">
              <div className="text-xl font-bold text-wine-800 dark:text-wine-300">{result.requiredFree.toFixed(1)}</div>
              <div className="text-xs text-wine-600 dark:text-wine-400 mt-0.5">Нужен своб. SO₂ (мг/л)</div>
            </div>
            <div className="rounded-lg bg-stone-100 dark:bg-stone-800 p-3 text-center">
              <div className="text-xl font-bold text-stone-800 dark:text-stone-200">{result.additionNeeded.toFixed(1)}</div>
              <div className="text-xs text-stone-500 mt-0.5">Добавить SO₂ (мг/л)</div>
            </div>
            <div className="rounded-xl bg-wine-700 dark:bg-wine-800 p-3 text-center">
              <div className="text-xl font-bold text-white">{result.kmsGrams.toFixed(2)} г</div>
              <div className="text-xs text-wine-200 mt-0.5">Навеска КМС на {volume} л</div>
            </div>
          </div>

          {result.additionNeeded <= 0 && (
            <div className="rounded-lg border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 p-3 text-sm text-green-800 dark:text-green-300">
              Текущий уровень свободного SO₂ уже достаточен для достижения цели.
            </div>
          )}

          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-300">
            <strong>⚠️ {DISCLAIMER}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';

// Brix to density: rho ≈ 1 + Brix * 0.004 (orientation, simplified)
// Oechsle = (density - 1) * 1000
// Potential alcohol (% vol) ≈ Brix * 0.575 (orientation, varies)
// Temperature correction for hydrometer calibrated at 20°C: ~0.0007 Brix/°C (very simplified)

function brixToDensity(brix: number) {
  return 1 + brix * 0.004;
}
function brixToOechsle(brix: number) {
  return Math.round((brixToDensity(brix) - 1) * 1000);
}
function brixToAlcohol(brix: number) {
  return brix * 0.575;
}
function oechsleToBrix(oe: number) {
  return oe / 4;
}
function densityToBrix(d: number) {
  return (d - 1) / 0.004;
}

export default function BrixConverter() {
  const [brix, setBrix] = useState('22');
  const [measTemp, setMeasTemp] = useState('20');
  const [calTemp] = useState(20);

  const brixN = parseFloat(brix) || 0;
  const measTempN = parseFloat(measTemp) || 0;
  const tempCorrBrix = brixN + (measTempN - calTemp) * 0.0007;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Brix (рефрактометр)</label>
          <input type="number" className="input" value={brix} step={0.1}
            onChange={e => setBrix(e.target.value)} />
        </div>
        <div>
          <label className="label">Температура измерения (°C)</label>
          <input type="number" className="input" value={measTemp} step={0.5}
            onChange={e => setMeasTemp(e.target.value)} />
          <p className="text-xs text-stone-400 mt-1">Ареометр откалиброван при 20°C</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Brix (скорр.)', value: tempCorrBrix.toFixed(1) },
          { label: 'Oechsle', value: brixToOechsle(tempCorrBrix).toFixed(0) },
          { label: 'Плотность (г/мл)', value: brixToDensity(tempCorrBrix).toFixed(4) },
          { label: 'Потенц. спирт (%)', value: brixToAlcohol(tempCorrBrix).toFixed(1) },
        ].map(item => (
          <div key={item.label} className="card text-center">
            <div className="text-xl font-bold text-wine-700 dark:text-wine-400">{item.value}</div>
            <div className="text-xs text-stone-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-stone-400">Коэффициенты — упрощённые ориентиры. Для точных пересчётов используйте поверенные таблицы ОИВ.</p>
    </div>
  );
}

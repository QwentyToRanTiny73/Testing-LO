import { useId, useState } from 'react';
import { num } from './num';

// Пересчёт шкал сахаристости.
// Brix → плотность: стандартная аппроксимация, пригодная в диапазоне 0–30 °Brix.
// Oechsle = (плотность − 1) × 1000.
// Потенциальный спирт ≈ Brix × 0,575 (ориентир; принятая вилка 0,55–0,60).
// Температурная поправка ареометра, калиброванного на 20 °C: ~0,07 °Brix на °C
// (истинное значение 0,05–0,1 в зависимости от температуры и плотности).

const TEMP_CORR_PER_C = 0.07;

function brixToDensity(brix: number) {
  return 1 + brix / (258.6 - (brix / 258.2) * 227.1);
}
function brixToOechsle(brix: number) {
  return Math.round((brixToDensity(brix) - 1) * 1000);
}
function brixToAlcohol(brix: number) {
  return brix * 0.575;
}

export default function BrixConverter() {
  const [brix, setBrix] = useState('22');
  const [measTemp, setMeasTemp] = useState('20');
  const calTemp = 20;
  const uid = useId();

  const brixN = num(brix);
  // Пустое поле температуры = температура калибровки, то есть поправка нулевая.
  const measTempN = num(measTemp, calTemp);
  const tempCorrBrix = brixN + (measTempN - calTemp) * TEMP_CORR_PER_C;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor={`${uid}-brix`}>Сахаристость (°Brix)</label>
          <input id={`${uid}-brix`} type="number" className="input" value={brix} step={0.1}
            onChange={e => setBrix(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-temp`}>Температура измерения (°C)</label>
          <input id={`${uid}-temp`} type="number" className="input" value={measTemp} step={0.5}
            onChange={e => setMeasTemp(e.target.value)} />
          <p className="text-xs text-stone-400 mt-1">
            Поправка для ареометра, калиброванного при 20 °C. Рефрактометры с автоматической
            термокомпенсацией (ATC) поправки не требуют — оставьте 20 °C.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-live="polite">
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
      <p className="text-xs text-stone-400">
        Коэффициенты — ориентиры. Потенциальный спирт здесь считается по Brix × 0,575; калькулятор
        коррекции сахара использует другую договорённость (0,0595 % об. на г/л), поэтому значения
        могут расходиться на несколько десятых. Для точных пересчётов используйте поверенные таблицы ОИВ.
      </p>
    </div>
  );
}

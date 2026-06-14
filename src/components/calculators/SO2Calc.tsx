import { useState, useMemo } from 'react';

const DISCLAIMER =
  'Ориентир, не норматив. Реальная потребность зависит от состава вина (ацетальдегид, пируват, кетокислоты, сахара) и температуры. После внесения измерьте свободный SO₂ через 24–48 ч и при необходимости откорректируйте.';

// Модель равновесия SO₂. pKa1 сернистой кислоты ≈ 1,81 (при ~20 °C).
// Доля молекулярной формы от свободного SO₂: 1 / (1 + 10^(pH − pKa1)).
const PKA1 = 1.81;

function molecularFraction(pH: number): number {
  return 1 / (1 + Math.pow(10, pH - PKA1));
}

// Реагенты для внесения SO₂.
// pct — массовая доля SO₂ (для твёрдых и газа) или г SO₂ на 100 мл (для растворов, в/о).
type Phase = 'solid' | 'liquid' | 'gas';
interface Reagent {
  id: string;
  name: string;
  pct: number;
  phase: Phase;
  note?: string;
}
const REAGENTS: Reagent[] = [
  { id: 'kms', name: 'Метабисульфит калия (КМС, K₂S₂O₅)', pct: 57.6, phase: 'solid', note: 'добавляет ~0,57 мг K⁺ на мг SO₂' },
  { id: 'sms', name: 'Метабисульфит натрия (Na₂S₂O₅)', pct: 67.4, phase: 'solid', note: 'вносит Na⁺ — учитывать ограничения' },
  { id: 'kbs', name: 'Бисульфит калия (KHSO₃)', pct: 53.3, phase: 'solid' },
  { id: 'sol5', name: 'Раствор SO₂ 5 % (в/о)', pct: 5, phase: 'liquid', note: '5 г SO₂ на 100 мл' },
  { id: 'sol6', name: 'Раствор SO₂ 6 % (в/о)', pct: 6, phase: 'liquid', note: '6 г SO₂ на 100 мл' },
  { id: 'pure', name: 'Газообразный/жидкий SO₂ (100 %)', pct: 100, phase: 'gas' },
];

type Mode = 'free' | 'molecular';

function num(v: string, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function SO2Calc() {
  const [mode, setMode] = useState<Mode>('free');
  const [pH, setPH] = useState(3.4);
  const [volume, setVolume] = useState(100);
  const [currentFree, setCurrentFree] = useState(15);
  const [targetFree, setTargetFree] = useState(30);
  const [targetMolecular, setTargetMolecular] = useState(0.8);
  const [reagentId, setReagentId] = useState('kms');
  const [purity, setPurity] = useState(57.6);
  const [efficiency, setEfficiency] = useState(100); // % внесённого SO₂, остающегося свободным
  const [currentTotal, setCurrentTotal] = useState(80);
  const [maxTotal, setMaxTotal] = useState(200);

  const reagent = REAGENTS.find((r) => r.id === reagentId)!;

  function onReagentChange(id: string) {
    const r = REAGENTS.find((x) => x.id === id)!;
    setReagentId(id);
    setPurity(r.pct);
  }

  const r = useMemo(() => {
    const fraction = molecularFraction(pH); // 0..1
    // Целевой свободный SO₂: либо задан напрямую, либо выводится из целевого молекулярного.
    const reqFree = mode === 'free' ? targetFree : (fraction > 0 ? targetMolecular / fraction : 0);

    const netAddition = Math.max(0, reqFree - currentFree); // мг/л, «чистая» прибавка к свободному
    const eff = Math.min(Math.max(efficiency, 1), 100) / 100;
    const grossAddition = netAddition / eff; // мг/л SO₂ внести с учётом связывания

    // Количество реагента
    const so2Grams = (grossAddition * volume) / 1000; // г чистого SO₂ на весь объём
    const pctFrac = Math.max(purity, 0.0001) / 100;

    let reagentAmount: number; // г (solid/gas) или мл (liquid)
    let reagentPerHl: number;
    let unit: string;
    if (reagent.phase === 'liquid') {
      // purity = г SO₂ на 100 мл → мл = гSO₂ * 100 / purity
      reagentAmount = (so2Grams * 100) / purity;
      reagentPerHl = (grossAddition * 100) / 1000 * 100 / purity; // мл/гл
      unit = 'мл';
    } else {
      reagentAmount = so2Grams / pctFrac;
      reagentPerHl = (grossAddition * 100) / 1000 / pctFrac; // г/гл
      unit = 'г';
    }

    const molAtTarget = reqFree * fraction;
    const molNow = currentFree * fraction;
    const projectedTotal = currentTotal + grossAddition;

    return {
      fraction,
      reqFree,
      netAddition,
      grossAddition,
      reagentAmount,
      reagentPerHl,
      unit,
      molAtTarget,
      molNow,
      projectedTotal,
    };
  }, [mode, pH, volume, currentFree, targetFree, targetMolecular, reagent, purity, efficiency, currentTotal, maxTotal]);

  // Рекомендация по молекулярному SO₂ (ориентир по типу вина)
  const molGuide = pH >= 3.6 ? 'высокий pH — для защиты нужен заметно больший свободный SO₂' : 'умеренный pH';

  return (
    <div className="space-y-6">
      {/* Режим */}
      <div className="inline-flex rounded-xl border border-stone-200 dark:border-stone-700 p-1 bg-stone-100 dark:bg-stone-800">
        <button
          onClick={() => setMode('free')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === 'free' ? 'bg-wine-700 text-white' : 'text-stone-600 dark:text-stone-300'}`}
        >
          Цель — свободный SO₂
        </button>
        <button
          onClick={() => setMode('molecular')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === 'molecular' ? 'bg-wine-700 text-white' : 'text-stone-600 dark:text-stone-300'}`}
        >
          Цель — молекулярный SO₂
        </button>
      </div>

      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-800 dark:text-blue-300">
        {mode === 'free' ? (
          <>
            <strong>Пересчёт «свободный → свободный».</strong> Вы задаёте целевой <em>свободный</em> SO₂ и текущий свободный SO₂;
            калькулятор считает прибавку и навеску реагента. Молекулярная фракция показана справочно — как результат при вашем pH.
          </>
        ) : (
          <>
            <strong>Пересчёт через молекулярный SO₂.</strong> По целевой молекулярной форме и pH вычисляется нужный <em>свободный</em> SO₂,
            затем — прибавка и навеска реагента.
          </>
        )}
        <code className="block mt-2 font-mono text-xs bg-blue-100 dark:bg-blue-900/30 rounded p-2">
          доля молек. = 1 / (1 + 10^(pH − {PKA1}))   ·   прибавка = (цель.своб − тек.своб) / эффективность<br />
          реагент = прибавка(мг/л) × объём(л) / 1000 / (чистота/100)
        </code>
      </div>

      {/* Основные входные данные */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">pH вина</label>
          <input type="number" className="input" value={pH} min={2.8} max={4.5} step={0.01}
            onChange={(e) => setPH(num(e.target.value, pH))} />
          <p className="text-xs text-stone-400 mt-1">{molGuide}</p>
        </div>
        <div>
          <label className="label">Объём вина (л)</label>
          <input type="number" className="input" value={volume} min={1}
            onChange={(e) => setVolume(num(e.target.value, volume))} />
        </div>
        <div>
          <label className="label">Текущий свободный SO₂ (мг/л)</label>
          <input type="number" className="input" value={currentFree} min={0}
            onChange={(e) => setCurrentFree(num(e.target.value, currentFree))} />
          <p className="text-xs text-stone-400 mt-1">По анализу (метод Риппера / аспирация)</p>
        </div>
        {mode === 'free' ? (
          <div>
            <label className="label">Целевой свободный SO₂ (мг/л)</label>
            <input type="number" className="input" value={targetFree} min={0} step={1}
              onChange={(e) => setTargetFree(num(e.target.value, targetFree))} />
            <p className="text-xs text-stone-400 mt-1">При pH {pH.toFixed(2)} это даст ≈ {r.molAtTarget.toFixed(2)} мг/л молекулярного</p>
          </div>
        ) : (
          <div>
            <label className="label">Целевой молекулярный SO₂ (мг/л)</label>
            <input type="number" className="input" value={targetMolecular} min={0.1} max={2.0} step={0.05}
              onChange={(e) => setTargetMolecular(num(e.target.value, targetMolecular))} />
            <p className="text-xs text-stone-400 mt-1">Ориентир: сухие 0,5–0,8 · сладкие/риск Brett до ~1,5</p>
          </div>
        )}
      </div>

      {/* Реагент и лабораторные параметры */}
      <details className="rounded-xl border border-stone-200 dark:border-stone-700 p-4">
        <summary className="cursor-pointer text-sm font-medium text-stone-700 dark:text-stone-300">
          Реагент и лабораторные параметры
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="sm:col-span-2">
            <label className="label">Форма внесения</label>
            <select className="input" value={reagentId} onChange={(e) => onReagentChange(e.target.value)}>
              {REAGENTS.map((rg) => (
                <option key={rg.id} value={rg.id}>{rg.name}</option>
              ))}
            </select>
            {reagent.note && <p className="text-xs text-stone-400 mt-1">{reagent.note}</p>}
          </div>
          <div>
            <label className="label">{reagent.phase === 'liquid' ? 'Концентрация (г SO₂ / 100 мл)' : 'Содержание SO₂ (%)'}</label>
            <input type="number" className="input" value={purity} min={1} max={100} step={0.1}
              onChange={(e) => setPurity(num(e.target.value, purity))} />
            <p className="text-xs text-stone-400 mt-1">Уточняйте по паспорту препарата</p>
          </div>
          <div>
            <label className="label">Эффективность (% остаётся свободным)</label>
            <input type="number" className="input" value={efficiency} min={1} max={100} step={1}
              onChange={(e) => setEfficiency(num(e.target.value, efficiency))} />
            <p className="text-xs text-stone-400 mt-1">100 % — для стабильного вина; молодое/сусло связывает больше — снизьте</p>
          </div>
          <div>
            <label className="label">Текущий общий SO₂ (мг/л)</label>
            <input type="number" className="input" value={currentTotal} min={0}
              onChange={(e) => setCurrentTotal(num(e.target.value, currentTotal))} />
          </div>
          <div>
            <label className="label">Предел общего SO₂ (мг/л)</label>
            <input type="number" className="input" value={maxTotal} min={0}
              onChange={(e) => setMaxTotal(num(e.target.value, maxTotal))} />
            <p className="text-xs text-stone-400 mt-1">Ориентир; зависит от типа вина и норматива</p>
          </div>
        </div>
      </details>

      {/* Результаты */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-stone-100 dark:bg-stone-800 p-3 text-center">
            <div className="text-xl font-bold text-stone-800 dark:text-stone-200">{(r.fraction * 100).toFixed(2)}%</div>
            <div className="text-xs text-stone-500 mt-0.5">Доля молек. при pH {pH.toFixed(2)}</div>
          </div>
          <div className="rounded-lg bg-stone-100 dark:bg-stone-800 p-3 text-center">
            <div className="text-xl font-bold text-stone-800 dark:text-stone-200">{r.reqFree.toFixed(1)}</div>
            <div className="text-xs text-stone-500 mt-0.5">Целевой своб. SO₂ (мг/л)</div>
          </div>
          <div className="rounded-lg bg-stone-100 dark:bg-stone-800 p-3 text-center">
            <div className="text-xl font-bold text-stone-800 dark:text-stone-200">{r.molAtTarget.toFixed(2)}</div>
            <div className="text-xs text-stone-500 mt-0.5">Молек. SO₂ на цели (мг/л)</div>
          </div>
          <div className="rounded-lg bg-wine-50 dark:bg-wine-950/30 border border-wine-200 dark:border-wine-800 p-3 text-center">
            <div className="text-xl font-bold text-wine-800 dark:text-wine-300">{r.grossAddition.toFixed(1)}</div>
            <div className="text-xs text-wine-600 dark:text-wine-400 mt-0.5">Внести SO₂ (мг/л)</div>
          </div>
        </div>

        {r.netAddition <= 0 ? (
          <div className="rounded-lg border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 p-3 text-sm text-green-800 dark:text-green-300">
            Текущий свободный SO₂ ({currentFree} мг/л) уже достигает цели ({r.reqFree.toFixed(1)} мг/л). Внесение не требуется.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-wine-700 dark:bg-wine-800 p-4 text-center sm:col-span-1">
              <div className="text-2xl font-bold text-white">{r.reagentAmount.toFixed(2)} {r.unit}</div>
              <div className="text-xs text-wine-200 mt-0.5">{reagent.name.split('(')[0].trim()} на {volume} л</div>
            </div>
            <div className="rounded-lg bg-stone-100 dark:bg-stone-800 p-4 text-center">
              <div className="text-xl font-bold text-stone-800 dark:text-stone-200">{r.reagentPerHl.toFixed(2)} {r.unit}/гл</div>
              <div className="text-xs text-stone-500 mt-0.5">Дозировка на гектолитр</div>
            </div>
            <div className="rounded-lg bg-stone-100 dark:bg-stone-800 p-4 text-center">
              <div className="text-xl font-bold text-stone-800 dark:text-stone-200">+{r.netAddition.toFixed(1)} мг/л</div>
              <div className="text-xs text-stone-500 mt-0.5">Прирост свободного (нетто)</div>
            </div>
          </div>
        )}

        {/* Контроль общего SO₂ */}
        <div className={`rounded-lg border-l-4 p-3 text-sm ${r.projectedTotal > maxTotal ? 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300' : 'border-stone-300 bg-stone-50 dark:bg-stone-800/40 text-stone-600 dark:text-stone-300'}`}>
          Прогноз общего SO₂ после внесения: <strong>{r.projectedTotal.toFixed(0)} мг/л</strong> (предел {maxTotal} мг/л).
          {r.projectedTotal > maxTotal && ' ⚠️ Превышение предела — уменьшите дозу или цель.'}
        </div>

        <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-300">
          <strong>⚠️ {DISCLAIMER}</strong>
        </div>
      </div>
    </div>
  );
}

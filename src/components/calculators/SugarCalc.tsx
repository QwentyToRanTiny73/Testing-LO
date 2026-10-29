import { useId, useState } from 'react';
import { num } from './num';
import { chaptalizationKg, potentialAlcohol, SUGAR_PER_PCT_VOL, SUCROSE_L_PER_KG, EU_ENRICHMENT_LIMIT } from '../../lib/enology';

type Style = 'white' | 'red';

export default function SugarCalc() {
  const [currentSugar, setCurrentSugar] = useState('200');
  const [targetSugar, setTargetSugar] = useState('220');
  const [volumeL, setVolumeL] = useState('100');
  const [style, setStyle] = useState<Style>('white');
  const uid = useId();

  const cs = num(currentSugar);
  const ts = num(targetSugar);
  const vl = num(volumeL);
  const gPerPct = SUGAR_PER_PCT_VOL[style];

  // Навеска с учётом того, что растворённый сахар сам увеличивает объём
  const sugarKg = chaptalizationKg(vl, cs, ts);
  // Как считали раньше — без прироста объёма — для сравнения
  const naiveKg = Math.max(0, ((ts - cs) * vl) / 1000);
  const finalVolume = vl + sugarKg * SUCROSE_L_PER_KG;
  const extraAlcohol = potentialAlcohol(Math.max(0, ts - cs), gPerPct);
  const totalAlcohol = potentialAlcohol(ts, gPerPct);
  const needed = ts > cs;
  const overEU = extraAlcohol > EU_ENRICHMENT_LIMIT.A;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Тип вина">
        {([['white', 'Белое / розе'], ['red', 'Красное']] as const).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setStyle(v)}
            aria-pressed={style === v}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${style === v ? 'bg-wine-700 text-white' : 'btn-secondary'}`}
          >
            {label}
          </button>
        ))}
      </div>

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
          <label className="label" htmlFor={`${uid}-volume`}>Объём сусла (л)</label>
          <input id={`${uid}-volume`} type="number" className="input" value={volumeL} min={1}
            onChange={e => setVolumeL(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3" aria-live="polite">
        {!needed ? (
          <div className="rounded-xl border border-dashed border-stone-300 dark:border-stone-700 p-4 text-sm text-stone-500 dark:text-stone-400">
            Целевой сахар не выше текущего — сахар добавлять не нужно. Потенциальный спирт сусла сейчас ~{potentialAlcohol(cs, gPerPct).toFixed(1)} % об.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card text-center">
                <div className="text-2xl font-bold text-wine-700 dark:text-wine-400">{sugarKg.toFixed(2)} кг</div>
                <div className="text-xs text-stone-500 mt-1">Добавить сахара</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-wine-700 dark:text-wine-400">{Math.round(finalVolume)} л</div>
                <div className="text-xs text-stone-500 mt-1">Объём после растворения</div>
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
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Без учёта прироста объёма вышло бы {naiveKg.toFixed(2)} кг — на {(sugarKg - naiveKg).toFixed(2)} кг
              ({naiveKg > 0 ? Math.round(((sugarKg - naiveKg) / naiveKg) * 100) : 0} %) меньше нужного: растворённый сахар
              занимает ~{SUCROSE_L_PER_KG.toString().replace('.', ',')} л на килограмм и сам разбавляет сусло.
            </p>
            {overEU && (
              <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-300">
                Прирост {extraAlcohol.toFixed(1)} % об. больше любого предела обогащения в ЕС (3 / 2 / 1,5 % об. по винодельческим зонам A / B / C).
              </div>
            )}
          </>
        )}
        <p className="text-xs text-stone-400">
          Выход спирта — ориентир: {SUGAR_PER_PCT_VOL.white.toString().replace('.', ',')} г/л сахара на 1 % об. для белых и розе,
          ~{SUGAR_PER_PCT_VOL.red} г/л для красных (у брожения на мезге больше потерь); реальный выход зависит от штамма и условий.
          Шаптализация регулируется законодательством: в ЕС пределы обогащения 1,5–3 % об. по зонам, в РФ — сверяйте с ТР ЕАЭС 047/2018.
        </p>
      </div>
    </div>
  );
}

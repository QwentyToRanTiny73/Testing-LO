import { useState, useEffect, useRef, useId } from 'react';
import {
  scenarios as allScenarios,
  METRICS,
  INITIAL_METRICS,
  medalForScore,
  type SimScenario,
  type SimChoice,
  type SimStage,
  type MetricKey,
} from '../../data/simulation';
import { ReagentChips, ReagentDialog } from './ReagentInfo';
import {
  VINTAGES,
  pickVintage,
  applyVintage,
  applyOps,
  evaluateRules,
  molecular,
  fillBatch,
  type Batch,
  type BatchProfile,
  type Vintage,
  type RuleHit,
} from '../../data/sim-batch';
import { gradeAnswer, type Accuracy } from '../../lib/enology';
import { plural } from '../../lib/plural';

const BASE_URL = import.meta.env.BASE_URL;
/** Высота липкой шапки сайта плюс зазор */
const HEADER_OFFSET = 80;

type Metrics = Record<MetricKey, number>;

interface LogEntry {
  stageTitle: string;
  phase: string;
  choiceLabel: string;
  quality: SimChoice['quality'];
  faults: string[];
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function metricColor(v: number): string {
  if (v >= 70) return 'bg-emerald-500';
  if (v >= 50) return 'bg-amber-400';
  if (v >= 35) return 'bg-orange-400';
  return 'bg-red-500';
}

function qualityBadge(q: SimChoice['quality']): { label: string; cls: string } {
  switch (q) {
    case 'best':
      return { label: 'Оптимально', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' };
    case 'ok':
      return { label: 'Приемлемо', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' };
    case 'poor':
      return { label: 'Рискованно', cls: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300' };
  }
}

// Формулировки дегустационной заметки по стилю вина
const NOTE_TEXT: Record<
  SimScenario['noteStyle'],
  {
    aromaHigh: string;
    aromaLow: string;
    freshHigh: string;
    structHigh: string;
    structMid: string;
    structLow: string;
  }
> = {
  white: {
    aromaHigh: 'Яркий, чистый сортовой аромат — цветы и мускат во всей полноте.',
    aromaLow: 'Нос приглушён, сортовая ароматика во многом потеряна.',
    freshHigh: 'Хрустящая свежесть держит вино живым и питким.',
    structHigh: 'Приятная текстура и тело придают объём.',
    structMid: 'Тело умеренное.',
    structLow: 'Вино худощавое, плосковатое.',
  },
  red: {
    aromaHigh: 'Глубокий выразительный нос: тёмные ягоды, специи, благородный дуб.',
    aromaLow: 'Нос невыразительный, фрукт задавлен.',
    freshHigh: 'Кислотный костяк свеж и уместен.',
    structHigh: 'Плотная, но зрелая танинная структура — основа для долгой выдержки.',
    structMid: 'Структура средняя, потенциал старения ограничен.',
    structLow: 'Танинный каркас слабоват либо зелёный.',
  },
  rose: {
    aromaHigh: 'Тонкий тиоловый аромат — грейпфрут, цитрус, ягодная свежесть.',
    aromaLow: 'Аромат блёклый, тиоловая искра не раскрылась.',
    freshHigh: 'Звонкая свежесть и лёгкая игра CO₂ — питко и легко.',
    structHigh: 'Деликатное тело при бледном цвете — изящно и чисто.',
    structMid: 'Тело лёгкое, как и положено стилю.',
    structLow: 'Вино совсем тощее, не хватает плоти.',
  },
  orange: {
    aromaHigh: 'Сложный нос: мускатные терпены, сухофрукты, чай и цедра.',
    aromaLow: 'Аромат приглушён, терпены Муската во многом ушли.',
    freshHigh: 'Кислотный костяк (Кокур) держит баланс на фоне танина.',
    structHigh: 'Бархатистая фенольная текстура — янтарное тело с хваткой танина.',
    structMid: 'Танинная текстура умеренная для оранжа.',
    structLow: 'Для оранжа не хватает фенольного тела и цвета.',
  },
  campaign: {
    aromaHigh: 'По всем потокам ароматика чистая и сортовая — от мускатных белых до тиолового розе.',
    aromaLow: 'Ароматика потоков размыта: где-то ушли терпены, где-то — тиолы розе.',
    freshHigh: 'Свежесть выдержана во всех белых и розе — кампания «звенит».',
    structHigh: 'Красные набрали зрелую структуру, а белые и оранж — уместное тело.',
    structMid: 'Структура потоков средняя — без провалов, но и без блеска.',
    structLow: 'Телу и структуре потоков не хватает наполненности.',
  },
  season: {
    aromaHigh: 'Мускат узнаётся сортово, но без парфюмного перебора — задача сезона решена; Кокур держит фон.',
    aromaLow: 'Ароматика сезона потеряна: Мускат либо задавлен, либо ушёл в парфюмность, которую нечем разбавить.',
    freshHigh: 'Кислотный профиль розе близок к эталону 2025 года — свежесть на месте по всем партиям.',
    structHigh: 'Цвет розе держится вишнёво-розовым, красное собрано дубом, Мускат получил объём на осадке.',
    structMid: 'Структура и цвет в рабочем коридоре, но до эталона партии не дотянули.',
    structLow: 'Цвет розе бледный, красное пустое — по структуре сезон не состоялся.',
  },
};

// Дегустационная заметка из уровней метрик
function tastingNote(scenario: SimScenario, m: Metrics, faults: string[]): string[] {
  const notes: string[] = [];
  const t = NOTE_TEXT[scenario.noteStyle];

  if (m.aroma >= 75) notes.push(t.aromaHigh);
  else if (m.aroma >= 55) notes.push('Аромат приятный, но сдержанный — раскрывается не полностью.');
  else notes.push(t.aromaLow);

  if (m.freshness >= 70) notes.push(t.freshHigh);
  else if (m.freshness >= 45) notes.push('Баланс кислотности средний.');
  else notes.push('Вино вялое, не хватает кислотного стержня.');

  if (m.structure >= 70) notes.push(t.structHigh);
  else if (m.structure >= 45) notes.push(t.structMid);
  else notes.push(t.structLow);

  if (m.stability >= 70) notes.push('Вино стабильно — устойчиво в бутылке.');
  else if (m.stability >= 45) notes.push('Стабильность под вопросом: возможны помутнения или осадок.');
  else notes.push('Высокий риск нестабильности в бутылке.');

  if (m.purity >= 75) notes.push('Чистое, без дефектных тонов.');
  else if (m.purity >= 50) notes.push('Есть лёгкие посторонние оттенки.');
  else notes.push('Дефектные тона заметно портят впечатление.');

  if (faults.length) notes.push('Зафиксированные проблемы: ' + faults.join('; ') + '.');
  return notes;
}

type VintageChoice = 'random' | Vintage['id'];

const VINTAGE_OPTIONS: { id: VintageChoice; label: string; icon: string; description: string }[] = [
  {
    id: 'random',
    label: 'Случайный',
    icon: '🎲',
    description: 'Год определится при старте: жаркий, типичный или прохладный. Заранее его не выбирают.',
  },
  ...VINTAGES,
];

const fmt = (x: number, d = 1) => x.toFixed(d).replace('.', ',');

type Tone = 'ok' | 'warn' | 'bad';

const TONE_CLS: Record<Tone, string> = {
  ok: 'text-emerald-700 dark:text-emerald-400',
  warn: 'text-amber-700 dark:text-amber-400',
  bad: 'text-red-700 dark:text-red-400',
};

interface PassportRow {
  key: string;
  label: string;
  value: string;
  /** Изменение от решения на текущем этапе */
  delta?: string;
  tone?: Tone;
  /** Ориентир для лабораторного протокола */
  norm?: string;
}

/** Защита оценивается от цели стиля: розлив и переливки съедают пару мг/л свободного SO₂. */
function molTone(mol: number, profile: BatchProfile): Tone {
  return mol >= profile.molTarget * 0.75 ? 'ok' : mol >= profile.molTarget * 0.5 ? 'warn' : 'bad';
}

function signed(diff: number, d: number): string | undefined {
  const r = Math.round(diff * 10 ** d) / 10 ** d;
  if (r === 0) return undefined;
  return (r > 0 ? '+' : '−') + fmt(Math.abs(r), d);
}

/** Строки паспорта: что сейчас в ёмкости и чем это грозит. */
function passportRows(b: Batch, profile: BatchProfile, ref?: Batch | null): PassportRow[] {
  const d = (k: keyof Batch, digits: number) =>
    ref && typeof ref[k] === 'number' ? signed((b[k] as number) - (ref[k] as number), digits) : undefined;
  const rows: PassportRow[] = [];
  const wine = b.phase === 'wine';
  const mol = molecular(b);
  // Красные и оранж проходят ЯМБ: кислотность ниже, pH выше — это норма стиля
  const mlfStyle = profile.color === 'red' || profile.color === 'orange';

  if (wine) {
    rows.push({
      key: 'sugar',
      label: 'Остаточный сахар',
      value: `${fmt(b.sugar)} г/л`,
      delta: d('sugar', 1),
      tone: profile.dry ? (b.sugar <= 2 ? 'ok' : b.sugar <= 4 ? 'warn' : 'bad') : undefined,
      norm: profile.dry ? 'сухое: ≤ 2 г/л надёжно, до 4 — с фильтрацией' : 'по стилю',
    });
    rows.push({ key: 'alcohol', label: 'Спирт', value: `${fmt(b.alcohol)} % об.`, delta: d('alcohol', 1) });
  } else {
    const potential = b.sugar / profile.gPerPct;
    rows.push({ key: 'sugar', label: 'Сахар', value: `${Math.round(b.sugar)} г/л`, delta: d('sugar', 0) });
    rows.push({
      key: 'potential',
      label: 'Потенц. спирт',
      value: `${fmt(potential)} % об.`,
      tone: potential > 14.5 ? 'warn' : undefined,
    });
  }
  rows.push({
    key: 'pH',
    label: 'pH',
    value: fmt(b.pH, 2),
    delta: d('pH', 2),
    tone: b.pH >= 3.75 ? 'bad' : b.pH >= (mlfStyle ? 3.7 : 3.55) ? 'warn' : undefined,
    norm: mlfStyle ? '3,3–3,7' : '3,1–3,5',
  });
  rows.push({
    key: 'ta',
    label: 'ТК',
    value: `${fmt(b.ta)} г/л`,
    delta: d('ta', 1),
    tone: b.ta < (mlfStyle ? 4.5 : 5) ? 'warn' : undefined,
    norm: mlfStyle ? '4,5–6,5 г/л' : '5,5–8 г/л',
  });
  rows.push({
    key: 'malic',
    label: 'Яблочная',
    value: `${fmt(b.malic)} г/л`,
    delta: d('malic', 1),
    // Для стилей с ЯМБ остаток яблочной в вине — субстрат малолактики в бутылке
    tone: wine && mlfStyle && b.malic > 0.3 ? 'warn' : undefined,
    norm: mlfStyle ? '< 0,3 г/л после ЯМБ' : 'сохраняется: ЯМБ заблокировано',
  });
  if (!wine) {
    rows.push({
      key: 'yan',
      label: 'Усвояемый азот',
      value: `${b.yan} мг/л`,
      delta: d('yan', 0),
      tone: b.yan < 100 ? 'bad' : b.yan < 140 ? 'warn' : 'ok',
    });
  }
  rows.push({ key: 'free', label: 'Своб. SO₂', value: `${b.freeSO2} мг/л`, delta: d('freeSO2', 0) });
  rows.push({
    key: 'mol',
    label: 'Молекулярный SO₂',
    value: `${fmt(mol, 2)} мг/л`,
    delta: ref ? signed(mol - molecular(ref), 2) : undefined,
    tone: wine ? molTone(mol, profile) : undefined,
    norm: `цель ${fmt(profile.molTarget)} мг/л`,
  });
  rows.push({
    key: 'total',
    label: 'Общий SO₂',
    value: `${b.totalSO2} / ${profile.so2Limit}`,
    delta: d('totalSO2', 0),
    tone: b.totalSO2 > profile.so2Limit ? 'bad' : b.totalSO2 > profile.so2Limit * 0.85 ? 'warn' : undefined,
    norm: `≤ ${profile.so2Limit} мг/л`,
  });
  rows.push({
    key: 'va',
    label: 'Летучая кисл.',
    value: `${fmt(b.va, 2)} г/л`,
    delta: d('va', 2),
    tone: b.va > 0.8 ? 'bad' : b.va > 0.6 ? 'warn' : 'ok',
    norm: '< 0,6 г/л',
  });
  rows.push({
    key: 'temp',
    label: 'Температура',
    value: `${b.temp} °C`,
    delta: d('temp', 0),
    tone: !wine && (b.temp > 32 || b.temp < 11) ? 'warn' : undefined,
  });
  return rows;
}

function BatchPassport({
  batch,
  profile,
  reference,
  vintage,
}: {
  batch: Batch;
  profile: BatchProfile;
  reference: Batch | null;
  vintage: Vintage | null;
}) {
  const rows = passportRows(batch, profile, reference);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h3 className="font-semibold text-stone-800 dark:text-stone-200 text-sm">Паспорт партии</h3>
        <span className="text-[11px] text-stone-400">{batch.phase === 'must' ? 'сусло' : 'вино'} · {batch.volumeL} л</span>
      </div>
      <p className="text-[11px] text-stone-400 mb-2">
        {profile.label}
        {vintage && <> · {vintage.icon} {vintage.label.toLowerCase()}</>}
      </p>
      <dl className="text-xs divide-y divide-stone-100 dark:divide-stone-800">
        {rows.map((r) => (
          <div key={r.key} className="flex items-baseline justify-between gap-2 py-1">
            <dt className="text-stone-500 dark:text-stone-400">{r.label}</dt>
            <dd className="text-right tabular-nums">
              <span className={`font-semibold ${r.tone ? TONE_CLS[r.tone] : 'text-stone-700 dark:text-stone-200'}`}>
                {r.tone === 'bad' && <span aria-hidden="true">⚠ </span>}
                {r.value}
              </span>
              {r.delta && <span className="ml-1.5 text-[10px] text-stone-400">{r.delta}</span>}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-[10px] text-stone-400 mt-2">
        Учебная модель: молекулярный SO₂ — из свободного и pH (pKa 1,81). Мелкие цифры — сдвиг от последнего решения.
      </p>
    </div>
  );
}

function ScenarioPicker({
  onPick,
  best,
  onOpenReference,
  vintageChoice,
  onVintage,
}: {
  onPick: (s: SimScenario) => void;
  best: Record<string, number>;
  onOpenReference: () => void;
  vintageChoice: VintageChoice;
  onVintage: (v: VintageChoice) => void;
}) {
  const selected = VINTAGE_OPTIONS.find((v) => v.id === vintageChoice)!;
  return (
    <div>
      <div className="mb-5 rounded-2xl border border-stone-200 dark:border-stone-800 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-stone-800 dark:text-stone-200 mr-1">Год урожая</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Год урожая">
            {VINTAGE_OPTIONS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onVintage(v.id)}
                aria-pressed={vintageChoice === v.id}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border
                  ${vintageChoice === v.id
                    ? 'bg-emerald-700 border-emerald-700 text-white'
                    : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-emerald-400'}`}
              >
                <span aria-hidden="true">{v.icon}</span> {v.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
          {selected.description} Год сдвигает исходные сахар, pH, кислотность и азот — а от них зависят дозы и риски.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {allScenarios.map((s) => {
          const doses = s.stages.filter((st) => st.dose).length;
          return (
            <button
              key={s.id}
              onClick={() => onPick(s)}
              className="text-left rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg transition-all group"
            >
              <div className="bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-950 text-white p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-4xl">{s.icon}</span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/15 backdrop-blur">{s.difficulty}</span>
                </div>
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="text-sm text-white/80">{s.grape}</p>
              </div>
              <div className="p-5">
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">{s.intro}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-stone-400">
                    {s.stages.length} {plural(s.stages.length, ['этап', 'этапа', 'этапов'])}
                    {doses > 0 && <> · {doses} с расчётом дозы</>}
                  </span>
                  {best[s.id] != null && (
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Лучший: {best[s.id]} / 100
                    </span>
                  )}
                </div>
                <span className="mt-3 inline-block text-sm font-semibold text-emerald-700 dark:text-emerald-400 group-hover:underline">
                  Начать сценарий →
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-stone-200 dark:border-stone-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-stone-800 dark:text-stone-200">Справочник препаратов сезона</div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Дрожжи, активаторы, ферменты, метабисульфит и дубовая щепа — дозы, момент внесения и несовместимости.
          </p>
        </div>
        <button
          onClick={onOpenReference}
          className="text-sm font-semibold px-4 py-2 rounded-lg border border-emerald-300 dark:border-emerald-700
            text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40
            focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
        >
          📋 Открыть справочник
        </button>
      </div>
    </div>
  );
}

function MetricsPanel({ metrics }: { metrics: Metrics }) {
  return (
    <div className="space-y-2.5">
      {METRICS.map((def) => {
        const v = metrics[def.key];
        return (
          <div key={def.key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-stone-600 dark:text-stone-300">
                {def.icon} {def.short}
              </span>
              <span className="text-stone-400 tabular-nums">{v}</span>
            </div>
            <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${metricColor(v)}`} style={{ width: `${v}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const ACCURACY_QUALITY: Record<Accuracy, SimChoice['quality']> = { exact: 'best', close: 'ok', off: 'poor' };

/** Ввод дозы числом. Запятая и точка равноправны: так пишут в журнале погреба. */
function DoseInput({ stage, fill, onSubmit }: { stage: SimStage; fill: (t: string) => string; onSubmit: (v: number) => void }) {
  const dose = stage.dose!;
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(value.replace(',', '.').trim());
    if (!Number.isFinite(n) || n < 0) {
      setError('Введите число: 0 или больше.');
      return;
    }
    onSubmit(n);
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/10 p-4">
      <label htmlFor={`${uid}-dose`} className="block text-sm font-medium text-stone-800 dark:text-stone-200 mb-2">
        {fill(dose.prompt)}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id={`${uid}-dose`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className="input w-36"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${uid}-err` : undefined}
        />
        <span className="text-sm text-stone-500 dark:text-stone-400">{dose.unit}</span>
        <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
          Внести
        </button>
      </div>
      {error && (
        <p id={`${uid}-err`} className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>
      )}
      <details className="mt-3 text-xs text-stone-500 dark:text-stone-400">
        <summary className="cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400">Подсказка: формула</summary>
        <p className="mt-1.5 whitespace-pre-line">{fill(dose.formula)}</p>
        <a href={`${BASE_URL}tools`} target="_blank" rel="noopener" className="inline-block mt-1.5 text-emerald-700 dark:text-emerald-400 hover:underline">
          Открыть калькуляторы в новой вкладке →
        </a>
      </details>
      <p className="text-[11px] text-stone-400 mt-2">
        ±10 % от расчёта — точно, ±30 % — приемлемо; для малых доз допуск не меньше погрешности анализа. В партию попадёт именно
        введённое количество.
      </p>
    </form>
  );
}

/** В протокол розлива не идут технологические строки */
const LAB_SKIP = new Set(['temp', 'potential']);
/** Строки, для которых есть смысл показать исходное сусло */
const MUST_KEYS = new Set(['sugar', 'pH', 'ta', 'malic']);

function labTone(rows: PassportRow[]): Tone {
  if (rows.some((r) => r.tone === 'bad')) return 'bad';
  if (rows.some((r) => r.tone === 'warn')) return 'warn';
  return 'ok';
}

export default function WineSimulator() {
  const [scenario, setScenario] = useState<SimScenario | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [metrics, setMetrics] = useState<Metrics>({ ...INITIAL_METRICS });
  const [faults, setFaults] = useState<string[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [chosen, setChosen] = useState<SimChoice | null>(null);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState<Record<string, number>>({});
  /** Рекорд именно этого прохождения: повтор прежнего результата рекордом не считается. */
  const [isRecord, setIsRecord] = useState(false);
  /** null — диалог закрыт; { id: null } — общий справочник; { id } — карточка препарата. */
  const [reagentDialog, setReagentDialog] = useState<{ id: string | null } | null>(null);
  const [vintageChoice, setVintageChoice] = useState<VintageChoice>('random');
  const [vintage, setVintage] = useState<Vintage | null>(null);
  /** Партия сейчас и на входе в этап: из второй берутся тексты этапа и сдвиги в паспорте */
  const [batch, setBatch] = useState<Batch | null>(null);
  const [stageBatch, setStageBatch] = useState<Batch | null>(null);
  const [initialBatch, setInitialBatch] = useState<Batch | null>(null);
  /** Правила, уже сработавшие в этом прохождении */
  const [fired, setFired] = useState<string[]>([]);
  const [hits, setHits] = useState<RuleHit[]>([]);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sim-best') || '{}');
      setBest(stored);
    } catch {}
  }, []);

  useEffect(() => {
    if (chosen) feedbackRef.current?.focus({ preventScroll: false });
  }, [chosen]);

  // Новый этап или итог должны начинаться в поле зрения, а не остаться выше экрана.
  // Ждём кадр: браузер сначала пересчитывает высоту страницы после смены экрана.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const frame = requestAnimationFrame(() => {
      const top = el.getBoundingClientRect().top;
      if (top < 0) window.scrollTo({ top: window.scrollY + top - HEADER_OFFSET });
    });
    return () => cancelAnimationFrame(frame);
  }, [scenario, stageIndex, done]);

  function start(s: SimScenario) {
    const v = s.batch ? pickVintage(vintageChoice) : null;
    const b = s.batch && v ? applyVintage(s.batch, v) : null;
    setScenario(s);
    setStageIndex(0);
    setMetrics({ ...INITIAL_METRICS });
    setFaults([]);
    setLog([]);
    setChosen(null);
    setDone(false);
    setIsRecord(false);
    setVintage(v);
    setBatch(b);
    setStageBatch(b);
    setInitialBatch(b);
    setFired([]);
    setHits([]);
  }

  /** Применяет решение: оценки, партию и правила, которые из новой партии следуют. */
  function commit(choice: SimChoice) {
    if (chosen || !scenario) return;
    const stage = scenario.stages[stageIndex];
    const profile = scenario.profile;
    let nextBatch = batch;
    let ruleHits: RuleHit[] = [];
    if (batch && profile) {
      nextBatch = applyOps(batch, choice.batch, profile);
      const known = choice.fault ? [...faults, choice.fault] : faults;
      ruleHits = evaluateRules(batch, nextBatch, profile, !!stage.audit, new Set(fired), known);
    }
    const effects = [...choice.effects, ...ruleHits.flatMap((h) => h.effects)];
    const newFaults = [choice.fault, ...ruleHits.map((h) => h.fault)].filter((f): f is string => !!f);

    setChosen(choice);
    setBatch(nextBatch);
    setHits(ruleHits);
    if (ruleHits.length) setFired((prev) => [...prev, ...ruleHits.map((h) => h.id)]);
    setMetrics((prev) => {
      const next = { ...prev };
      for (const e of effects) next[e.metric] = clamp(next[e.metric] + e.delta);
      return next;
    });
    if (newFaults.length) setFaults((prev) => [...prev, ...newFaults.filter((f) => !prev.includes(f))]);
    setLog((prev) => [
      ...prev,
      { stageTitle: stage.title, phase: stage.phase, choiceLabel: choice.label, quality: choice.quality, faults: newFaults },
    ]);
  }

  function submitDose(entered: number) {
    if (!scenario || !batch) return;
    const dose = scenario.stages[stageIndex].dose!;
    const expected = dose.expected(batch);
    const acc: Accuracy = gradeAnswer(entered, expected, 0.1, 0.3, dose.absTolerance?.(batch) ?? 0);
    const digits = (x: number) => (x >= 100 ? 0 : 1);
    commit({
      id: 'dose',
      label: `Внесено ${fmt(entered, entered % 1 ? 1 : 0)} ${dose.unit} · расчёт ≈ ${fmt(expected, digits(expected))} ${dose.unit}`,
      quality: ACCURACY_QUALITY[acc],
      feedback: dose.explain(batch, expected, entered),
      effects: dose.effects[acc],
      fault: dose.faults?.[acc],
      reagents: dose.reagents,
      batch: dose.apply(batch, entered),
    });
  }

  function next() {
    if (!scenario) return;
    if (stageIndex + 1 >= scenario.stages.length) {
      finish();
    } else {
      setStageIndex((i) => i + 1);
      setChosen(null);
      setHits([]);
      setStageBatch(batch);
    }
  }

  function finish() {
    setDone(true);
    const score = Math.round(
      (metrics.aroma + metrics.freshness + metrics.structure + metrics.stability + metrics.purity) / 5
    );
    const cur = best[scenario!.id];
    const beatsBest = cur == null || score > cur;
    setIsRecord(beatsBest);
    if (beatsBest) {
      const updated = { ...best, [scenario!.id]: score };
      setBest(updated);
      try {
        localStorage.setItem('sim-best', JSON.stringify(updated));
      } catch {}
    }
  }

  function reset() {
    setScenario(null);
    setDone(false);
    setChosen(null);
  }

  // ── Экран выбора сценария ──
  if (!scenario) {
    return (
      <>
        <ScenarioPicker
          onPick={start}
          best={best}
          onOpenReference={() => setReagentDialog({ id: null })}
          vintageChoice={vintageChoice}
          onVintage={setVintageChoice}
        />
        {reagentDialog && (
          <ReagentDialog
            key={reagentDialog.id ?? '__list__'}
            initialId={reagentDialog.id}
            onClose={() => setReagentDialog(null)}
          />
        )}
      </>
    );
  }

  const score = Math.round(
    (metrics.aroma + metrics.freshness + metrics.structure + metrics.stability + metrics.purity) / 5
  );
  const profile = scenario.profile;

  // ── Экран результата ──
  if (done) {
    const medal = medalForScore(score);
    const notes = tastingNote(scenario, metrics, faults);
    const lab = batch && profile ? passportRows(batch, profile).filter((r) => !LAB_SKIP.has(r.key)) : null;
    const must = initialBatch && profile ? new Map(passportRows(initialBatch, profile).map((r) => [r.key, r.value])) : null;
    const labVerdict = lab ? labTone(lab) : null;
    return (
      <div ref={rootRef}>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-950 text-white p-8 text-center mb-6">
          <div className="text-6xl mb-2">{medal.icon}</div>
          <div className="text-sm uppercase tracking-wide text-white/70">Итоговая оценка</div>
          <div className="text-5xl font-bold my-1 tabular-nums">{score}<span className="text-2xl text-white/60"> / 100</span></div>
          <div className="text-2xl font-semibold">{medal.label}</div>
          <p className="text-white/80 mt-2 max-w-md mx-auto text-sm">{medal.blurb}</p>
          {vintage && (
            <p className="text-white/70 mt-2 text-xs">{vintage.icon} {vintage.label}</p>
          )}
          {isRecord && score > 0 && (
            <div className="mt-3 inline-block text-xs px-3 py-1 rounded-full bg-white/15">Новый личный рекорд!</div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-3">Профиль вина</h3>
            <MetricsPanel metrics={metrics} />
          </div>
          <div className="card">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-3">Дегустационная заметка</h3>
            <ul className="space-y-1.5 text-sm text-stone-600 dark:text-stone-400">
              {notes.map((n, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-600">•</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {lab && profile && labVerdict && (
          <div className="card mb-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
              <h3 className="font-semibold text-stone-800 dark:text-stone-200">Лабораторный протокол</h3>
              <span className={`text-xs font-semibold ${TONE_CLS[labVerdict]}`}>
                {labVerdict === 'ok' ? 'К розливу готово' : labVerdict === 'warn' ? 'Готово с оговорками' : 'Есть показатели вне нормы'}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
              {profile.label}
              {vintage && <> · {vintage.label.toLowerCase()}</>} · рядом — что было в сусле
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-stone-400 border-b border-stone-200 dark:border-stone-700">
                    <th className="py-1.5 pr-3 font-medium">Показатель</th>
                    <th className="py-1.5 pr-3 font-medium">Сусло</th>
                    <th className="py-1.5 font-medium">Вино</th>
                  </tr>
                </thead>
                <tbody>
                  {lab.map((r) => (
                    <tr key={r.key} className="border-b border-stone-100 dark:border-stone-800 last:border-0 align-top">
                      <td className="py-1.5 pr-3 text-stone-600 dark:text-stone-300">
                        {r.label}
                        {r.norm && <div className="text-[11px] leading-snug text-stone-400 dark:text-stone-500">{r.norm}</div>}
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums whitespace-nowrap text-stone-400">
                        {MUST_KEYS.has(r.key) ? must?.get(r.key) ?? '—' : '—'}
                      </td>
                      <td className={`py-1.5 tabular-nums font-semibold whitespace-nowrap ${r.tone ? TONE_CLS[r.tone] : 'text-stone-700 dark:text-stone-200'}`}>
                        {r.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-stone-400 mt-3">
              Ориентиры учебные: точные пределы — по категории вина и действующему регламенту (ТР ЕАЭС 047/2018, в ЕС — 2019/934).
            </p>
          </div>
        )}

        <div className="card mb-6">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-3">Журнал решений</h3>
          <div className="space-y-2">
            {log.map((e, i) => {
              const b = qualityBadge(e.quality);
              return (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-xs text-stone-400 mt-0.5 w-5 text-right tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-stone-400 text-xs">{e.phase} · {e.stageTitle}</span>
                    <div className="text-stone-700 dark:text-stone-300">{e.choiceLabel}</div>
                    {e.faults.length > 0 && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">⚠ {e.faults.join('; ')}</div>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${b.cls}`}>{b.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => start(scenario)} className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
            Пройти заново
          </button>
          <button onClick={reset} className="btn-secondary px-5 py-2.5 rounded-xl font-semibold text-sm">
            Другой сценарий
          </button>
          <a href={`${BASE_URL}glossary`} className="px-5 py-2.5 rounded-xl font-semibold text-sm text-emerald-700 dark:text-emerald-400 hover:underline self-center">
            Разобрать термины в глоссарии →
          </a>
        </div>
      </div>
    );
  }

  // ── Игровой экран ──
  const stage = scenario.stages[stageIndex];
  const progress = Math.round((stageIndex / scenario.stages.length) * 100);
  const fill = (t: string, b: Batch | null = stageBatch) => (b ? fillBatch(t, b, profile?.gPerPct) : t);
  const passport = batch && profile && (
    <BatchPassport batch={batch} profile={profile} reference={stageBatch} vintage={vintage} />
  );

  return (
    <div ref={rootRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Основная колонка */}
      <div className="lg:col-span-2 space-y-5 min-w-0">
        {/* Прогресс */}
        <div>
          <div className="flex items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400 mb-1.5">
            <span className="min-w-0 truncate">
              {scenario.icon} {scenario.title} — {scenario.grape}
              {vintage && <> · {vintage.icon} {vintage.label}</>}
            </span>
            <span className="shrink-0">Этап {stageIndex + 1} из {scenario.stages.length}</span>
          </div>
          <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {stageIndex === 0 && vintage && !chosen && (
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-3 text-sm text-stone-600 dark:text-stone-400">
            <span className="font-semibold text-stone-800 dark:text-stone-200">{vintage.icon} {vintage.label}.</span> {vintage.description}
            {' '}Показатели партии — в паспорте; на них опираются расчёты доз и последствия решений.
          </div>
        )}

        {/* Паспорт на телефоне — над этапом, чтобы цифры были перед глазами */}
        {passport && (
          <details className="lg:hidden card">
            <summary className="cursor-pointer text-sm font-semibold text-stone-800 dark:text-stone-200">
              Паспорт партии: pH {fmt(batch!.pH, 2)} · своб. SO₂ {batch!.freeSO2} · {batch!.phase === 'must' ? `сахар ${Math.round(batch!.sugar)}` : `спирт ${fmt(batch!.alcohol)} %`}
            </summary>
            <div className="mt-3">{passport}</div>
          </details>
        )}

        {/* Карточка этапа */}
        <div className="card">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">
            <span className="text-lg">{stage.icon}</span>
            <span>{stage.phase}</span>
            {stage.dose && <span className="normal-case tracking-normal text-stone-400">· расчёт дозы</span>}
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">{stage.title}</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">{fill(stage.context)}</p>

          {stage.data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {stage.data.map((d, i) => (
                <div key={i} className="rounded-lg bg-stone-100 dark:bg-stone-800 p-2.5">
                  <div className="text-[11px] text-stone-400 dark:text-stone-500">{d.label}</div>
                  <div className="text-sm font-semibold text-stone-700 dark:text-stone-200">{fill(d.value)}</div>
                </div>
              ))}
            </div>
          )}

          {stage.reagents && stage.reagents.length > 0 && (
            <div className="mb-4">
              <ReagentChips ids={stage.reagents} onOpen={(id) => setReagentDialog({ id })} />
            </div>
          )}

          <div className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-3">{fill(stage.question)}</div>

          {stage.dose ? (
            !chosen && <DoseInput key={`${scenario.id}-${stageIndex}`} stage={stage} fill={(t) => fill(t)} onSubmit={submitDose} />
          ) : (
            <div className="space-y-2.5">
              {stage.choices.map((c) => {
                const isChosen = chosen?.id === c.id;
                const dim = chosen && !isChosen;
                return (
                  <button
                    key={c.id}
                    onClick={() => commit(c)}
                    disabled={!!chosen}
                    aria-pressed={isChosen}
                    className={`w-full text-left rounded-xl border p-3.5 transition-all
                      ${isChosen ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-500' : 'border-stone-200 dark:border-stone-700'}
                      ${dim ? 'opacity-50' : ''}
                      ${!chosen ? 'hover:border-emerald-400 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="font-medium text-sm text-stone-800 dark:text-stone-200">{fill(c.label)}</div>
                    {c.detail && <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{fill(c.detail)}</div>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Обратная связь */}
          {chosen && (
            <div
              ref={feedbackRef}
              tabIndex={-1}
              className="mt-4 rounded-xl border-l-4 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-4 focus:outline-none"
            >
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full ${qualityBadge(chosen.quality).cls}`}>
                  {qualityBadge(chosen.quality).label}
                </span>
                {chosen.fault && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300">
                    ⚠ {chosen.fault}
                  </span>
                )}
              </div>
              {chosen.id === 'dose' && (
                <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">{chosen.label}</div>
              )}
              <p className="text-sm text-stone-700 dark:text-stone-300 mb-2 whitespace-pre-line">{fill(chosen.feedback, batch)}</p>

              {hits.length > 0 && (
                <div className="space-y-2 mb-3">
                  {hits.map((h) => (
                    <div key={h.id} className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-3">
                      <div className="text-xs font-semibold text-red-800 dark:text-red-300">⚠ {h.fault}</div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">{h.explain}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                {[...chosen.effects, ...hits.flatMap((h) => h.effects)].map((e, i) => {
                  const def = METRICS.find((d) => d.key === e.metric)!;
                  const up = e.delta >= 0;
                  return (
                    <span
                      key={i}
                      className={`text-xs px-2 py-0.5 rounded-full ${up ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'}`}
                    >
                      {def.icon} {def.short} {up ? '+' : ''}{e.delta}
                    </span>
                  );
                })}
              </div>
              {chosen.reagents && chosen.reagents.length > 0 && (
                <div className="mb-3">
                  <ReagentChips ids={chosen.reagents} label="Подробнее" onOpen={(id) => setReagentDialog({ id })} />
                </div>
              )}
              <button onClick={next} className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-colors">
                {stageIndex + 1 >= scenario.stages.length ? 'Завершить и оценить вино →' : 'Далее →'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Боковая панель: оценки и паспорт */}
      <aside className="space-y-4 min-w-0">
        <div className="card lg:sticky lg:top-20 space-y-4">
          <div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-3 text-sm">Состояние вина</h3>
            <MetricsPanel metrics={metrics} />
          </div>
          {passport && <div className="hidden lg:block pt-3 border-t border-stone-100 dark:border-stone-800">{passport}</div>}
          {faults.length > 0 && (
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
              <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">Проблемы</div>
              <ul className="space-y-1">
                {faults.map((f, i) => (
                  <li key={i} className="text-xs text-stone-500 dark:text-stone-400">⚠ {f}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <button
              onClick={() => setReagentDialog({ id: null })}
              className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700
                text-stone-600 dark:text-stone-300 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400
                focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
            >
              📋 Справочник препаратов
            </button>
            <button onClick={reset} className="mt-3 text-xs text-stone-400 hover:text-red-500 transition-colors">
              ← Выйти к выбору сценария
            </button>
          </div>
        </div>
      </aside>

      {reagentDialog && (
        <ReagentDialog
          key={reagentDialog.id ?? '__list__'}
          initialId={reagentDialog.id}
          onClose={() => setReagentDialog(null)}
        />
      )}
    </div>
  );
}

import { useState, useEffect, useId } from 'react';
import type { HarvestLot, HarvestStage } from '../../data/harvest';

const BASE_URL = import.meta.env.BASE_URL;

const TOOL_LINKS: Record<string, { label: string; href: string }> = {
  maceration: { label: '→ Калькулятор мацерации', href: `${BASE_URL}tools#maceration` },
  so2:        { label: '→ Расчёт SO₂', href: `${BASE_URL}tools#so2` },
  bentonite:  { label: '→ Пробная оклейка', href: `${BASE_URL}tools#bentonite` },
  sugar:      { label: '→ Коррекция сахара', href: `${BASE_URL}tools#sugar` },
  acid:       { label: '→ Коррекция кислотности', href: `${BASE_URL}tools#acid` },
  brix:       { label: '→ Конвертер Brix', href: `${BASE_URL}tools#brix` },
};

/** Свои параметры партии: дата сбора (ГГГГ-ММ-ДД) и объём */
interface LotSettings {
  harvestDate: string;
  volumeL: string;
}

const DATE_FMT = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

/** Когда начинается этап: дата, если задан день сбора, иначе смещение от него */
function stageWhen(offset: number, harvestDate: string): string {
  const base = harvestDate ? new Date(`${harvestDate}T00:00:00`) : null;
  if (base && !Number.isNaN(base.getTime())) {
    base.setDate(base.getDate() + offset);
    return DATE_FMT.format(base);
  }
  return offset === 0 ? 'в день сбора' : `день сбора + ${offset}`;
}

function StageItem({ stage, lotId, onToggle, completed, harvestDate }: {
  stage: HarvestStage;
  lotId: string;
  onToggle: (key: string) => void;
  completed: boolean;
  harvestDate: string;
}) {
  const key = `${lotId}__${stage.id}`;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors
      ${completed ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'}`}>
      <button
        onClick={() => onToggle(key)}
        className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
          ${completed ? 'bg-green-500 border-green-500 text-white' : 'border-stone-300 dark:border-stone-600'}`}
        aria-label={completed ? 'Выполнено' : 'Отметить выполненным'}
      >
        {completed && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm ${completed ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-200'}`}>
          {stage.title}
        </div>
        {!completed && <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{stage.description}</p>}
        {stage.dayOffset != null && !completed && (
          <div className="text-xs text-stone-400 mt-1">
            📅 Ориентир: {stageWhen(stage.dayOffset, harvestDate)}
            {stage.durationDays ? ` · ~${stage.durationDays} дн.` : ''}
          </div>
        )}
        {stage.tools && stage.tools.length > 0 && !completed && (
          <div className="flex flex-wrap gap-2 mt-1.5">
            {stage.tools.map(toolId => {
              const tool = TOOL_LINKS[toolId];
              return tool ? (
                <a key={toolId} href={tool.href}
                  className="text-xs text-wine-700 dark:text-wine-400 hover:underline">
                  {tool.label}
                </a>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LotCard({ lot }: { lot: HarvestLot }) {
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const [settings, setSettings] = useState<LotSettings>({ harvestDate: '', volumeL: String(lot.defaultVolumeL) });
  const uid = useId();

  const storageKey = `harvest-${lot.id}`;
  const settingsKey = `harvest-settings-${lot.id}`;

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setCompleted(stored);
    } catch {}
    try {
      const stored = JSON.parse(localStorage.getItem(settingsKey) || 'null');
      if (stored) setSettings((prev) => ({ ...prev, ...stored }));
    } catch {}
  }, [storageKey, settingsKey]);

  function updateSettings(patch: Partial<LotSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(settingsKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  const volume = parseFloat(settings.volumeL);
  const volumeLabel = Number.isFinite(volume) && volume > 0 ? `${volume} л` : 'объём не задан';
  const harvestLabel = settings.harvestDate ? `сбор ${stageWhen(0, settings.harvestDate)}` : 'дата сбора не задана';

  function toggle(key: string) {
    setCompleted(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  const doneCount = lot.stages.filter(s => completed[`${lot.id}__${s.id}`]).length;
  const totalCount = lot.stages.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left p-5 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
      >
        <div className="flex items-start gap-4">
          <span className="text-3xl">{lot.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs text-stone-400 dark:text-stone-500">{lot.variety}</div>
                <h3 className="font-bold text-stone-800 dark:text-stone-200">{lot.style}</h3>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-stone-500">{doneCount}/{totalCount}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                <div className="h-full bg-wine-600 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-xs text-stone-400 mt-1">{pct}% завершено · {harvestLabel} · {volumeLabel}</div>
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-stone-100 dark:border-stone-800 p-5 space-y-4">
          <p className="text-sm text-stone-600 dark:text-stone-400">{lot.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor={`${uid}-date`}>Дата сбора вашей партии</label>
              <input id={`${uid}-date`} type="date" className="input" value={settings.harvestDate}
                onChange={(e) => updateSettings({ harvestDate: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor={`${uid}-volume`}>Объём партии (л)</label>
              <input id={`${uid}-volume`} type="number" className="input" min={1} value={settings.volumeL}
                onChange={(e) => updateSettings({ volumeL: e.target.value })} />
            </div>
          </div>

          {lot.splitInfo && (
            <div className="rounded-lg bg-wine-50 dark:bg-wine-950/30 border border-wine-200 dark:border-wine-800 p-3 text-sm text-wine-800 dark:text-wine-300">
              <strong>Схема:</strong> {lot.splitInfo}
            </div>
          )}

          <div>
            <div className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">Этапы обработки</div>
            <div className="space-y-2">
              {lot.stages.map(stage => (
                <StageItem
                  key={stage.id}
                  stage={stage}
                  lotId={lot.id}
                  onToggle={toggle}
                  completed={!!completed[`${lot.id}__${stage.id}`]}
                  harvestDate={settings.harvestDate}
                />
              ))}
            </div>
          </div>

          {lot.processingNotes.length > 0 && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4">
              <div className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">Заметки по обработке</div>
              <ul className="space-y-1.5">
                {lot.processingNotes.map((note, i) => (
                  <li key={i} className="flex gap-2 text-xs text-amber-700 dark:text-amber-400">
                    <span>•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HarvestPlanner({ lots }: { lots: HarvestLot[] }) {
  const [filter, setFilter] = useState<string>('all');

  const displayed = filter === 'all' ? lots : lots.filter(l => l.id === filter);

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${filter === 'all' ? 'bg-wine-700 text-white' : 'btn-secondary'}`}
        >
          Все схемы ({lots.length})
        </button>
        {lots.map(lot => (
          <button
            key={lot.id}
            onClick={() => setFilter(lot.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filter === lot.id ? 'bg-wine-700 text-white' : 'btn-secondary'}`}
          >
            {lot.icon} {lot.variety}
          </button>
        ))}
      </div>

      {/* Lot cards */}
      <div className="space-y-4">
        {displayed.map(lot => <LotCard key={lot.id} lot={lot} />)}
      </div>

      {/* Reset */}
      <div className="text-right">
        <button
          onClick={() => {
            if (confirm('Сбросить отметки, даты и объёмы всех схем?')) {
              lots.forEach(lot => {
                localStorage.removeItem(`harvest-${lot.id}`);
                localStorage.removeItem(`harvest-settings-${lot.id}`);
              });
              window.location.reload();
            }
          }}
          className="text-xs text-stone-400 hover:text-red-500 transition-colors"
        >
          Сбросить прогресс планировщика
        </button>
      </div>
    </div>
  );
}

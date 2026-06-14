import { useState, useEffect } from 'react';
import {
  scenarios as allScenarios,
  METRICS,
  INITIAL_METRICS,
  medalForScore,
  type SimScenario,
  type SimChoice,
  type MetricKey,
} from '../../data/simulation';

const BASE_URL = '/Testing-LO/';

type Metrics = Record<MetricKey, number>;

interface LogEntry {
  stageTitle: string;
  phase: string;
  choiceLabel: string;
  quality: SimChoice['quality'];
  fault?: string;
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

// Дегустационная заметка из уровней метрик
function tastingNote(scenario: SimScenario, m: Metrics, faults: string[]): string[] {
  const notes: string[] = [];
  const isWhite = scenario.id === 'white-aromatic';

  if (m.aroma >= 75) notes.push(isWhite ? 'Яркий, чистый сортовой аромат — цветы и мускат во всей полноте.' : 'Глубокий выразительный нос: тёмные ягоды, специи, благородный дуб.');
  else if (m.aroma >= 55) notes.push('Аромат приятный, но сдержанный — раскрывается не полностью.');
  else notes.push(isWhite ? 'Нос приглушён, сортовая ароматика во многом потеряна.' : 'Нос невыразительный, фрукт задавлен.');

  if (m.freshness >= 70) notes.push(isWhite ? 'Хрустящая свежесть держит вино живым и питким.' : 'Кислотный костяк свеж и уместен.');
  else if (m.freshness >= 45) notes.push('Баланс кислотности средний.');
  else notes.push('Вино вялое, не хватает кислотного стержня.');

  if (m.structure >= 70) notes.push(isWhite ? 'Приятная текстура и тело придают объём.' : 'Плотная, но зрелая танинная структура — основа для долгой выдержки.');
  else if (m.structure >= 45) notes.push(isWhite ? 'Тело умеренное.' : 'Структура средняя, потенциал старения ограничен.');
  else notes.push(isWhite ? 'Вино худощавое, плосковатое.' : 'Танинный каркас слабоват либо зелёный.');

  if (m.stability >= 70) notes.push('Вино стабильно — устойчиво в бутылке.');
  else if (m.stability >= 45) notes.push('Стабильность под вопросом: возможны помутнения или осадок.');
  else notes.push('Высокий риск нестабильности в бутылке.');

  if (m.purity >= 75) notes.push('Чистое, без дефектных тонов.');
  else if (m.purity >= 50) notes.push('Есть лёгкие посторонние оттенки.');
  else notes.push('Дефектные тона заметно портят впечатление.');

  if (faults.length) notes.push('Зафиксированные проблемы: ' + faults.join('; ') + '.');
  return notes;
}

function ScenarioPicker({ onPick, best }: { onPick: (s: SimScenario) => void; best: Record<string, number> }) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {allScenarios.map((s) => (
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
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400">{s.stages.length} этапов решений</span>
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
        ))}
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

export default function WineSimulator() {
  const [scenario, setScenario] = useState<SimScenario | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [metrics, setMetrics] = useState<Metrics>({ ...INITIAL_METRICS });
  const [faults, setFaults] = useState<string[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [chosen, setChosen] = useState<SimChoice | null>(null);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sim-best') || '{}');
      setBest(stored);
    } catch {}
  }, []);

  function start(s: SimScenario) {
    setScenario(s);
    setStageIndex(0);
    setMetrics({ ...INITIAL_METRICS });
    setFaults([]);
    setLog([]);
    setChosen(null);
    setDone(false);
  }

  function choose(choice: SimChoice) {
    if (chosen) return;
    setChosen(choice);
    setMetrics((prev) => {
      const next = { ...prev };
      for (const e of choice.effects) next[e.metric] = clamp(next[e.metric] + e.delta);
      return next;
    });
    if (choice.fault) setFaults((prev) => (prev.includes(choice.fault!) ? prev : [...prev, choice.fault!]));
    const stage = scenario!.stages[stageIndex];
    setLog((prev) => [
      ...prev,
      { stageTitle: stage.title, phase: stage.phase, choiceLabel: choice.label, quality: choice.quality, fault: choice.fault },
    ]);
  }

  function next() {
    if (!scenario) return;
    if (stageIndex + 1 >= scenario.stages.length) {
      finish();
    } else {
      setStageIndex((i) => i + 1);
      setChosen(null);
    }
  }

  function finish() {
    setDone(true);
    const score = Math.round(
      (metrics.aroma + metrics.freshness + metrics.structure + metrics.stability + metrics.purity) / 5
    );
    setBest((prev) => {
      const cur = prev[scenario!.id];
      if (cur == null || score > cur) {
        const updated = { ...prev, [scenario!.id]: score };
        try {
          localStorage.setItem('sim-best', JSON.stringify(updated));
        } catch {}
        return updated;
      }
      return prev;
    });
  }

  function reset() {
    setScenario(null);
    setDone(false);
    setChosen(null);
  }

  // ── Экран выбора сценария ──
  if (!scenario) {
    return <ScenarioPicker onPick={start} best={best} />;
  }

  const score = Math.round(
    (metrics.aroma + metrics.freshness + metrics.structure + metrics.stability + metrics.purity) / 5
  );

  // ── Экран результата ──
  if (done) {
    const medal = medalForScore(score);
    const notes = tastingNote(scenario, metrics, faults);
    return (
      <div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-950 text-white p-8 text-center mb-6">
          <div className="text-6xl mb-2">{medal.icon}</div>
          <div className="text-sm uppercase tracking-wide text-white/70">Итоговая оценка</div>
          <div className="text-5xl font-bold my-1 tabular-nums">{score}<span className="text-2xl text-white/60"> / 100</span></div>
          <div className="text-2xl font-semibold">{medal.label}</div>
          <p className="text-white/80 mt-2 max-w-md mx-auto text-sm">{medal.blurb}</p>
          {best[scenario.id] === score && score > 0 && (
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

        <div className="card mb-6">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-3">Журнал решений</h3>
          <div className="space-y-2">
            {log.map((e, i) => {
              const b = qualityBadge(e.quality);
              return (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-xs text-stone-400 mt-0.5 w-5 text-right tabular-nums">{i + 1}</span>
                  <div className="flex-1">
                    <span className="text-stone-400 text-xs">{e.phase} · {e.stageTitle}</span>
                    <div className="text-stone-700 dark:text-stone-300">{e.choiceLabel}</div>
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Основная колонка */}
      <div className="lg:col-span-2 space-y-5">
        {/* Прогресс */}
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1.5">
            <span>{scenario.icon} {scenario.title} — {scenario.grape}</span>
            <span>Этап {stageIndex + 1} из {scenario.stages.length}</span>
          </div>
          <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Карточка этапа */}
        <div className="card">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">
            <span className="text-lg">{stage.icon}</span>
            <span>{stage.phase}</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">{stage.title}</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">{stage.context}</p>

          {stage.data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {stage.data.map((d, i) => (
                <div key={i} className="rounded-lg bg-stone-100 dark:bg-stone-800 p-2.5">
                  <div className="text-[11px] text-stone-400 dark:text-stone-500">{d.label}</div>
                  <div className="text-sm font-semibold text-stone-700 dark:text-stone-200">{d.value}</div>
                </div>
              ))}
            </div>
          )}

          <div className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-3">{stage.question}</div>

          <div className="space-y-2.5">
            {stage.choices.map((c) => {
              const isChosen = chosen?.id === c.id;
              const dim = chosen && !isChosen;
              return (
                <button
                  key={c.id}
                  onClick={() => choose(c)}
                  disabled={!!chosen}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all
                    ${isChosen ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-500' : 'border-stone-200 dark:border-stone-700'}
                    ${dim ? 'opacity-50' : ''}
                    ${!chosen ? 'hover:border-emerald-400 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="font-medium text-sm text-stone-800 dark:text-stone-200">{c.label}</div>
                  {c.detail && <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{c.detail}</div>}
                </button>
              );
            })}
          </div>

          {/* Обратная связь */}
          {chosen && (
            <div className="mt-4 rounded-xl border-l-4 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full ${qualityBadge(chosen.quality).cls}`}>
                  {qualityBadge(chosen.quality).label}
                </span>
                {chosen.fault && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300">
                    ⚠ {chosen.fault}
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-700 dark:text-stone-300 mb-2">{chosen.feedback}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {chosen.effects.map((e, i) => {
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
              <button onClick={next} className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-colors">
                {stageIndex + 1 >= scenario.stages.length ? 'Завершить и оценить вино →' : 'Далее →'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Боковая панель метрик */}
      <aside className="space-y-4">
        <div className="card lg:sticky lg:top-20">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-3 text-sm">Состояние вина</h3>
          <MetricsPanel metrics={metrics} />
          {faults.length > 0 && (
            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
              <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">Проблемы</div>
              <ul className="space-y-1">
                {faults.map((f, i) => (
                  <li key={i} className="text-xs text-stone-500 dark:text-stone-400">⚠ {f}</li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={reset} className="mt-4 text-xs text-stone-400 hover:text-red-500 transition-colors">
            ← Выйти к выбору сценария
          </button>
        </div>
      </aside>
    </div>
  );
}

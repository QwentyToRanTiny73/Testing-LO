import { useEffect, useRef, useState } from 'react';
import { REAGENTS, REAGENT_CATEGORIES, getReagent, type Reagent } from '../../data/reagents';

/** Кликабельные чипы-сноски на препараты этапа или варианта выбора. */
export function ReagentChips({
  ids,
  label = 'Препараты',
  onOpen,
}: {
  ids: string[];
  label?: string;
  onOpen: (id: string) => void;
}) {
  const items = ids.map(getReagent).filter((r): r is Reagent => !!r);
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-stone-400 dark:text-stone-500">{label}:</span>
      {items.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onOpen(r.id)}
          aria-label={`Описание препарата ${r.name}`}
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700
            bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300
            hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:border-emerald-500
            focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
        >
          {r.name}
          <span aria-hidden="true" className="text-emerald-500 dark:text-emerald-400 font-semibold">ⓘ</span>
        </button>
      ))}
    </div>
  );
}

function DetailView({ reagent, onBack }: { reagent: Reagent; onBack?: () => void }) {
  return (
    <div>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-stone-500 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 mb-3 transition-colors"
        >
          ← Все препараты сезона
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
          {reagent.category}
        </span>
        {reagent.photo && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
            в закупке сезона
          </span>
        )}
      </div>

      <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">{reagent.name}</h3>
      <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">{reagent.role}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
        {reagent.pack && <Field label="Фасовка" value={reagent.pack} />}
        {reagent.dose && <Field label="Доза (ориентир)" value={reagent.dose} />}
        {reagent.timing && <Field label="Момент внесения" value={reagent.timing} />}
        {reagent.lots && <Field label="По партиям" value={reagent.lots} />}
      </div>

      <p className="text-sm text-stone-600 dark:text-stone-300 mt-4 leading-relaxed">{reagent.description}</p>

      {reagent.cautions && reagent.cautions.length > 0 && (
        <div className="mt-4 rounded-lg border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3">
          <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1.5">Ограничения и несовместимости</div>
          <ul className="space-y-1">
            {reagent.cautions.map((c, i) => (
              <li key={i} className="text-xs text-amber-800 dark:text-amber-300 flex gap-1.5">
                <span aria-hidden="true">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-4">
        Дозы приведены как ориентиры технологической методички и предварительны до анализа сусла (сахар, pH, титруемая кислотность, YAN).
        Рекомендованные дозы Subliprotect, PROVGREEN, Viazym Clarif One и Viazym MP не подтверждены по техническим листам изготовителя.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-stone-100 dark:bg-stone-800 p-2.5">
      <div className="text-[11px] text-stone-400 dark:text-stone-500">{label}</div>
      <div className="text-sm text-stone-700 dark:text-stone-200">{value}</div>
    </div>
  );
}

function ListView({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">Справочник препаратов сезона</h3>
      <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 mb-4">
        Закупка сезона и препараты методички. Нажмите на позицию, чтобы увидеть дозу, момент внесения и несовместимости.
      </p>
      <div className="space-y-5">
        {REAGENT_CATEGORIES.map((cat) => {
          const items = REAGENTS.filter((r) => r.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500 mb-1.5">{cat}</div>
              <div className="space-y-1.5">
                {items.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelect(r.id)}
                    className="w-full text-left rounded-lg border border-stone-200 dark:border-stone-700 p-2.5
                      hover:border-emerald-400 hover:bg-stone-50 dark:hover:bg-stone-800/50
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{r.name}</span>
                      {r.pack && <span className="text-[11px] text-stone-400 whitespace-nowrap">{r.pack}</span>}
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">{r.role}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Модальное окно справочника. initialId === null — открыть общий список,
 * иначе — карточку конкретного препарата с возможностью вернуться к списку.
 */
export function ReagentDialog({ initialId, onClose }: { initialId: string | null; onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(initialId);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // onClose приходит новой замыкающей функцией на каждый рендер родителя.
  // Держим его в ref, чтобы эффект не перезапускался: иначе при перерисовке
  // родителя с открытым диалогом cleanup вернул бы overflow: hidden навсегда.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      // Ловушка фокуса: Tab не должен уводить за пределы модального окна.
      if (e.key !== 'Tab' || !panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      // Возвращаем фокус на элемент, с которого диалог открыли.
      opener?.focus();
    };
  }, []);

  // При смене карточки прокручиваем панель к началу
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [selected]);

  const reagent = selected ? getReagent(selected) : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={reagent ? `Препарат: ${reagent.name}` : 'Справочник препаратов сезона'}
    >
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className="relative w-full sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl
          bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-5 sm:p-6"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Закрыть справочник"
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center
            text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800
            focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
        >
          ✕
        </button>
        <div className="pr-8">
          {reagent ? (
            <DetailView reagent={reagent} onBack={initialId === null ? () => setSelected(null) : undefined} />
          ) : (
            <ListView onSelect={setSelected} />
          )}
        </div>
      </div>
    </div>
  );
}

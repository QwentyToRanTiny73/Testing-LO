import { useState, useEffect, useCallback } from 'react';
import type { Flashcard, StudySession } from '../../data/flashcards';

// SM-2 simplified spaced repetition
function calcNextInterval(session: StudySession, rating: 1 | 2 | 3 | 4): StudySession {
  const { interval, easeFactor, repetitions } = session;
  let newInterval = interval;
  let newEase = easeFactor;
  let newReps = repetitions;

  if (rating < 3) {
    newReps = 0;
    newInterval = 1;
  } else {
    newReps += 1;
    if (newReps === 1) newInterval = 1;
    else if (newReps === 2) newInterval = 6;
    else newInterval = Math.round(interval * easeFactor);
    newEase = Math.max(1.3, easeFactor + (0.1 - (4 - rating) * 0.08));
  }

  return {
    ...session,
    interval: newInterval,
    easeFactor: newEase,
    repetitions: newReps,
    nextReview: Date.now() + newInterval * 86400000,
  };
}

const RATINGS: { label: string; value: 1 | 2 | 3 | 4; color: string; desc: string }[] = [
  { label: 'Не знаю', value: 1, color: 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200 dark:bg-red-950/30 dark:border-red-700 dark:text-red-400', desc: 'Повторить сегодня' },
  { label: 'Трудно', value: 2, color: 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200 dark:bg-orange-950/30 dark:border-orange-700 dark:text-orange-400', desc: 'Завтра' },
  { label: 'Знаю', value: 3, color: 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200 dark:bg-blue-950/30 dark:border-blue-700 dark:text-blue-400', desc: 'Через 6 дней' },
  { label: 'Легко', value: 4, color: 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200 dark:bg-green-950/30 dark:border-green-700 dark:text-green-400', desc: 'Через 2 недели' },
];

function getDueCards(cards: Flashcard[], sessions: Record<string, StudySession>): Flashcard[] {
  const now = Date.now();
  return cards.filter(c => {
    const s = sessions[c.id];
    return !s || s.nextReview <= now;
  });
}

export default function FlashcardDeck({
  cards,
  moduleFilter,
}: {
  cards: Flashcard[];
  moduleFilter?: string;
}) {
  const STORAGE_KEY = 'flashcard-sessions';
  const [sessions, setSessions] = useState<Record<string, StudySession>>({});
  const [flipped, setFlipped] = useState(false);
  const [idx, setIdx] = useState(0);
  const [sessionDone, setSessionDone] = useState<string[]>([]);
  const [filter, setFilter] = useState<'due' | 'all'>(moduleFilter ? 'all' : 'due');
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    try {
      setSessions(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
    } catch {}
  }, []);

  const filtered = moduleFilter
    ? cards.filter(c => c.moduleId === moduleFilter)
    : cards;

  const deck = filter === 'due'
    ? getDueCards(filtered, sessions)
    : filtered;

  const current = deck[idx];

  const handleRate = useCallback((rating: 1 | 2 | 3 | 4) => {
    if (!current) return;
    const existing: StudySession = sessions[current.id] || {
      cardId: current.id,
      nextReview: 0,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
    };
    const updated = calcNextInterval(existing, rating);
    const newSessions = { ...sessions, [current.id]: updated };
    setSessions(newSessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    setSessionDone(d => [...d, current.id]);
    setFlipped(false);

    if (idx + 1 >= deck.length) {
      setFinished(true);
    } else {
      setIdx(i => i + 1);
    }
  }, [current, sessions, idx, deck.length]);

  function restart() {
    setIdx(0);
    setFlipped(false);
    setSessionDone([]);
    setFinished(false);
  }

  const dueCount = getDueCards(filtered, sessions).length;
  const knownCount = filtered.filter(c => {
    const s = sessions[c.id];
    return s && s.repetitions >= 2 && s.nextReview > Date.now();
  }).length;

  if (finished || deck.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        {deck.length === 0 ? (
          <>
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-stone-800 dark:text-stone-200">
              {filter === 'due' ? 'Все карточки на сегодня изучены!' : 'Колода пуста'}
            </h3>
            <p className="text-stone-500 dark:text-stone-400">
              {filter === 'due'
                ? `Следующее повторение — завтра. Знаешь ${knownCount} из ${filtered.length} карточек.`
                : 'Добавьте карточки в data/flashcards.ts'}
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-stone-800 dark:text-stone-200">
              Сессия завершена!
            </h3>
            <p className="text-stone-500 dark:text-stone-400">
              Пройдено {sessionDone.length} карточек
            </p>
          </>
        )}
        <div className="flex justify-center gap-3 mt-4">
          {filter === 'due' && dueCount === 0 && (
            <button onClick={() => { setFilter('all'); restart(); }}
              className="btn-secondary text-sm">
              Повторить все карточки
            </button>
          )}
          <button onClick={restart} className="btn-primary text-sm">
            Начать заново
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-4 text-stone-500 dark:text-stone-400">
          <span>Карточка {idx + 1} / {deck.length}</span>
          <span className="text-green-600 dark:text-green-400">✓ {knownCount} знаю</span>
          {dueCount > 0 && <span className="text-amber-600 dark:text-amber-400">⏰ {dueCount} на сегодня</span>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setFilter(f => f === 'due' ? 'all' : 'due'); restart(); }}
            className="text-xs btn-ghost">
            {filter === 'due' ? 'Все карточки' : 'Только к повторению'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-wine-600 rounded-full transition-all duration-300"
          style={{ width: `${((idx) / deck.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div
        className="cursor-pointer select-none"
        onClick={() => setFlipped(f => !f)}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative min-h-[220px] transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-6 flex flex-col justify-center items-center text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-3">
              {current.difficulty === 'easy' ? '🟢' : current.difficulty === 'medium' ? '🟡' : '🔴'} {current.moduleId}
            </div>
            <p className="text-lg font-semibold text-stone-800 dark:text-stone-200">{current.front}</p>
            {current.hint && (
              <p className="mt-3 text-sm text-stone-400 dark:text-stone-500 italic">Подсказка: {current.hint}</p>
            )}
            <p className="mt-4 text-xs text-stone-400">Нажми, чтобы увидеть ответ</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-wine-300 dark:border-wine-700 bg-wine-50 dark:bg-wine-950/30 p-6 flex flex-col justify-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="text-xs text-wine-600 dark:text-wine-400 uppercase tracking-wide mb-3">Ответ</div>
            <p className="text-base text-stone-800 dark:text-stone-200 whitespace-pre-line">{current.back}</p>
          </div>
        </div>
      </div>

      {/* Rating buttons — only show when flipped */}
      <div className={`grid grid-cols-4 gap-2 transition-opacity duration-300 ${flipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {RATINGS.map(r => (
          <button
            key={r.value}
            onClick={() => handleRate(r.value)}
            className={`border rounded-xl p-2 text-center transition-colors ${r.color}`}
          >
            <div className="font-semibold text-sm">{r.label}</div>
            <div className="text-xs opacity-75">{r.desc}</div>
          </button>
        ))}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {current.tags.map(t => (
          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
            #{t}
          </span>
        ))}
      </div>
    </div>
  );
}

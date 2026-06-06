import { useState, useEffect } from 'react';

export default function LessonNotes({ lessonId }: { lessonId: string }) {
  const key = `notes-${lessonId}`;
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(key) || '';
    setNotes(stored);
    setHasSaved(!!stored);
  }, [key]);

  function save() {
    localStorage.setItem(key, notes);
    setHasSaved(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm text-stone-500 hover:text-wine-700 dark:text-stone-400 dark:hover:text-wine-400 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {open ? 'Скрыть заметки' : 'Мои заметки'}
        {hasSaved && !open && (
          <span className="w-2 h-2 rounded-full bg-wine-500 flex-shrink-0" title="Есть заметки" />
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Запишите свои наблюдения, вопросы к эксперименту, отклонения от ориентиров..."
            className="input h-32 resize-y text-sm font-normal"
          />
          <div className="flex items-center gap-2">
            <button onClick={save} className="btn-secondary text-xs">
              {saved ? '✓ Сохранено' : 'Сохранить'}
            </button>
            {notes && (
              <button
                onClick={() => { setNotes(''); setHasSaved(false); localStorage.removeItem(key); }}
                className="text-xs text-stone-400 hover:text-red-500 transition-colors"
              >
                Очистить
              </button>
            )}
            <span className="text-xs text-stone-400 ml-auto">Хранится в браузере</span>
          </div>
        </div>
      )}
    </div>
  );
}

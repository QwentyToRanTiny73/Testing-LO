/**
 * Прогресс обучения в localStorage — единая точка чтения и записи.
 *
 * До этого каждый компонент разбирал ключи сам, обычно без try/catch: в
 * приватном режиме браузера или при повреждённом JSON страница падала.
 * Здесь все обращения защищены и возвращают безопасные значения по умолчанию.
 */

const PROGRESS_KEY = 'lesson-progress';
const LAST_KEY = 'last-lesson';

export interface LastLesson {
  id: string;
  href: string;
  title: string;
  moduleTitle: string;
  courseId: string;
  courseTitle: string;
  at: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* приватный режим или переполнение — прогресс просто не сохранится */
  }
}

export function readProgress(): Record<string, boolean> {
  const p = read<Record<string, boolean>>(PROGRESS_KEY, {});
  return p && typeof p === 'object' ? p : {};
}

export function isComplete(lessonId: string): boolean {
  return !!readProgress()[lessonId];
}

/** Отметить урок пройденным (или снять отметку) и оповестить остальные виджеты. */
export function setComplete(lessonId: string, done = true): void {
  const p = readProgress();
  if (done) p[lessonId] = true;
  else delete p[lessonId];
  write(PROGRESS_KEY, p);
  document.dispatchEvent(new CustomEvent('lesson-completed', { detail: { lessonId, done } }));
  window.dispatchEvent(new StorageEvent('storage', { key: PROGRESS_KEY }));
}

export function readLastLesson(): LastLesson | null {
  const l = read<LastLesson | null>(LAST_KEY, null);
  return l && typeof l.href === 'string' && typeof l.title === 'string' ? l : null;
}

export function writeLastLesson(l: Omit<LastLesson, 'at'>): void {
  write(LAST_KEY, { ...l, at: Date.now() });
}

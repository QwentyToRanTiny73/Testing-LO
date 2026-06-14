// Course registry — Skillbox-style multi-course platform.
// Course 1 (praktikum) is the original practitioner course, kept as-is.
// Course 2 (enologiya) is the new science-of-wine track.

export interface CourseAccent {
  /** Hero gradient (full literal Tailwind classes for purge safety) */
  gradient: string;
  /** Accent text colour */
  text: string;
  /** Solid accent background (buttons / progress) */
  bg: string;
  bgHover: string;
  /** Soft tinted background for chips / cards */
  soft: string;
  /** Border accent on hover */
  borderHover: string;
  /** Ring / badge */
  badge: string;
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  /** Уровень: «Практический» / «Научный» */
  level: string;
  /** Короткая подпись формата длительности */
  durationLabel: string;
  /** Для кого курс */
  audience: string[];
  /** Чему вы научитесь */
  outcomes: string[];
  /** Формат обучения (Skillbox-style) */
  format: { icon: string; label: string; desc: string }[];
  accent: CourseAccent;
  order: number;
  /**
   * Тип курса. 'content' — обычный курс из модулей и уроков (контент-коллекция).
   * 'simulation' — интерактивный курс-тренажёр (отдельная страница, без уроков).
   * По умолчанию — 'content'.
   */
  kind?: 'content' | 'simulation';
  /** Куда ведёт карточка курса (для simulation — на страницу тренажёра). */
  href?: string;
  /** Произвольные чипы статистики для каталога (для курсов без уроков). */
  stats?: { label: string; value: string }[];
}

export const COURSE_PRAKTIKUM = 'praktikum';
export const COURSE_ENOLOGIYA = 'enologiya';
export const COURSE_SIMULYATSIYA = 'simulyatsiya';

export const courses: Course[] = [
  {
    id: COURSE_PRAKTIKUM,
    title: 'Практикум технолога',
    subtitle: 'Классическая технология · школа Магарача',
    description:
      'Прикладной курс по технологии виноделия: от приёмки винограда до розлива. Культурные дрожжи, стандартный арсенал обработок, расчёты и калькуляторы, планировщик урожая. Все числовые значения даны как ориентиры, а не нормы.',
    icon: '🍷',
    level: 'Практический',
    durationLabel: '15 модулей · практика на каждом этапе',
    audience: [
      'Начинающие технологи и виноделы малых хозяйств',
      'Студенты профильных специальностей',
      'Энтузиасты домашнего виноделия, желающие системности',
    ],
    outcomes: [
      'Вести технологический процесс от приёмки до розлива',
      'Рассчитывать дозы SO₂, бентонита, корректировать сахар и кислотность',
      'Диагностировать застрявшее брожение и дефекты, выбирать коррекцию',
      'Планировать переработку урожая по лотам',
    ],
    format: [
      { icon: '📖', label: 'Уроки', desc: 'Структурированные модули с ключевыми выводами' },
      { icon: '🧮', label: 'Калькуляторы', desc: '6 практических инструментов для расчётов' },
      { icon: '🃏', label: 'Флэш-карты', desc: 'Интервальное повторение по алгоритму SM-2' },
      { icon: '📅', label: 'Планировщик урожая', desc: 'Сценарии переработки урожая 2026' },
    ],
    accent: {
      gradient: 'from-wine-900 via-wine-800 to-oak-900',
      text: 'text-wine-700 dark:text-wine-400',
      bg: 'bg-wine-700',
      bgHover: 'hover:bg-wine-800',
      soft: 'bg-wine-50 dark:bg-wine-950/30',
      borderHover: 'hover:border-wine-300 dark:hover:border-wine-700',
      badge: 'bg-wine-100 text-wine-800 dark:bg-wine-950/50 dark:text-wine-300',
    },
    order: 1,
  },
  {
    id: COURSE_ENOLOGIYA,
    title: 'Энология: научные основы',
    subtitle: 'Химия, биохимия и микробиология вина',
    description:
      'Научный курс об устройстве вина: что происходит на молекулярном уровне при созревании винограда, брожении, выдержке и старении. Курс объясняет «почему» за технологическими приёмами — фундамент для осознанных решений у пресса и в погребе.',
    icon: '🔬',
    level: 'Научный',
    durationLabel: '8 модулей · от молекулы к бокалу',
    audience: [
      'Практикующие виноделы, желающие понимать механизмы',
      'Технологи, переходящие от рецептов к принципам',
      'Студенты энологии и пищевой химии',
    ],
    outcomes: [
      'Понимать химический состав винограда и сусла',
      'Объяснять биохимию брожения и метаболизм дрожжей',
      'Разбираться в фенольной химии, цвете и его стабильности',
      'Управлять окислением, кислотно-щелочным равновесием и стабильностью на основе механизмов',
    ],
    format: [
      { icon: '🧬', label: 'Механизмы', desc: 'Объяснение процессов на молекулярном уровне' },
      { icon: '🎯', label: 'Ключевые выводы', desc: 'Главное из каждого урока — для активного повторения' },
      { icon: '🧠', label: 'Мнемоника', desc: 'Приёмы запоминания сложных закономерностей' },
      { icon: '❓', label: 'Метод Сократа', desc: 'Вопросы на понимание, а не на зубрёжку' },
    ],
    accent: {
      gradient: 'from-indigo-950 via-indigo-900 to-slate-900',
      text: 'text-indigo-700 dark:text-indigo-400',
      bg: 'bg-indigo-700',
      bgHover: 'hover:bg-indigo-800',
      soft: 'bg-indigo-50 dark:bg-indigo-950/30',
      borderHover: 'hover:border-indigo-300 dark:hover:border-indigo-700',
      badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300',
    },
    order: 2,
  },
  {
    id: COURSE_SIMULYATSIYA,
    title: 'Симулятор: от лозы до бутылки',
    subtitle: 'Интерактивный тренажёр принятия решений',
    description:
      'Проведите вино через весь цикл — от выбора срока сбора до розлива — принимая решения на каждом этапе. Каждый выбор меняет аромат, структуру, стабильность и чистоту вина; в конце вы получаете дегустационную оценку и разбор последствий. Два сценария: ароматическое белое и красное для выдержки.',
    icon: '🎮',
    level: 'Тренажёр',
    durationLabel: '2 сценария · ~9 этапов решений каждый',
    audience: [
      'Те, кто прошёл практикум и хочет «собрать» процесс целиком',
      'Виноделы, желающие проверить логику решений без риска для урожая',
      'Студенты — для закрепления причинно-следственных связей',
    ],
    outcomes: [
      'Видеть, как ранние решения каскадом влияют на финал',
      'Связывать выбор у пресса и в погребе с итоговым стилем вина',
      'Распознавать развилки, ведущие к дефектам, и избегать их',
      'Принимать решения под конкретный стиль: свежесть против структуры',
    ],
    format: [
      { icon: '🍇', label: 'Сценарии', desc: 'Ароматическое белое и красное для выдержки' },
      { icon: '🔀', label: 'Решения', desc: 'Развилки с реальными технологическими опциями' },
      { icon: '📊', label: 'Метрики', desc: 'Аромат, свежесть, структура, стабильность, чистота' },
      { icon: '🏅', label: 'Оценка', desc: 'Дегустационный итог и разбор последствий' },
    ],
    accent: {
      gradient: 'from-emerald-900 via-teal-800 to-emerald-950',
      text: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-700',
      bgHover: 'hover:bg-emerald-800',
      soft: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
    },
    order: 3,
    kind: 'simulation',
    href: 'simulator',
    stats: [
      { label: 'сценария', value: '2' },
      { label: 'этапов решений', value: '18' },
      { label: 'вариантов выбора', value: '60+' },
    ],
  },
];

export function getCourseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id);
}

export const DEFAULT_COURSE = COURSE_PRAKTIKUM;

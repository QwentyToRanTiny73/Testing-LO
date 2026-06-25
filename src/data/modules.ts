import { COURSE_PRAKTIKUM, COURSE_ENOLOGIYA } from './courses';

export interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  /** Курс, к которому относится модуль */
  course: string;
}

export const modules: Module[] = [
  // ───────────────────────── Курс 1: Практикум технолога (Магарач) ─────────────────────────
  {
    id: 'priem-drobl-press',
    title: 'Приёмка, дробление, прессование',
    description: 'Технология первичной переработки винограда: контроль сырья, дробление, отделение гребней, прессование.',
    icon: '🍇',
    order: 1,
    course: COURSE_PRAKTIKUM,
  },
  {
    id: 'fermenty',
    title: 'Ферментные препараты',
    description: 'Пектолитические ферменты, β-глюканазы, ассортимент Martin Vialatte; дозы, температурные окна, ингибирование.',
    icon: '🧪',
    order: 2,
    course: COURSE_PRAKTIKUM,
  },
  {
    id: 'deburb-osvetlenie',
    title: 'Дебурбаж и осветление сусла',
    description: 'Мутность NTU, флотация, холодный отстой, центрифугирование. Цели и методы преброжного осветления.',
    icon: '🌊',
    order: 3,
    course: COURSE_PRAKTIKUM,
  },
  {
    id: 'drozhzhi',
    title: 'Культурные дрожжи и брожение',
    description: 'Расы Магарача 47-К, Феодосия-1-19; разводка ЖНК; азотное питание (DAP, органический азот).',
    icon: '🦠',
    order: 4,
    course: COURSE_PRAKTIKUM,
  },
  {
    id: 'temperatura-kinetika',
    title: 'Температурный режим и кинетика',
    description: 'Температурное управление брожением. Застрявшее брожение: диагностика и рестарт.',
    icon: '🌡️',
    order: 5,
    course: COURSE_PRAKTIKUM,
  },
  {
    id: 'ymf',
    title: 'Яблочно-молочное брожение',
    description: 'Стимуляция и блокировка ЯМБ. Управление диацетилом. Выбор стратегии для белых и красных вин.',
    icon: '🔬',
    order: 6,
    course: COURSE_PRAKTIKUM,
  },
  {
    id: 'so2',
    title: 'SO₂-менеджмент',
    description: 'Молекулярный SO₂, pH, связывающий комплекс. Расчёт дозы метабисульфита калия.',
    icon: '⚗️',
    order: 7,
    course: COURSE_PRAKTIKUM,
  },
  {
    id: 'okleyka',
    title: 'Оклейка и осветление вина',
    description: 'Бентонит, ПВПП, желатин, рыбий клей, казеин. Пробные оклейки и интерпретация результатов.',
    icon: '🏺',
    order: 8,
    course: COURSE_PRAKTIKUM,
  },
  {
    id: 'stabilizatsiya',
    title: 'Стабилизация вина',
    description: 'Тартратная стабилизация (холод, КМТ, КМЦ/метавинная кислота), белковая и коллоидная стабилизация.',
    icon: '❄️',
    order: 9,
    course: COURSE_PRAKTIKUM,
  },
  {
    id: 'filtratsiya',
    title: 'Фильтрация',
    description: 'Намывная, картонная (SF/SS/SSS), мембранная и стерильная фильтрация. Показатели и контроль.',
    icon: '🔍',
    order: 10,
    course: COURSE_PRAKTIKUM,
  },
  {
    id: 'vyderzhka',
    title: 'Выдержка и созревание',
    description: 'Ёмкости, sur lie, доливки, переливки, микрооксигенация. Химические изменения при выдержке.',
    icon: '🛢️',
    order: 11,
    course: COURSE_PRAKTIKUM,
  },
  {
    id: 'rozliv',
    title: 'Розлив и бутылочная стабильность',
    description: 'Контроль растворённого кислорода (TPO/DO), инертизация, выбор пробки. Стабильность после розлива.',
    icon: '🍾',
    order: 12,
    course: COURSE_PRAKTIKUM,
  },
  {
    id: 'analitika',
    title: 'Аналитический контроль',
    description: 'Методы анализа по ГОСТ Р и ОИВ. Ключевые показатели на каждом этапе производства.',
    icon: '📊',
    order: 13,
    course: COURSE_PRAKTIKUM,
  },
  {
    id: 'sorta',
    title: 'Сорта и сырьё',
    description: 'Кокур белый, Мускат белый, Каберне Совиньон, Саперави — технологические особенности переработки.',
    icon: '🌿',
    order: 14,
    course: COURSE_PRAKTIKUM,
  },
  {
    id: 'defekty',
    title: 'Дефекты и экстренная коррекция',
    description: 'Окисленность, H₂S, Brett, помутнения, металлические кассы, ЛК. Пороги вмешательства и методы коррекции.',
    icon: '⚠️',
    order: 15,
    course: COURSE_PRAKTIKUM,
  },
  {
    id: 'stili-vina',
    title: 'Стили и виды вина',
    description: 'Что формирует стиль: цвет и контакт с кожицей, игристость, сахар, крепление, климат. Розе, оранж, блан де нуар, петнат, игристые, южные и северные стили.',
    icon: '🥂',
    order: 16,
    course: COURSE_PRAKTIKUM,
  },

  // ───────────────────────── Курс 2: Энология — научные основы виноделия ─────────────────────────
  {
    id: 'eno-vinograd-suslo',
    title: 'Химия винограда и сусла',
    description: 'Состав ягоды: сахара, кислоты, фенолы, азотистые вещества, ароматические предшественники. Что попадает в сусло и почему.',
    icon: '🍇',
    order: 1,
    course: COURSE_ENOLOGIYA,
  },
  {
    id: 'eno-brozhenie-biohimiya',
    title: 'Биохимия спиртового брожения',
    description: 'Гликолиз, метаболизм дрожжей, кинетика брожения, побочные продукты: глицерин, высшие спирты, эфиры, сероводород.',
    icon: '🧬',
    order: 2,
    course: COURSE_ENOLOGIYA,
  },
  {
    id: 'eno-mikrobiologiya',
    title: 'Микробиология вина',
    description: 'Saccharomyces и non-Saccharomyces, молочнокислые и уксуснокислые бактерии, Brettanomyces. Экология брожения.',
    icon: '🦠',
    order: 3,
    course: COURSE_ENOLOGIYA,
  },
  {
    id: 'eno-kisloty-ph',
    title: 'Кислоты, pH и буферные системы',
    description: 'Винная, яблочная, молочная кислоты; равновесия диссоциации; буферная ёмкость; связь pH, TK и стабильности.',
    icon: '⚗️',
    order: 4,
    course: COURSE_ENOLOGIYA,
  },
  {
    id: 'eno-fenoly-cvet',
    title: 'Фенольные соединения и цвет',
    description: 'Антоцианы, танины, флаванолы; копигментация; полимеризация и стабилизация цвета; химия вяжущести и горечи.',
    icon: '🍷',
    order: 5,
    course: COURSE_ENOLOGIYA,
  },
  {
    id: 'eno-redoks-kislorod',
    title: 'Окисление, восстановление и химия SO₂',
    description: 'Реакции с кислородом, фенольное окисление, роль металлов, восстановительные тона; химия и формы SO₂.',
    icon: '🔁',
    order: 6,
    course: COURSE_ENOLOGIYA,
  },
  {
    id: 'eno-aromat',
    title: 'Ароматические соединения вина',
    description: 'Терпены, тиолы, эфиры, метоксипиразины, норизопреноиды; связанные предшественники; пороги восприятия.',
    icon: '🌸',
    order: 7,
    course: COURSE_ENOLOGIYA,
  },
  {
    id: 'eno-kolloidy-stabilnost',
    title: 'Коллоиды, белки и стабильность',
    description: 'Белковые и тартратные помутнения, полисахариды, коллоидные явления; механизмы стабилизации с точки зрения химии.',
    icon: '💎',
    order: 8,
    course: COURSE_ENOLOGIYA,
  },
];

export function getModuleById(id: string): Module | undefined {
  return modules.find((m) => m.id === id);
}

export function getModulesByCourse(courseId: string): Module[] {
  return modules
    .filter((m) => m.course === courseId)
    .sort((a, b) => a.order - b.order);
}

export function getCourseOfModule(moduleId: string): string | undefined {
  return getModuleById(moduleId)?.course;
}

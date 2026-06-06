import type { MindNode } from '../components/learning/MindMap';

const BASE = '/Testing-LO/';

export const mindMaps: Record<string, MindNode> = {
  'so2': {
    id: 'so2-root',
    label: '⚗️ SO₂-менеджмент',
    icon: '',
    children: [
      {
        id: 'so2-forms',
        label: 'Формы SO₂',
        children: [
          { id: 'so2-free', label: 'Свободный SO₂', children: [
            { id: 'so2-mol', label: 'Молекулярный (активный)', href: `${BASE}course/so2/01-so2-menedzhment` },
            { id: 'so2-bisulf', label: 'Бисульфит HSO₃⁻' },
          ]},
          { id: 'so2-bound', label: 'Связанный SO₂', children: [
            { id: 'so2-acetald', label: 'С ацетальдегидом (главное)' },
            { id: 'so2-pyruvate', label: 'С пируватом' },
            { id: 'so2-gluconic', label: 'С глюконовой к-той (Botrytis)' },
          ]},
        ],
      },
      {
        id: 'so2-function',
        label: 'Функции',
        children: [
          { id: 'so2-antioxidant', label: 'Антиоксидант' },
          { id: 'so2-antimicrobial', label: 'Антисептик (молекулярная форма)' },
          { id: 'so2-antioxidase', label: 'Ингибитор лакказ (Botrytis)' },
        ],
      },
      {
        id: 'so2-calculation',
        label: 'Расчёт',
        children: [
          { id: 'so2-formula', label: '[SO₂]мол = [SO₂]св / (1 + 10^(pH−1,77))' },
          { id: 'so2-target', label: 'Цель: 0,5–0,8 мг/л мол. (ориентир)' },
          { id: 'so2-kms', label: 'КМС: 57,6% SO₂', href: `${BASE}tools#so2` },
        ],
      },
      {
        id: 'so2-practice',
        label: 'Практика',
        children: [
          { id: 'so2-ripper', label: 'Анализ: метод Риппера (своб.)', href: `${BASE}course/analitika/02-metody-so2` },
          { id: 'so2-aspiration', label: 'Аспирация (общий SO₂)' },
          { id: 'so2-frequency', label: 'Контроль после каждого вмешательства' },
        ],
      },
    ],
  },

  'okleyka': {
    id: 'okleyka-root',
    label: '🏺 Оклейка и осветление',
    children: [
      {
        id: 'okleyka-bentonit',
        label: 'Бентонит',
        children: [
          { id: 'ok-mechanism', label: 'Монтмориллонит → (-) заряд → (+) белки' },
          { id: 'ok-heat-test', label: 'Тепловой тест 80°C×30мин', href: `${BASE}course/okleyka/01-bentonit` },
          { id: 'ok-dose', label: 'Подбор дозы: пробная оклейка', href: `${BASE}tools#bentonite` },
          { id: 'ok-bentonit-inhibit', label: '⚠️ Добавлять ПОСЛЕ ферментов' },
        ],
      },
      {
        id: 'okleyka-pvpp',
        label: 'ПВПП',
        children: [
          { id: 'ok-pvpp-mech', label: 'Адсорбирует полифенолы (буреющие)' },
          { id: 'ok-pvpp-use', label: 'Профилактика буреющего помутнения' },
          { id: 'ok-pvpp-white', label: 'Особенно для белых и розе', href: `${BASE}course/okleyka/02-pvpp-kazein` },
        ],
      },
      {
        id: 'okleyka-other',
        label: 'Другие оклейки',
        children: [
          { id: 'ok-gelatin', label: 'Желатин → снижает таннины (красные)' },
          { id: 'ok-casein', label: 'Казеин → коррекция цвета, окисленность' },
          { id: 'ok-fishglue', label: 'Рыбий клей → мягкое осветление' },
        ],
      },
    ],
  },

  'drozhzhi': {
    id: 'drozhzhi-root',
    label: '🦠 Дрожжи и брожение',
    children: [
      {
        id: 'dr-selection',
        label: 'Выбор штамма',
        children: [
          { id: 'dr-magarach', label: 'Магарач 47-К (белые, красные)', href: `${BASE}course/drozhzhi/01-kulturnye-drozhzhi` },
          { id: 'dr-feodosiya', label: 'Феодосия-1-19' },
          { id: 'dr-aroma', label: 'Ароматические (Мускат → Lalvin 71B)' },
        ],
      },
      {
        id: 'dr-nutrition',
        label: 'Питание дрожжей',
        children: [
          { id: 'dr-yan', label: 'YAN: усвояемый азот', href: `${BASE}course/drozhzhi/02-azot-pitanie` },
          { id: 'dr-dap', label: 'DAP: диаммоний фосфат (неорган.)' },
          { id: 'dr-organic', label: 'Органический азот (Fermaid O)' },
          { id: 'dr-h2s', label: 'Дефицит YAN → H₂S' },
        ],
      },
      {
        id: 'dr-rehydration',
        label: 'Подготовка разводки',
        children: [
          { id: 'dr-reh-temp', label: 'Регидратация: 35-40°C (ориентир)' },
          { id: 'dr-reh-shock', label: 'Перепад < 10°C при добавлении в сусло' },
          { id: 'dr-inoculation', label: 'Норма внесения: 20-30 г/гл (ориентир)' },
        ],
      },
      {
        id: 'dr-stuck',
        label: 'Застрявшее брожение',
        href: `${BASE}course/temperatura-kinetika/02-zastryavsheye-brozheniye`,
        children: [
          { id: 'dr-stuck-causes', label: 'Причины: температура, алкоголь, YAN, pH' },
          { id: 'dr-restart', label: 'Рестарт: аклиматизация + постепенный ввод' },
        ],
      },
    ],
  },

  'defekty': {
    id: 'defekty-root',
    label: '⚠️ Дефекты вина',
    children: [
      {
        id: 'def-oxidation',
        label: 'Окисленность',
        children: [
          { id: 'def-ox-signs', label: 'Признаки: коричневый цвет, мадера, ацетальдегид' },
          { id: 'def-ox-cause', label: 'Причина: лакказы, кислород, низкий SO₂' },
          { id: 'def-ox-prevent', label: 'Профилактика: SO₂ + инертизация + контроль TPO' },
        ],
      },
      {
        id: 'def-reductive',
        label: 'H₂S / восстановленность',
        href: `${BASE}course/defekty/01-defekty-obzor`,
        children: [
          { id: 'def-h2s', label: 'H₂S: тухлые яйца, порог ~50 мкг/л' },
          { id: 'def-merkapt', label: 'Меркаптаны: лук/резина (труднее убрать)' },
          { id: 'def-h2s-fix', label: 'Лечение: CuSO₄ 0,1-0,5 мг/л (ориентир)', href: `${BASE}course/defekty/02-korreksiya` },
        ],
      },
      {
        id: 'def-brett',
        label: 'Brett (Brettanomyces)',
        children: [
          { id: 'def-brett-signs', label: 'Конюшня, пластырь, 4-EP/4-EG' },
          { id: 'def-brett-threshold', label: 'Порог 4-EP: ~500 мкг/л (ориентир)' },
          { id: 'def-brett-prevent', label: 'Профилактика: SO₂ + гигиена бочек + холод' },
        ],
      },
      {
        id: 'def-hazes',
        label: 'Помутнения',
        children: [
          { id: 'def-protein', label: 'Белковое → тепловой тест → бентонит' },
          { id: 'def-tartrate', label: 'Тартратные кристаллы → не дефект!' },
          { id: 'def-microbial', label: 'Микробное → посев + SO₂ + фильтрация' },
        ],
      },
    ],
  },
};

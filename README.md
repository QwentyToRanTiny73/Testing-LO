# Курс по технологии виноделия

Статический обучающий сайт-курс по виноделию на Astro + Tailwind CSS, развёртываемый на GitHub Pages.

**Живая версия:** https://QwentyToRanTiny73.github.io/Testing-LO/

## Быстрый старт

```bash
# Клонировать репозиторий
git clone https://github.com/QwentyToRanTiny73/Testing-LO.git
cd Testing-LO

# Установить зависимости
npm install

# Запустить режим разработки
npm run dev
# → http://localhost:4321/Testing-LO/

# Построить и просмотреть продакшн-версию
npm run build
npm run preview
# → http://localhost:4321/Testing-LO/
```

## Как добавить урок

1. **Создайте файл** в `src/content/lessons/<module-id>/<N>-<slug>.md`:

```
src/content/lessons/so2/03-praktika.md
```

2. **Добавьте frontmatter** (все поля обязательны):

```yaml
---
title: "Практика сульфитирования"
module: "so2"           # id модуля из modules.ts
order: 3                # порядок в модуле
summary: "Краткое описание урока"
tags: ["SO2", "практика"]
difficulty: средний     # базовый | средний | продвинутый
durationMin: 25
status: готово          # готово | черновик
updated: 2024-10-15
---
```

3. **Напишите контент** в Markdown. Поддерживаются:
   - Таблицы
   - Блоки кода
   - Изображения из `src/assets/`
   - Callout-блоки (см. ниже)

4. **Callout-блоки** для выделения важных моментов:

```markdown
:::important
Важно: ...
:::

:::reference
Ориентир: все значения — ориентиры, требующие калибровки.
:::

:::gost
ГОСТ / ОИВ: ...
:::

:::warning
Предупреждение: ...
:::
```

5. **Запустите сборку** — урок появится автоматически в нужном модуле, TOC и поиске.

## Список модулей

| ID | Название |
|---|---|
| `priem-drobl-press` | Приёмка, дробление, прессование |
| `fermenty` | Ферментные препараты |
| `deburb-osvetlenie` | Дебурбаж и осветление сусла |
| `drozhzhi` | Культурные дрожжи и брожение |
| `temperatura-kinetika` | Температурный режим и кинетика |
| `ymf` | Яблочно-молочное брожение |
| `so2` | SO₂-менеджмент |
| `okleyka` | Оклейка и осветление вина |
| `stabilizatsiya` | Стабилизация |
| `filtratsiya` | Фильтрация |
| `vyderzhka` | Выдержка и созревание |
| `rozliv` | Розлив и бутылочная стабильность |
| `analitika` | Аналитический контроль |
| `sorta` | Сорта и сырьё |
| `defekty` | Дефекты и коррекция |

## Данные планировщика урожая

Партии урожая 2026 хранятся в `src/data/harvest2026.ts`. Редактируйте этот файл для:
- Изменения сортов, объёмов, дат
- Добавления новых лотов
- Изменения этапов обработки

## Включение GitHub Pages

1. Перейдите в **Settings → Pages** репозитория
2. В разделе **Source** выберите **GitHub Actions**
3. Пуш в ветку `main` автоматически запустит деплой

## Структура проекта

```
src/
├── components/
│   ├── calculators/      # React-острова (калькуляторы)
│   ├── course/           # Компоненты курса (TOC, прогресс, навигация)
│   └── Header.astro / Footer.astro / SearchModal.astro
├── content/
│   ├── config.ts         # Zod-схемы коллекций
│   ├── lessons/          # Уроки по модулям
│   └── glossary/         # Термины глоссария
├── data/
│   ├── modules.ts        # Метаданные 15 модулей
│   └── harvest2026.ts    # Данные планировщика
├── layouts/
│   ├── BaseLayout.astro  # Базовый layout
│   └── LessonLayout.astro
├── pages/                # Страницы сайта
└── styles/global.css
```

## Технологии

- **Astro** — статическая генерация, Content Collections
- **Tailwind CSS** — стили, тёмная тема
- **React** — интерактивные калькуляторы (острова)
- **Pagefind** — полнотекстовый поиск
- **localStorage** — прогресс без бэкенда

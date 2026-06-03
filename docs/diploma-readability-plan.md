# План підготовки коду до захисту диплома

## Поточний стан

- Проєкт запускається Docker-first: application container + SQLite database у Docker volume `/app/data/aurora.sqlite3`.
- Публічний сайт, адмінка, каталог, кошик, checkout, mock-payment і конструктор працюють як React SPA поверх Express API.
- Небезпечних нескінченних UI-loop'ів під час аудиту не знайдено. Наявні цикли використовуються для рендеру списків, debounce/timeout розрахунків, autosave-черги slot editor, animation frame під час drag і серверної генерації унікальних slug.
- Основний принцип підготовки: не змінювати поведінку сайту, а робити код дрібнішим, зрозумілішим і зручним для пояснення комісії.

## Що вже спрощено

- Client route resolver у `client/src/main.jsx` переведено на масив `ROUTE_DEFINITIONS`, без довгого вкладеного ternary.
- Express SPA routes у `server/routes/pages.js` переведено на `PAGE_ROUTES`; невідомі public URL віддають React, а `/api/*` зберігає JSON 404.
- SQL debug більше не прив'язаний до `NODE_ENV=development`; його явно вмикає `DB_DEBUG=true`, тому Docker-логи чистіші для демонстрації.
- `DEFAULT_DATA` конструктора винесено з JSON-store у `server/modules/constructor/constructor-default-data.js`.
- `constructor-json.service.js` розділено на фасад і маленькі domain-сервіси: normalizers, pricing, assets, admin CRUD.
- Публічний `constructor-route.jsx` перетворено на shell; робоча сторінка, URL-state, copy helpers, type icon і slots UI живуть у `client/src/features/constructor`.
- `library-sections.jsx` більше не є JSX-монолітом: він тільки re-export API, а секції розділені на `stone`, `jewelry`, `pricing`, `workspace` і `asset` файли.
- Public constructor CSS винесено в `client/src/styles/constructor-page.css`; у `styles.css` залишено спільні base/shared правила та preview-стилі, які потрібні іншим сторінкам.
- По source-файлах додані короткі українські коментарі: зверху файлу описано відповідальність, над іменованими функціями описано їхню роль.

## Архітектурний принцип

- Route-файли зберігають orchestration: layout, завантаження сторінки, navigation і підключення feature-компонентів.
- `features/*` містять presentational-компоненти, pure helpers, URL-state, shape-builders і локальні domain утиліти.
- `server/modules/*/*.routes.js` описують HTTP-контракт, а `*.service.js` тримають бізнес-логіку.
- Великі default/config дані не змішуються з CRUD, store або pricing logic.
- Домени CSS мають власні файли в `client/src/styles/*.css`; нові адресні стилі не треба повертати в загальний `styles.css`.

## Наступні безпечні покращення

1. Продовжити дроблення `styles.css`: переносити тільки ті блоки, для яких зрозумілий owner і немає спільного використання іншими маршрутами.
2. Уніфікувати дублікати guest-cart/cart-count helper'ів у старіших routes, не змінюючи формат `localStorage`.
3. Додати коротку архітектурну схему у документацію: browser -> React routes/features -> Express routes/services -> SQLite/Docker volume.
4. Перевірити документацію `docs/architecture/*`, щоб усі описи відповідали актуальному Docker + SQLite runtime.

## Як презентувати код комісії

- Починати з `README.md`: запуск через Docker і основні сценарії користувача.
- Показати `client/src/main.jsx`: route map і lazy-завантаження сторінок.
- Показати `server/routes/pages.js`: сервер коректно віддає SPA для прямого відкриття URL.
- Показати `server/modules/constructor/constructor-json.service.js`: фасад, який збирає маленькі сервіси конструктора.
- Показати `client/src/features/constructor`: публічний конструктор розкладений на page, URL-state, copy і UI-компоненти.
- Показати `client/src/features/admin-constructor/library-sections.jsx`: старий імпорт сумісний, але JSX розділений по доменах.

## Перевірка готовності

- `npm test` має проходити без падінь.
- `npm run build:client` має збирати React assets без помилок.
- `docker compose up --build -d app` має запускати сайт із SQLite-базою у Docker volume.
- Browser smoke має пройти для `/`, `/catalog`, `/constructor`, `/cart`, `/checkout`, `/admin/constructor`, `/not-found-diploma-smoke`.
- У UI не має бути `�` або битої кирилиці, route-loading не має зависати, а unknown `/api/*` має повертати JSON 404.

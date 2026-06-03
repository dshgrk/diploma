const pptxgen = require('pptxgenjs');
const { imageSize } = require('image-size');
const fs = require('fs');
const path = require('path');

const out = 'E:/UNIVERSITY/4 kurs/2 семестр/курсовая/Презентація_ТВПЗ_Гірка_захист_v4.pptx';
const assetDir = 'E:/UNIVERSITY/4 kurs/2 семестр/курсовая/ppt_assets';
const imgs = Array.from({ length: 11 }, (_, i) => path.join(assetDir, `image${i + 1}.png`));

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'OpenAI Codex';
pptx.company = 'ХАІ';
pptx.subject = 'Курсова робота з тестування та верифікації ПЗ';
pptx.title = 'Верифікація та тестування вебсистеми продажу авторських прикрас з конструктором дизайну';
pptx.lang = 'uk-UA';
pptx.theme = {
  headFontFace: 'Georgia',
  bodyFontFace: 'Arial',
  lang: 'uk-UA'
};

const C = {
  bg: 'F7F1E8',
  paper: 'FFFDFC',
  ink: '1E241F',
  muted: '6B675F',
  accent: 'B56A3C',
  accent2: 'D5BFA3',
  green: '5E705F',
  line: 'D9CCBC',
  soft: 'EFE6DA'
};

function base(slide, section, pageTitle) {
  slide.background = { color: C.bg };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.45, fill: { color: C.ink }, line: { color: C.ink } });
  slide.addText(section || 'Aurora Atelier / QA Defense', { x: 0.45, y: 0.12, w: 5.5, h: 0.18, fontFace: 'Arial', fontSize: 10, color: 'F8F5F0', bold: false });
  slide.addShape(pptx.ShapeType.line, { x: 0.55, y: 7.02, w: 12.2, h: 0, line: { color: C.line, pt: 1.2 } });
  if (pageTitle) {
    slide.addText(pageTitle, { x: 0.65, y: 0.68, w: 7.5, h: 0.45, fontFace: 'Georgia', fontSize: 24, bold: true, color: C.ink });
  }
}

function addBulletList(slide, items, x, y, w, h, opts = {}) {
  const runs = [];
  items.forEach((t) => {
    runs.push({ text: t, options: { bullet: { indent: 14 }, breakLine: true } });
  });
  slide.addText(runs, {
    x, y, w, h,
    fontFace: 'Arial', fontSize: opts.fontSize || 20, color: C.ink,
    paraSpaceAfterPt: opts.after || 10, breakLine: false, valign: 'top', margin: 3
  });
}

function fitContain(imgPath, x, y, w, h) {
  const dim = imageSize(fs.readFileSync(imgPath));
  const rw = w / dim.width;
  const rh = h / dim.height;
  const r = Math.min(rw, rh);
  const nw = dim.width * r;
  const nh = dim.height * r;
  return { path: imgPath, x: x + (w - nw) / 2, y: y + (h - nh) / 2, w: nw, h: nh };
}

function addImageCard(slide, imgPath, x, y, w, h, caption) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: C.paper }, line: { color: C.line, pt: 1 } });
  slide.addImage(fitContain(imgPath, x + 0.08, y + 0.08, w - 0.16, h - 0.42));
  slide.addText(caption, { x: x + 0.12, y: y + h - 0.32, w: w - 0.24, h: 0.18, fontFace: 'Arial', fontSize: 9, color: C.muted, align: 'center' });
}

// Slide 1
{
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: C.bg }, line: { color: C.bg } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.55, fill: { color: C.ink }, line: { color: C.ink } });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: 0.95, w: 5.2, h: 5.75, rectRadius: 0.08, fill: { color: C.paper }, line: { color: C.line, pt: 1.2 } });
  s.addImage(fitContain(imgs[1], 0.95, 1.18, 4.7, 3.45));
  s.addShape(pptx.ShapeType.roundRect, { x: 6.25, y: 1.1, w: 6.1, h: 5.45, rectRadius: 0.08, fill: { color: 'F8F3EC' }, line: { color: 'F8F3EC' } });
  s.addText('Курсова робота', { x: 6.6, y: 1.45, w: 2.2, h: 0.25, fontFace: 'Arial', fontSize: 14, color: C.accent, bold: true, allCaps: true });
  s.addText('Верифікація та тестування вебсистеми продажу авторських прикрас з конструктором дизайну', { x: 6.6, y: 1.85, w: 5.15, h: 1.75, fontFace: 'Georgia', fontSize: 24, bold: true, color: C.ink, valign: 'mid' });
  s.addText('Aurora Atelier', { x: 6.62, y: 3.78, w: 2.1, h: 0.32, fontFace: 'Georgia', fontSize: 20, italic: true, color: C.green });
  s.addText('Дисципліна: «Тестування та верифікація ПЗ»\nСтудентка: Гірка Д.М., група 642п\nСпеціальність: 121 Інженерія програмного забезпечення\n2026 рік', { x: 6.62, y: 4.28, w: 4.9, h: 1.3, fontFace: 'Arial', fontSize: 15, color: C.ink, breakLine: true, paraSpaceAfterPt: 8 });
  s.addShape(pptx.ShapeType.line, { x: 6.62, y: 5.95, w: 4.8, h: 0, line: { color: C.accent, pt: 1.5 } });
}

// Slide 2
{
  const s = pptx.addSlide();
  base(s, 'Логіка дослідження', 'Мета та завдання роботи');
  s.addShape(pptx.ShapeType.roundRect, { x: 0.72, y: 1.35, w: 4.1, h: 4.95, rectRadius: 0.06, fill: { color: C.paper }, line: { color: C.line, pt: 1 } });
  s.addText('Мета', { x: 1.0, y: 1.65, w: 1.2, h: 0.3, fontFace: 'Georgia', fontSize: 20, bold: true, color: C.accent });
  s.addText('Підготувати повний комплект документації з тестування, сформувати вимоги, побудувати плани перевірок і підтвердити якість ПЗ реальними тестами.', { x: 1.0, y: 2.05, w: 3.5, h: 2.2, fontFace: 'Arial', fontSize: 20, color: C.ink, valign: 'mid' });
  s.addShape(pptx.ShapeType.roundRect, { x: 5.1, y: 1.35, w: 7.45, h: 4.95, rectRadius: 0.06, fill: { color: C.paper }, line: { color: C.line, pt: 1 } });
  s.addText('Ключові завдання', { x: 5.45, y: 1.65, w: 2.4, h: 0.3, fontFace: 'Georgia', fontSize: 20, bold: true, color: C.accent });
  addBulletList(s, [
    'Сформувати функціональні та нефункціональні вимоги до ПЗ.',
    'Побудувати RTM/RTMI та плани модульного, інтеграційного, системного й валідаційного тестування.',
    'Виконати автоматизовані та ручні перевірки ключових сценаріїв.',
    'Проаналізувати результати прогонів і сформулювати висновки щодо якості системи.'
  ], 5.38, 2.05, 6.65, 3.9, { fontSize: 18, after: 8 });
}

// Slide 3
{
  const s = pptx.addSlide();
  base(s, 'Об’єкт дослідження', 'Aurora Atelier: що саме тестувалося');
  s.addShape(pptx.ShapeType.roundRect, { x: 0.75, y: 1.4, w: 5.95, h: 5.15, rectRadius: 0.06, fill: { color: C.paper }, line: { color: C.line, pt: 1 } });
  s.addText('Система охоплює клієнтську взаємодію з каталогом і конструктором, оформлення замовлень та повноцінний адміністративний контур керування.', { x: 1.0, y: 1.78, w: 5.35, h: 0.95, fontFace: 'Arial', fontSize: 18, color: C.ink, valign: 'mid' });
  const cards = [
    { x: 1.0, y: 3.0, w: 5.1, h: 0.82, title: 'Клієнтська частина', body: 'каталог, конструктор, кошик, checkout' },
    { x: 1.0, y: 4.02, w: 5.1, h: 0.82, title: 'Кабінет користувача', body: 'список замовлень і детальна картка' },
    { x: 1.0, y: 5.04, w: 5.1, h: 0.82, title: 'Адмінпанель', body: 'замовлення, товари, Constructor Studio' }
  ];
  cards.forEach((card, idx) => {
    s.addShape(pptx.ShapeType.roundRect, {
      x: card.x,
      y: card.y,
      w: card.w,
      h: card.h,
      rectRadius: 0.04,
      fill: { color: idx === 1 ? 'F6EEE4' : idx === 2 ? 'EDF3ED' : 'FBF7F1' },
      line: { color: C.line, pt: 1 }
    });
    s.addText(card.title, {
      x: card.x + 0.18,
      y: card.y + 0.17,
      w: 1.9,
      h: 0.18,
      fontFace: 'Georgia',
      fontSize: 14,
      bold: true,
      color: C.ink
    });
    s.addText(card.body, {
      x: card.x + 2.05,
      y: card.y + 0.15,
      w: 2.7,
      h: 0.22,
      fontFace: 'Arial',
      fontSize: 12,
      color: C.ink
    });
  });
  addImageCard(s, imgs[0], 7.0, 1.45, 5.55, 2.35, 'Головна сторінка вебсистеми');
  addImageCard(s, imgs[2], 7.0, 3.98, 2.68, 2.25, 'Каталог');
  addImageCard(s, imgs[1], 9.87, 3.98, 2.68, 2.25, 'Конструктор');
}

// Slide 4
{
  const s = pptx.addSlide();
  base(s, 'Архітектура', 'Архітектура та технологічний стек');
  s.addText('Система побудована як клієнт-серверний вебзастосунок з окремими рівнями UI, API та збереження даних.', { x: 0.82, y: 1.25, w: 8.8, h: 0.35, fontFace: 'Arial', fontSize: 18, color: C.muted });
  const boxes = [
    { x: 0.95, title: 'React UI', body: 'Каталог\nКонструктор\nКошик\nКабінет' },
    { x: 4.35, title: 'Node.js / Express', body: 'REST API\nАвторизація\nCheckout\nAdmin routes' },
    { x: 7.75, title: 'SQLite / Knex', body: 'Users\nOrders\nCatalog\nConstructor data' }
  ];
  boxes.forEach((b, idx) => {
    s.addShape(pptx.ShapeType.roundRect, { x: b.x, y: 2.15, w: 2.65, h: 2.05, rectRadius: 0.06, fill: { color: idx === 1 ? 'F3E5D7' : C.paper }, line: { color: C.line, pt: 1.2 } });
    s.addText(b.title, { x: b.x + 0.18, y: 2.38, w: 2.25, h: 0.3, fontFace: 'Georgia', fontSize: 20, bold: true, color: C.ink, align: 'center' });
    s.addText(b.body, { x: b.x + 0.3, y: 2.85, w: 2.05, h: 1.05, fontFace: 'Arial', fontSize: 17, color: C.ink, align: 'center', breakLine: true, paraSpaceAfterPt: 6 });
  });
  s.addShape(pptx.ShapeType.chevron, { x: 3.75, y: 2.72, w: 0.4, h: 0.65, fill: { color: C.accent2 }, line: { color: C.accent2 } });
  s.addShape(pptx.ShapeType.chevron, { x: 7.15, y: 2.72, w: 0.4, h: 0.65, fill: { color: C.accent2 }, line: { color: C.accent2 } });
  const stack = ['Клієнт: React', 'Сервер: Node.js + Express', 'Дані: SQLite + Knex', 'Тести: Vitest + ручні сценарії'];
  stack.forEach((t, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 1.12 + i * 2.98, y: 5.02, w: 2.45, h: 0.62, rectRadius: 0.04, fill: { color: C.paper }, line: { color: C.line, pt: 1 } });
    s.addText(t, { x: 1.2 + i * 2.98, y: 5.2, w: 2.28, h: 0.18, fontFace: 'Arial', fontSize: 12, bold: true, color: C.ink, align: 'center' });
  });
}

// Slide 5
{
  const s = pptx.addSlide();
  base(s, 'Вимоги', 'Функціональні та нефункціональні вимоги');
  s.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 1.45, w: 5.95, h: 4.9, rectRadius: 0.06, fill: { color: C.paper }, line: { color: C.line, pt: 1 } });
  s.addShape(pptx.ShapeType.roundRect, { x: 6.95, y: 1.45, w: 5.55, h: 4.9, rectRadius: 0.06, fill: { color: C.paper }, line: { color: C.line, pt: 1 } });
  s.addText('Функціональні', { x: 1.08, y: 1.74, w: 2.0, h: 0.28, fontFace: 'Georgia', fontSize: 21, bold: true, color: C.accent });
  addBulletList(s, [
    'Перегляд каталогу та фільтрація товарів.',
    'Робота з конструктором індивідуального виробу.',
    'Кошик, checkout і створення замовлення.',
    'Персональний кабінет і перегляд історії замовлень.',
    'Адміністративне керування товарами та замовленнями.'
  ], 1.0, 2.15, 5.3, 3.8, { fontSize: 17, after: 6 });
  s.addText('Нефункціональні', { x: 7.22, y: 1.74, w: 2.3, h: 0.28, fontFace: 'Georgia', fontSize: 21, bold: true, color: C.green });
  addBulletList(s, [
    'Авторизація доступу до захищених маршрутів.',
    'Стабільність API у типових сценаріях.',
    'Цілісність збереження даних замовлень.',
    'Коректна робота в локальному середовищі.',
    'Можливість розширення тестового покриття.'
  ], 7.16, 2.15, 4.9, 3.8, { fontSize: 17, after: 6 });
}

// Slide 6
{
  const s = pptx.addSlide();
  base(s, 'Підхід до тестування', 'Багаторівнева стратегія перевірок');
  const levels = [
    ['Модульне', 'Окремі сервіси, методи та бізнес-логіка', 'F5E8DB'],
    ['Інтеграційне', 'Взаємодія API, middleware, БД і сервісів', 'E8EFE8'],
    ['Системне', 'Наскрізні користувацькі та адміністративні сценарії', 'F5E8DB'],
    ['Валідаційне', 'Підтвердження відповідності сформованим вимогам', 'E8EFE8']
  ];
  levels.forEach((lvl, i) => {
    const y = 1.72 + i * 1.02;
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.95, y, w: 5.95, h: 0.8, rectRadius: 0.05,
      fill: { color: lvl[2] }, line: { color: C.line, pt: 1 }
    });
    s.addText(lvl[0], {
      x: 1.28, y: y + 0.2, w: 1.2, h: 0.18,
      fontFace: 'Georgia', fontSize: 16, bold: true, color: C.ink, align: 'left'
    });
    s.addText(lvl[1], {
      x: 2.62, y: y + 0.18, w: 3.88, h: 0.22,
      fontFace: 'Arial', fontSize: 12.5, color: C.ink, align: 'left', valign: 'mid'
    });
  });
  s.addShape(pptx.ShapeType.roundRect, { x: 7.0, y: 1.78, w: 5.15, h: 2.25, rectRadius: 0.05, fill: { color: C.paper }, line: { color: C.line, pt: 1 } });
  s.addText('Кожен рівень має власні плани, сценарії, очікувані результати та підсумкові висновки.', {
    x: 7.35, y: 2.1, w: 4.45, h: 0.78,
    fontFace: 'Arial', fontSize: 16.5, color: C.ink
  });
  s.addText('Саме поєднання рівнів дало цілісну оцінку якості Aurora Atelier.', {
    x: 7.35, y: 3.18, w: 4.25, h: 0.64,
    fontFace: 'Georgia', fontSize: 17, bold: true, color: C.ink
  });
  s.addShape(pptx.ShapeType.roundRect, { x: 7.0, y: 4.45, w: 5.15, h: 1.3, rectRadius: 0.05, fill: { color: C.paper }, line: { color: C.line, pt: 1 } });
  s.addText('4 рівні перевірки\n1 узгоджена логіка контролю якості', {
    x: 7.32, y: 4.74, w: 4.5, h: 0.72,
    fontFace: 'Georgia', fontSize: 18, bold: true, color: C.accent, align: 'center'
  });
}

// Slide 7
{
  const s = pptx.addSlide();
  base(s, 'Автоматизовані результати', 'Що підтвердили автотести');
  s.addShape(pptx.ShapeType.roundRect, { x: 0.82, y: 1.45, w: 3.2, h: 4.9, rectRadius: 0.06, fill: { color: C.ink }, line: { color: C.ink } });
  s.addText('41 / 41', { x: 1.05, y: 2.1, w: 2.7, h: 0.7, fontFace: 'Georgia', fontSize: 30, bold: true, color: 'FFF8EF', align: 'center' });
  s.addText('успішних тестів', { x: 1.0, y: 2.92, w: 2.8, h: 0.3, fontFace: 'Arial', fontSize: 18, color: 'FFF8EF', align: 'center' });
  s.addShape(pptx.ShapeType.line, { x: 1.3, y: 3.45, w: 2.2, h: 0, line: { color: 'C6B6A0', pt: 1.2 } });
  s.addText('0 failed\nреальний прогін у локальному середовищі', { x: 1.0, y: 3.75, w: 2.8, h: 0.8, fontFace: 'Arial', fontSize: 15, color: 'F4EBDD', align: 'center' });
  s.addShape(pptx.ShapeType.roundRect, { x: 4.35, y: 1.45, w: 8.05, h: 4.9, rectRadius: 0.06, fill: { color: C.paper }, line: { color: C.line, pt: 1 } });
  s.addText('Розширене інтеграційне покриття включило перевірки:', { x: 4.7, y: 1.8, w: 5.0, h: 0.28, fontFace: 'Georgia', fontSize: 20, bold: true, color: C.ink });
  const cases = ['реєстрацію користувача', 'login / logout', 'доступ до кошика', 'роботу конфігуратора', 'checkout-валідацію', 'ownership для orders', 'admin orders та ролі доступу'];
  addBulletList(s, cases, 4.68, 2.25, 4.3, 3.2, { fontSize: 17, after: 6 });
  s.addShape(pptx.ShapeType.roundRect, { x: 9.6, y: 2.2, w: 2.25, h: 0.8, rectRadius: 0.04, fill: { color: 'F5E8DB' }, line: { color: 'F5E8DB' } });
  s.addText('Vitest', { x: 9.85, y: 2.47, w: 1.75, h: 0.2, fontFace: 'Arial', fontSize: 18, bold: true, color: C.accent, align: 'center' });
  s.addShape(pptx.ShapeType.roundRect, { x: 9.6, y: 3.25, w: 2.25, h: 0.8, rectRadius: 0.04, fill: { color: 'E8EFE8' }, line: { color: 'E8EFE8' } });
  s.addText('API + DB', { x: 9.8, y: 3.52, w: 1.8, h: 0.2, fontFace: 'Arial', fontSize: 18, bold: true, color: C.green, align: 'center' });
  s.addShape(pptx.ShapeType.roundRect, { x: 9.6, y: 4.3, w: 2.25, h: 0.8, rectRadius: 0.04, fill: { color: C.soft }, line: { color: C.soft } });
  s.addText('Real run', { x: 9.82, y: 4.57, w: 1.75, h: 0.2, fontFace: 'Arial', fontSize: 18, bold: true, color: C.ink, align: 'center' });
}

// Slide 8 client scenarios
{
  const s = pptx.addSlide();
  base(s, 'Системне тестування', 'Клієнтські сценарії, перевірені вручну');
  addImageCard(s, imgs[1], 0.9, 1.5, 3.0, 2.1, 'Конструктор');
  addImageCard(s, imgs[2], 4.15, 1.5, 3.0, 2.1, 'Каталог');
  addImageCard(s, imgs[3], 7.4, 1.5, 2.4, 2.1, 'Кошик');
  addImageCard(s, imgs[4], 10.05, 1.5, 2.4, 2.1, 'Checkout');
  addImageCard(s, imgs[5], 1.9, 4.0, 4.0, 2.15, 'Список замовлень користувача');
  addImageCard(s, imgs[6], 6.35, 4.0, 4.0, 2.15, 'Деталі замовлення');
  s.addText('Сценарії підтвердили коректний шлях від вибору виробу до створення та перегляду реального замовлення.', { x: 0.95, y: 6.45, w: 11.2, h: 0.28, fontFace: 'Arial', fontSize: 16, color: C.muted, align: 'center' });
}

// Slide 9 admin scenarios
{
  const s = pptx.addSlide();
  base(s, 'Системне тестування', 'Адміністративні сценарії та back-office');
  addImageCard(s, imgs[7], 0.9, 1.5, 3.7, 2.15, 'Список замовлень');
  addImageCard(s, imgs[8], 4.85, 1.5, 3.7, 2.15, 'Деталі замовлення');
  addImageCard(s, imgs[9], 8.8, 1.5, 3.0, 2.15, 'Керування товарами');
  addImageCard(s, imgs[10], 2.25, 4.05, 4.1, 2.15, 'Constructor Studio');
  s.addShape(pptx.ShapeType.roundRect, { x: 6.75, y: 4.15, w: 5.0, h: 2.0, rectRadius: 0.05, fill: { color: C.paper }, line: { color: C.line, pt: 1 } });
  addBulletList(s, [
    'контроль доступу до адмін-маршрутів',
    'обробка статусів замовлення',
    'робота сторінки товарів',
    'збереження цілісності даних конструктора'
  ], 7.0, 4.42, 4.45, 1.45, { fontSize: 15, after: 5 });
}

// Slide 10
{
  const s = pptx.addSlide();
  base(s, 'Оцінка якості', 'Висновки та практичний результат');
  s.addShape(pptx.ShapeType.roundRect, { x: 0.85, y: 1.45, w: 4.0, h: 4.9, rectRadius: 0.06, fill: { color: C.paper }, line: { color: C.line, pt: 1 } });
  s.addText('Що підтверджено', { x: 1.15, y: 1.78, w: 2.3, h: 0.28, fontFace: 'Georgia', fontSize: 20, bold: true, color: C.accent });
  addBulletList(s, [
    'основні функції системи працюють коректно',
    'автоматизоване покриття розширено',
    'критичні користувацькі сценарії відтворені реально',
    'адмінчастина проходить базові перевірки доступу та керування'
  ], 1.05, 2.2, 3.45, 3.5, { fontSize: 16, after: 6 });
  s.addShape(pptx.ShapeType.roundRect, { x: 5.1, y: 1.45, w: 3.1, h: 4.9, rectRadius: 0.06, fill: { color: C.ink }, line: { color: C.ink } });
  s.addText('Практичний підсумок', { x: 5.42, y: 1.82, w: 2.45, h: 0.45, fontFace: 'Georgia', fontSize: 22, bold: true, color: 'FFF8EF', align: 'center' });
  s.addText('Документація + RTM\nПлани 4 рівнів\n41/41 автотестів\nРучні перевірки клієнта й адмінки', { x: 5.55, y: 2.55, w: 2.2, h: 2.4, fontFace: 'Arial', fontSize: 18, color: 'FFF8EF', align: 'center', breakLine: true, paraSpaceAfterPt: 12, bold: true });
  s.addShape(pptx.ShapeType.roundRect, { x: 8.45, y: 1.45, w: 4.1, h: 4.9, rectRadius: 0.06, fill: { color: C.paper }, line: { color: C.line, pt: 1 } });
  s.addText('Подальше посилення', { x: 8.75, y: 1.78, w: 2.3, h: 0.28, fontFace: 'Georgia', fontSize: 20, bold: true, color: C.green });
  addBulletList(s, [
    'розширення UI-регресії',
    'граничні та негативні дані',
    'навантажувальні сценарії',
    'подальше зростання інтеграційного покриття'
  ], 8.68, 2.2, 3.35, 3.2, { fontSize: 16, after: 6 });
}

// Slide 11
{
  const s = pptx.addSlide();
  s.background = { color: C.ink };
  s.addShape(pptx.ShapeType.rect, { x: 0.55, y: 0.65, w: 12.2, h: 6.15, fill: { color: '233128' }, line: { color: '233128' } });
  s.addText('Дякую за увагу', { x: 1.0, y: 2.0, w: 5.4, h: 0.7, fontFace: 'Georgia', fontSize: 28, bold: true, color: 'FFF8EF' });
  s.addText('Курсова робота з теми\n«Верифікація та тестування вебсистеми продажу авторських прикрас з конструктором дизайну»', { x: 1.0, y: 2.9, w: 5.55, h: 1.2, fontFace: 'Arial', fontSize: 18, color: 'F3EBDD', breakLine: true, paraSpaceAfterPt: 10 });
  s.addText('Гірка Д.М. • 642п', { x: 1.0, y: 4.55, w: 2.8, h: 0.25, fontFace: 'Arial', fontSize: 16, color: 'D7C2AA' });
  s.addImage(fitContain(imgs[10], 7.0, 1.2, 5.1, 4.7));
  s.addShape(pptx.ShapeType.line, { x: 1.0, y: 5.15, w: 3.3, h: 0, line: { color: C.accent, pt: 1.4 } });
}

pptx.writeFile({ fileName: out }).then(() => console.log(out));

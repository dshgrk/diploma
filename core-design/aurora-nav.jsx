// aurora-nav.jsx — shared i18n, data, Nav, Footer

const I18N = {
  uk: {
    brand: 'Aurora Atelier',
    nav_collection: 'Колекція',
    nav_constructor: 'Конструктор',
    nav_orders: 'Замовлення',
    nav_cart: 'Кошик',
    nav_login: 'Вхід',
    nav_logout: 'Вийти',
    nav_admin: 'Адмін',
    nav_account: 'Кабінет',
    footer_tagline: 'Авторські прикраси ручної роботи',
    footer_copy: '© 2026 Aurora Atelier',
    footer_col1: 'Магазин',
    footer_col2: 'Бренд',
    footer_col3: 'Підтримка',
    footer_collection: 'Колекція',
    footer_constructor: 'Конструктор',
    footer_new: 'Новинки',
    footer_about: 'Про нас',
    footer_process: 'Процес',
    footer_care: 'Догляд за прикрасами',
    footer_faq: 'Питання та відповіді',
    footer_shipping: 'Доставка',
    footer_returns: 'Повернення',
    hero_slide1_title: 'Прикраси,\nнароджені\nз любові',
    hero_slide1_sub: 'Авторська ювелірна майстерня',
    hero_slide2_title: 'Кожна деталь —\nваша історія',
    hero_slide2_sub: 'Персональний дизайн від майстра',
    hero_slide3_title: 'Вічна\nелегантність',
    hero_slide3_sub: 'Колекція Aurora 2026',
    hero_cta1: 'Переглянути колекцію',
    hero_cta2: 'Створити своє',
    trust1: 'Ручна\nробота',
    trust2: 'Прозора\nціна',
    trust3: 'Персональний\nпідхід',
    trust4: 'Безкоштовна\nдоставка',
    featured_eyebrow: 'Обрані твори',
    featured_title: 'Колекція Aurora',
    featured_sub: 'Кожна прикраса — результат ручної праці та уваги до матеріалу',
    bespoke_eyebrow: 'Bespoke',
    bespoke_title: 'Створіть своє\nунікальне прикраса',
    bespoke_sub: 'Оберіть тип, матеріал, камені та гравіювання — ми втілимо ваш задум у металі',
    bespoke_cta: 'Відкрити конструктор',
    editorial_eyebrow: 'Підхід',
    editorial_title: 'Чому Aurora',
    ed1_title: 'Пропорція та баланс',
    ed1_text: 'Кожна форма виважена до міліметра. Ми не слідуємо моді — ми створюємо речі, що не старіють.',
    ed2_title: 'Персональність',
    ed2_text: 'Гравіювання, вибір каменю, розмір — кожна деталь відображає вас.',
    ed3_title: 'Прозорий процес',
    ed3_text: 'Від ескізу до готового виробу — ми тримаємо вас у курсі кожного кроку.',
    faq_eyebrow: 'FAQ',
    faq_title: 'Поширені питання',
    faq1_q: 'Як довго виготовляється замовлення?',
    faq1_a: 'Стандартний виріб — 10–14 днів, bespoke — від 3 до 6 тижнів залежно від складності.',
    faq2_q: 'Чи можна замовити гравіювання?',
    faq2_a: 'Так, у конструкторі є поле для тексту. Латиниця, кирилиця, до 30 символів.',
    faq3_q: 'Яка гарантія на вироби?',
    faq3_a: 'Усі вироби мають гарантію 12 місяців. Безкоштовне обслуговування та чищення раз на рік.',
    faq4_q: 'Які способи оплати?',
    faq4_a: 'Карта Visa/Mastercard, Apple Pay, Google Pay, накладений платіж.',
    final_cta_title: 'Готові обрати своє?',
    final_cta_sub: 'Перегляньте колекцію або створіть унікальне прикраса у конструкторі',
    final_cta_btn1: 'До колекції',
    final_cta_btn2: 'Конструктор',
    catalog_eyebrow: 'Колекція',
    catalog_title: 'Усі твори',
    catalog_filter_all: 'Усі',
    catalog_filter_rings: 'Каблучки',
    catalog_filter_necklaces: 'Намиста',
    catalog_filter_bracelets: 'Браслети',
    catalog_filter_earrings: 'Сережки',
    add_to_cart: 'До кошика',
    buy_now: 'Купити зараз',
    product_material: 'Матеріал',
    product_stone: 'Камінь',
    product_size: 'Розмір',
    product_description: 'Опис',
    product_back: '← Повернутись',
    cart_title: 'Кошик',
    cart_empty: 'Ваш кошик порожній',
    cart_empty_sub: 'Перегляньте колекцію або створіть унікальне прикраса',
    cart_subtotal: 'Сума',
    cart_shipping: 'Доставка',
    cart_free: 'Безкоштовно',
    cart_total: 'Разом',
    cart_checkout: 'Оформити замовлення',
    cart_continue: 'Продовжити покупки',
    cart_remove: 'Видалити',
    cart_qty: 'Кількість',
    checkout_title: 'Оформлення',
    checkout_contact: 'Контактні дані',
    checkout_delivery: 'Доставка',
    checkout_payment: 'Оплата',
    checkout_name: "Ім'я та прізвище",
    checkout_email: 'Email',
    checkout_phone: 'Телефон',
    checkout_address: 'Адреса доставки',
    checkout_city: 'Місто',
    checkout_zip: 'Поштовий індекс',
    checkout_agree: 'Погоджуюсь з умовами',
    checkout_submit: 'Підтвердити замовлення',
    checkout_success_title: 'Замовлення прийнято!',
    checkout_success_sub: 'Ми надішлемо підтвердження на вашу пошту',
    checkout_to_orders: 'Мої замовлення',
    auth_login: 'Вхід',
    auth_register: 'Реєстрація',
    auth_email: 'Email',
    auth_password: 'Пароль',
    auth_name: "Ім'я",
    auth_submit_login: 'Увійти',
    auth_submit_register: 'Зареєструватись',
    auth_aside_title: 'Ваш особистий простір',
    auth_aside_b1: 'Відстежуйте статус замовлень',
    auth_aside_b2: 'Зберігайте улюблені прикраси',
    auth_aside_b3: 'Персональні пропозиції',
    auth_aside_b4: 'Ексклюзивні знижки',
    orders_title: 'Мої замовлення',
    orders_empty: 'У вас ще немає замовлень',
    orders_empty_sub: 'Зробіть перше замовлення вже сьогодні',
    orders_num: '№ замовлення',
    orders_date: 'Дата',
    orders_status: 'Статус',
    orders_total: 'Сума',
    orders_detail: 'Деталі',
    status_pending: 'Очікує оплати',
    status_confirmed: 'Підтверджено',
    status_progress: 'У роботі',
    status_completed: 'Завершено',
    status_overdue: 'Прострочено',
    admin_title: 'Адміністрація',
    admin_orders: 'Замовлення',
    admin_products: 'Товари',
    admin_metrics_orders: 'Всього замовлень',
    admin_metrics_revenue: 'Виручка',
    admin_metrics_avg: 'Середній чек',
    constructor_title: 'Конструктор прикрас',
    constructor_type: 'Тип прикраси',
    constructor_material: 'Матеріал',
    constructor_stone: 'Камінь',
    constructor_size: 'Розмір',
    constructor_engraving: 'Гравіювання',
    constructor_engraving_placeholder: 'Текст (до 30 символів)',
    constructor_price: 'Вартість',
    constructor_add: 'Додати до кошика',
    constructor_preview: 'Попередній перегляд',
    constructor_configure: 'Налаштуйте прикрасу ліворуч',
    toast_added: 'Додано до кошика',
  },
  en: {
    brand: 'Aurora Atelier',
    nav_collection: 'Collection',
    nav_constructor: 'Constructor',
    nav_orders: 'Orders',
    nav_cart: 'Cart',
    nav_login: 'Login',
    nav_logout: 'Logout',
    nav_admin: 'Admin',
    nav_account: 'Account',
    footer_tagline: 'Handcrafted signature jewelry',
    footer_copy: '© 2026 Aurora Atelier',
    footer_col1: 'Shop',
    footer_col2: 'Brand',
    footer_col3: 'Support',
    footer_collection: 'Collection',
    footer_constructor: 'Constructor',
    footer_new: 'New Arrivals',
    footer_about: 'About',
    footer_process: 'Our Process',
    footer_care: 'Jewelry Care',
    footer_faq: 'FAQ',
    footer_shipping: 'Shipping',
    footer_returns: 'Returns',
    hero_slide1_title: 'Jewelry\nborn from\nlove',
    hero_slide1_sub: 'Signature handcrafted jewelry atelier',
    hero_slide2_title: 'Every detail\nis your story',
    hero_slide2_sub: 'Personal design from master craftspeople',
    hero_slide3_title: 'Timeless\nElegance',
    hero_slide3_sub: 'Aurora Collection 2026',
    hero_cta1: 'View Collection',
    hero_cta2: 'Create Your Own',
    trust1: 'Handcrafted',
    trust2: 'Transparent\nPricing',
    trust3: 'Personal\nApproach',
    trust4: 'Free\nShipping',
    featured_eyebrow: 'Selected Works',
    featured_title: 'Aurora Collection',
    featured_sub: 'Each piece is the result of handwork and attention to material',
    bespoke_eyebrow: 'Bespoke',
    bespoke_title: 'Create your\nunique piece',
    bespoke_sub: 'Choose type, material, stones and engraving — we will bring your idea to life in metal',
    bespoke_cta: 'Open Constructor',
    editorial_eyebrow: 'Our Approach',
    editorial_title: 'Why Aurora',
    ed1_title: 'Proportion & Balance',
    ed1_text: 'Every form is calibrated to the millimeter. We don\'t follow trends — we create pieces that never age.',
    ed2_title: 'Personality',
    ed2_text: 'Engraving, stone selection, size — every detail reflects you.',
    ed3_title: 'Transparent Process',
    ed3_text: 'From sketch to finished piece — we keep you informed at every step.',
    faq_eyebrow: 'FAQ',
    faq_title: 'Frequently Asked',
    faq1_q: 'How long does production take?',
    faq1_a: 'Standard pieces take 10–14 days, bespoke from 3 to 6 weeks depending on complexity.',
    faq2_q: 'Can I order engraving?',
    faq2_a: 'Yes, the constructor has a text field. Latin, Cyrillic, up to 30 characters.',
    faq3_q: 'What warranty do pieces have?',
    faq3_a: 'All pieces carry a 12-month warranty. Free servicing and cleaning once a year.',
    faq4_q: 'What payment methods are available?',
    faq4_a: 'Visa/Mastercard, Apple Pay, Google Pay, cash on delivery.',
    final_cta_title: 'Ready to find yours?',
    final_cta_sub: 'Browse the collection or create a unique piece in the constructor',
    final_cta_btn1: 'To Collection',
    final_cta_btn2: 'Constructor',
    catalog_eyebrow: 'Collection',
    catalog_title: 'All Works',
    catalog_filter_all: 'All',
    catalog_filter_rings: 'Rings',
    catalog_filter_necklaces: 'Necklaces',
    catalog_filter_bracelets: 'Bracelets',
    catalog_filter_earrings: 'Earrings',
    add_to_cart: 'Add to Cart',
    buy_now: 'Buy Now',
    product_material: 'Material',
    product_stone: 'Stone',
    product_size: 'Size',
    product_description: 'Description',
    product_back: '← Back',
    cart_title: 'Cart',
    cart_empty: 'Your cart is empty',
    cart_empty_sub: 'Browse the collection or create a unique piece',
    cart_subtotal: 'Subtotal',
    cart_shipping: 'Shipping',
    cart_free: 'Free',
    cart_total: 'Total',
    cart_checkout: 'Checkout',
    cart_continue: 'Continue Shopping',
    cart_remove: 'Remove',
    cart_qty: 'Qty',
    checkout_title: 'Checkout',
    checkout_contact: 'Contact Details',
    checkout_delivery: 'Delivery',
    checkout_payment: 'Payment',
    checkout_name: 'Full Name',
    checkout_email: 'Email',
    checkout_phone: 'Phone',
    checkout_address: 'Delivery Address',
    checkout_city: 'City',
    checkout_zip: 'ZIP Code',
    checkout_agree: 'I agree to the terms',
    checkout_submit: 'Confirm Order',
    checkout_success_title: 'Order Placed!',
    checkout_success_sub: 'We\'ll send a confirmation to your email',
    checkout_to_orders: 'My Orders',
    auth_login: 'Login',
    auth_register: 'Register',
    auth_email: 'Email',
    auth_password: 'Password',
    auth_name: 'Name',
    auth_submit_login: 'Sign In',
    auth_submit_register: 'Create Account',
    auth_aside_title: 'Your personal space',
    auth_aside_b1: 'Track order status',
    auth_aside_b2: 'Save favorite pieces',
    auth_aside_b3: 'Personal recommendations',
    auth_aside_b4: 'Exclusive discounts',
    orders_title: 'My Orders',
    orders_empty: 'You have no orders yet',
    orders_empty_sub: 'Place your first order today',
    orders_num: 'Order #',
    orders_date: 'Date',
    orders_status: 'Status',
    orders_total: 'Total',
    orders_detail: 'Details',
    status_pending: 'Pending Payment',
    status_confirmed: 'Confirmed',
    status_progress: 'In Progress',
    status_completed: 'Completed',
    status_overdue: 'Overdue',
    admin_title: 'Administration',
    admin_orders: 'Orders',
    admin_products: 'Products',
    admin_metrics_orders: 'Total Orders',
    admin_metrics_revenue: 'Revenue',
    admin_metrics_avg: 'Average Order',
    constructor_title: 'Jewelry Constructor',
    constructor_type: 'Jewelry Type',
    constructor_material: 'Material',
    constructor_stone: 'Stone',
    constructor_size: 'Size',
    constructor_engraving: 'Engraving',
    constructor_engraving_placeholder: 'Text (up to 30 characters)',
    constructor_price: 'Price',
    constructor_add: 'Add to Cart',
    constructor_preview: 'Preview',
    constructor_configure: 'Configure your piece on the left',
    toast_added: 'Added to cart',
  }
};

window.I18N = I18N;
window.useT = function(lang) {
  return (key) => (I18N[lang] && I18N[lang][key]) || (I18N['uk'] && I18N['uk'][key]) || key;
};

// ── Product Data ─────────────────────────────────────────────────────────────
window.AURORA_PRODUCTS = [
  {
    id: 1, type: 'ring',
    name_uk: 'Каблучка «Зоря»', name_en: 'Aurora Ring',
    price: 4800,
    material_uk: 'Жовте золото 14к', material_en: 'Yellow Gold 14k',
    stone_uk: 'Діамант 0.15 кт', stone_en: 'Diamond 0.15ct',
    size_uk: 'Розміри 15–20', size_en: 'Sizes 15–20',
    desc_uk: 'Витончена каблучка з бездоганним огранюванням. Золото найвищої проби, камінь з сертифікатом.',
    desc_en: 'An elegant ring with flawless cut. Finest gold, certified stone.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2, type: 'necklace',
    name_uk: 'Намисто «Місячне сяйво»', name_en: 'Moonlight Necklace',
    price: 6200,
    material_uk: 'Біле золото 14к', material_en: 'White Gold 14k',
    stone_uk: 'Місячний камінь', stone_en: 'Moonstone',
    size_uk: '42–45 см', size_en: '42–45 cm',
    desc_uk: 'Делікатне намисто з натуральним місячним каменем. Ідеально для щоденного носіння.',
    desc_en: 'Delicate necklace with natural moonstone. Perfect for everyday wear.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3, type: 'earrings',
    name_uk: 'Сережки «Вечір»', name_en: 'Evening Earrings',
    price: 3900,
    material_uk: 'Рожеве золото 14к', material_en: 'Rose Gold 14k',
    stone_uk: 'Рубін', stone_en: 'Ruby',
    size_uk: 'Довжина 2.8 см', size_en: 'Length 2.8 cm',
    desc_uk: 'Елегантні сережки з рубінами — для особливих вечорів і повсякденного шарму.',
    desc_en: 'Elegant ruby earrings — for special evenings and everyday charm.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4, type: 'bracelet',
    name_uk: 'Браслет «Плетінка»', name_en: 'Weave Bracelet',
    price: 5100,
    material_uk: 'Жовте золото 14к', material_en: 'Yellow Gold 14k',
    stone_uk: 'Без каменю', stone_en: 'No stone',
    size_uk: '16–19 см', size_en: '16–19 cm',
    desc_uk: 'Браслет ручного плетіння із золота — символ зв\'язку та турботи.',
    desc_en: 'Hand-woven gold bracelet — a symbol of connection and care.',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 5, type: 'ring',
    name_uk: 'Каблучка «Сапфір»', name_en: 'Sapphire Ring',
    price: 7400,
    material_uk: 'Жовте золото 18к', material_en: 'Yellow Gold 18k',
    stone_uk: 'Сапфір 0.8 кт', stone_en: 'Sapphire 0.8ct',
    size_uk: 'Розміри 15–20', size_en: 'Sizes 15–20',
    desc_uk: 'Класика жанру: яскравий сапфір у обрамленні золота найвищої проби.',
    desc_en: 'A classic: vivid sapphire set in highest-quality gold.',
    image: 'https://images.unsplash.com/photo-1573408301185-9519f94815b1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 6, type: 'necklace',
    name_uk: 'Кулон «Крапля»', name_en: 'Drop Pendant',
    price: 3600,
    material_uk: 'Срібло 925', material_en: 'Silver 925',
    stone_uk: 'Перлина', stone_en: 'Pearl',
    size_uk: '40–45 см', size_en: '40–45 cm',
    desc_uk: 'Витончений кулон з натуральною перлиною — простота і розкіш в одному.',
    desc_en: 'Graceful pendant with natural pearl — simplicity and luxury in one.',
    image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 7, type: 'earrings',
    name_uk: 'Сережки «Геометрія»', name_en: 'Geometry Earrings',
    price: 2900,
    material_uk: 'Біле золото 14к', material_en: 'White Gold 14k',
    stone_uk: 'Без каменю', stone_en: 'No stone',
    size_uk: 'Діаметр 1.8 см', size_en: 'Diameter 1.8 cm',
    desc_uk: 'Мінімалістичні геометричні сережки для тих, хто цінує чисту форму.',
    desc_en: 'Minimalist geometric earrings for those who value clean form.',
    image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 8, type: 'bracelet',
    name_uk: 'Браслет «Тонкий»', name_en: 'Slim Bracelet',
    price: 3200,
    material_uk: 'Рожеве золото 14к', material_en: 'Rose Gold 14k',
    stone_uk: 'Смарагд', stone_en: 'Emerald',
    size_uk: '16–18 см', size_en: '16–18 cm',
    desc_uk: 'Тонкий елегантний браслет зі смарагдами — для щоденного вишуканого стилю.',
    desc_en: 'Slim elegant bracelet with emeralds — for daily refined style.',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=80',
  },
];

// ── Mock Orders ───────────────────────────────────────────────────────────────
window.AURORA_ORDERS = [
  { id: 'AA-2026-001', date: '2026-04-10', status: 'completed', total: 4800, items: ['Каблучка «Зоря»'] },
  { id: 'AA-2026-014', date: '2026-04-20', status: 'progress', total: 9100, items: ['Намисто «Місячне сяйво»', 'Бespoke Каблучка'] },
  { id: 'AA-2026-021', date: '2026-04-25', status: 'confirmed', total: 3900, items: ['Сережки «Вечір»'] },
];

// ── Icon helpers ──────────────────────────────────────────────────────────────
function IconCart({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );
}
function IconUser({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function IconMenu({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}
function IconX({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IconCheck({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

window.IconCart = IconCart;
window.IconUser = IconUser;
window.IconMenu = IconMenu;
window.IconX = IconX;
window.IconCheck = IconCheck;

// ── AuroraNav ─────────────────────────────────────────────────────────────────
function AuroraNav({ page, setPage, lang, setLang, cartCount, isLoggedIn, setIsLoggedIn, accentColor }) {
  const t = window.useT(lang);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { key: 'catalog', label: t('nav_collection') },
    { key: 'constructor', label: t('nav_constructor') },
    ...(isLoggedIn ? [{ key: 'orders', label: t('nav_orders') }] : []),
  ];

  const go = (p) => { setPage(p); setMobileOpen(false); window.scrollTo(0, 0); };

  return (
    <nav className={`site-nav${scrolled ? ' scrolled' : ''}`} role="navigation">
      <div className="nav-inner">
        <button className="nav-brand" onClick={() => go('home')}>
          {t('brand')}
        </button>
        <div className="nav-links-desktop">
          {navLinks.map(l => (
            <button key={l.key} className={`nav-link${page === l.key ? ' active' : ''}`} onClick={() => go(l.key)}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="nav-actions">
          <button className="lang-toggle" onClick={() => setLang(lang === 'uk' ? 'en' : 'uk')} aria-label="Switch language">
            {lang === 'uk' ? 'EN' : 'УК'}
          </button>
          <button className="icon-button cart-btn" onClick={() => go('cart')} aria-label={t('nav_cart')}>
            <IconCart size={19} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          <button className="icon-button" onClick={() => go(isLoggedIn ? 'orders' : 'auth')} aria-label={t('nav_account')}>
            <IconUser size={19} />
          </button>
          <button className="icon-button nav-mobile-toggle" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
            {mobileOpen ? <IconX size={19} /> : <IconMenu size={19} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="nav-mobile-menu">
          {navLinks.map(l => (
            <button key={l.key} className="nav-mobile-link" onClick={() => go(l.key)}>{l.label}</button>
          ))}
          <button className="nav-mobile-link" onClick={() => go('cart')}>{t('nav_cart')} {cartCount > 0 && `(${cartCount})`}</button>
          <button className="nav-mobile-link" onClick={() => go(isLoggedIn ? 'orders' : 'auth')}>
            {isLoggedIn ? t('nav_account') : t('nav_login')}
          </button>
          {isLoggedIn && (
            <button className="nav-mobile-link" onClick={() => { setIsLoggedIn(false); go('home'); }}>
              {t('nav_logout')}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

// ── AuroraFooter ──────────────────────────────────────────────────────────────
function AuroraFooter({ lang, setPage }) {
  const t = window.useT(lang);
  const go = (p) => { setPage(p); window.scrollTo(0, 0); };
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand-col">
          <div className="footer-brand">{t('brand')}</div>
          <p className="footer-tagline">{t('footer_tagline')}</p>
        </div>
        <div className="footer-cols">
          <div className="footer-col">
            <div className="footer-col-title">{t('footer_col1')}</div>
            <button className="footer-link" onClick={() => go('catalog')}>{t('footer_collection')}</button>
            <button className="footer-link" onClick={() => go('constructor')}>{t('footer_constructor')}</button>
            <button className="footer-link" onClick={() => go('catalog')}>{t('footer_new')}</button>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">{t('footer_col2')}</div>
            <button className="footer-link">{t('footer_about')}</button>
            <button className="footer-link">{t('footer_process')}</button>
            <button className="footer-link">{t('footer_care')}</button>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">{t('footer_col3')}</div>
            <button className="footer-link">{t('footer_faq')}</button>
            <button className="footer-link">{t('footer_shipping')}</button>
            <button className="footer-link">{t('footer_returns')}</button>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span className="footer-copy">{t('footer_copy')}</span>
        <span className="footer-copy" style={{opacity: 0.5}}>aurora-atelier.com</span>
      </div>
    </footer>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function AuroraToast({ toasts }) {
  return (
    <div className="toast-root" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className="toast">{t.msg}</div>
      ))}
    </div>
  );
}

window.AuroraNav = AuroraNav;
window.AuroraFooter = AuroraFooter;
window.AuroraToast = AuroraToast;

// Файл містить логіку словників локалізації.
export const ADMIN_UI = {
  shell: {
    navAria: "Навігація адмінки",
    orders: "Замовлення",
    products: "Товари",
    constructor: "Конструктор",
    site: "Сайт"
  },
  common: {
    save: "Зберегти",
    saving: "Збереження...",
    delete: "Видалити",
    confirmDelete: "Підтвердити видалення",
    cancel: "Скасувати",
    open: "Відкрити",
    back: "Назад",
    new: "Нове",
    archive: "Архівувати",
    active: "Активно",
    noStone: "Без каменю",
    preview: "Попередній перегляд"
  },
  login: {
    title: "Адмін-простір",
    subtitle: "Керуйте замовленнями, товарами та параметрами конструктора в єдиному робочому інтерфейсі.",
    email: "Електронна пошта",
    password: "Пароль",
    submit: "Увійти",
    submitting: "Вхід..."
  },
  orders: {
    title: "Замовлення",
    subtitle: "Спокійна робоча панель для контролю виробництва, оплати й доставки.",
    total: "Усього замовлень",
    revenue: "Виторг",
    average: "Середній чек",
    overdue: "Прострочені",
    searchPlaceholder: "Пошук за замовленням, клієнтом або email",
    allStatuses: "Усі статуси",
    order: "Замовлення",
    customer: "Клієнт",
    status: "Статус",
    payment: "Оплата",
    totalAmount: "Сума"
  },
  orderDetail: {
    fallbackTitle: "Деталі замовлення",
    subtitle: "Переглядайте досьє замовлення та переводьте його між доступними статусами.",
    loading: "Завантаження замовлення",
    status: "Статус",
    commentPlaceholder: "Коментар для відкату статусу або внутрішня примітка",
    moveTo: "Перевести в",
    items: "Позиції",
    timeline: "Хронологія",
    productType: "Тип виробу"
  },
  products: {
    title: "Товари",
    subtitle: "Повний редактор каталогу: картка товару, фільтри, головне зображення та стан активності.",
    listTitle: "Товари",
    new: "Новий товар",
    create: "Створити товар",
    edit: "Редагувати товар",
    imageUploaded: "Зображення завантажено",
    created: "Товар створено",
    updated: "Товар оновлено",
    archived: "Товар архівовано",
    jewelryType: "Тип прикраси",
    slug: "Слаг",
    price: "Ціна",
    nameUk: "Назва UK",
    nameEn: "Назва EN",
    descriptionUk: "Опис UK",
    descriptionEn: "Опис EN",
    primaryImageAsset: "Головний асет зображення",
    linkedVariant: "Пов’язаний варіант",
    assetLibrary: "Бібліотека асетів",
    imageAltUk: "Alt-текст зображення UK",
    imageAltEn: "Alt-текст зображення EN",
    uploadImage: "Завантажити зображення",
    catalogFilters: "Фільтри каталогу",
    previewName: "Назва для попереднього перегляду"
  }
};

export const ADMIN_ORDER_STATUS_COPY = {
  created_pending_payment: "Очікує оплату",
  confirmed: "Підтверджено",
  in_progress: "У роботі",
  completed: "Завершено"
};

// Виконує локальну логіку admin order status label для модуля словників локалізації.
export function adminOrderStatusLabel(status) {
  return ADMIN_ORDER_STATUS_COPY[status] || status || "—";
}

// Виконує локальну логіку admin payment state label для модуля словників локалізації.
export function adminPaymentStateLabel(state) {
  if (state === "paid") return "Оплачено";
  if (state === "unpaid") return "Не оплачено";
  return state || "—";
}

// Виконує локальну логіку admin status class name для модуля словників локалізації.
export function adminStatusClassName(status, overdue = false) {
  if (overdue) return "status-pill overdue";
  if (status === "confirmed") return "status-pill confirmed";
  if (status === "in_progress") return "status-pill progress";
  if (status === "completed") return "status-pill completed";
  return "status-pill pending";
}

const ADMIN_TYPE_CODE_LABELS = {
  ring: "Каблучка",
  bracelet: "Браслет",
  pendant: "Підвіска",
  earrings: "Сережки"
};

// Виконує локальну логіку admin type code label для модуля словників локалізації.
export function adminTypeCodeLabel(code) {
  return ADMIN_TYPE_CODE_LABELS[code] || code || "";
}

export const ADMIN_PRODUCT_FILTERS = {
  type: ["Ring", "Bracelet", "Pendant", "Earrings"],
  metal: ["Gold", "Silver", "Rose Gold", "Steel"],
  stoneType: ["Diamond", "Emerald", "Sapphire", "None"],
  stoneShape: ["Round", "Oval", "Princess"],
  stoneColor: ["White", "Green", "Blue"],
  stoneSize: ["0.5 ct", "1 ct", "2 ct"],
  ringSize: ["16", "17", "18", "19"],
  ringType: ["Classic", "Fashion", "Statement"],
  braceletLength: ["16 cm", "17 cm", "18 cm", "19 cm"]
};

const ADMIN_PRODUCT_FILTER_LABELS = {
  type: "Тип",
  metal: "Метал",
  stoneType: "Камінь",
  stoneShape: "Огранювання",
  stoneColor: "Колір каменю",
  stoneSize: "Розмір каменю",
  ringSize: "Розмір каблучки",
  ringType: "Стиль каблучки",
  braceletLength: "Довжина браслета"
};

const ADMIN_PRODUCT_FILTER_VALUE_LABELS = {
  type: {
    Ring: "Каблучка",
    Bracelet: "Браслет",
    Pendant: "Підвіска",
    Earrings: "Сережки"
  },
  metal: {
    Gold: "Золото",
    Silver: "Срібло",
    "Rose Gold": "Рожеве золото",
    Steel: "Сталь"
  },
  stoneType: {
    Diamond: "Діамант",
    Emerald: "Смарагд",
    Sapphire: "Сапфір",
    None: "Без каменю"
  },
  stoneShape: {
    Round: "Круг",
    Oval: "Овал",
    Princess: "Принцеса"
  },
  stoneColor: {
    White: "Білий",
    Green: "Зелений",
    Blue: "Синій"
  },
  ringType: {
    Classic: "Класична",
    Fashion: "Модна",
    Statement: "Акцентна"
  }
};

// Виконує локальну логіку admin product filter label для модуля словників локалізації.
export function adminProductFilterLabel(key) {
  return ADMIN_PRODUCT_FILTER_LABELS[key] || key;
}

// Виконує локальну логіку admin product filter value label для модуля словників локалізації.
export function adminProductFilterValueLabel(key, value) {
  return ADMIN_PRODUCT_FILTER_VALUE_LABELS[key]?.[value] || value;
}

// Виконує локальну логіку admin localized entry для модуля словників локалізації.
export function adminLocalizedEntry(primary, fallback, finalValue = "") {
  return primary || fallback || finalValue;
}

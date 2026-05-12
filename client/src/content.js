export const FALLBACK_PRODUCT_IMAGE = "/assets/images/aurora-jewelry-hero.png";

export const CATALOG_FILTERS = [
  { key: "type", label: "Type", values: ["Ring", "Earrings", "Bracelet"] },
  { key: "metal", label: "Metal", values: ["Gold", "Silver", "Rose Gold"] },
  { key: "stoneType", label: "Stone type", values: ["Diamond", "Emerald", "Sapphire", "None"] },
  { key: "stoneShape", label: "Stone shape", values: ["Round", "Oval", "Princess"] },
  { key: "stoneColor", label: "Stone color", values: ["White", "Green", "Blue"] },
  { key: "stoneSize", label: "Stone size", values: ["0.5 ct", "1 ct", "2 ct"] },
  { key: "ringSize", label: "Ring size", values: ["15", "16", "17", "18"], visibleForType: "Ring" },
  { key: "ringType", label: "Ring type", values: ["Engagement", "Wedding", "Fashion"], visibleForType: "Ring" },
  { key: "braceletLength", label: "Bracelet length", values: ["16 cm", "18 cm", "20 cm"], visibleForType: "Bracelet" }
];

export const REFERENCE_IMAGES = {
  hero: [
    "/assets/images/aurora-jewelry-hero.png",
    "/assets/images/product-heart.png",
    "/assets/images/product-moon.png"
  ],
  featured: [
    "/assets/images/aurora-jewelry-hero.png",
    "/assets/images/product-heart.png",
    "/assets/images/product-moon.png",
    "/assets/generated/ring.png"
  ],
  bespoke: "/assets/images/aurora-jewelry-hero.png",
  editorial: [
    "/assets/generated/bracelet.png",
    "/assets/generated/pendant1.png",
    "/assets/generated/earrings.png"
  ],
  productBySlug: {
    "quiet-pearl-ring": "/assets/images/aurora-jewelry-hero.png",
    "moon-bracelet": "/assets/images/product-moon.png",
    "silver-heart-pendant": "/assets/images/product-heart.png",
    "white-diamond-earrings": "/assets/generated/earrings.png"
  }
};

export const REFERENCE_COPY = {
  uk: {
    navCollection: "Колекція",
    navConstructor: "Конструктор",
    heroSlides: [
      {
        eyebrow: "Авторська ювелірна майстерня",
        title: "Прикраси,\nнароджені\nз любові"
      },
      {
        eyebrow: "Персональний дизайн від майстра",
        title: "Кожна деталь —\nваша історія"
      },
      {
        eyebrow: "Колекція Aurora 2026",
        title: "Вічна\nелегантність"
      }
    ],
    heroCtaPrimary: "Переглянути колекцію",
    heroCtaSecondary: "Створити своє",
    trust: ["Ручна\nробота", "Прозора\nціна", "Персональний\nпідхід", "Безкоштовна\nдоставка"],
    featuredEyebrow: "Обрані твори",
    featuredTitle: "Колекція Aurora",
    featuredSubtitle: "Кожна прикраса — результат ручної праці та уваги до матеріалу",
    catalogButton: "Колекція →",
    bespokeEyebrow: "Bespoke",
    bespokeTitle: "Створіть своє\nунікальне прикраса",
    bespokeSubtitle: "Оберіть тип, матеріал, камені та гравіювання — ми втілимо ваш задум у металі",
    bespokeCta: "Відкрити конструктор",
    editorialEyebrow: "Підхід",
    editorialTitle: "Чому Aurora",
    editorialCards: [
      {
        title: "Пропорція та баланс",
        text: "Кожна форма виважена до міліметра. Ми не слідуємо моді — ми створюємо речі, що не старіють."
      },
      {
        title: "Персональність",
        text: "Гравіювання, вибір каменю, розмір — кожна деталь відображає вас."
      },
      {
        title: "Прозорий процес",
        text: "Від ескізу до готового виробу — ми тримаємо вас у курсі кожного кроку."
      }
    ],
    faqEyebrow: "FAQ",
    faqTitle: "Поширені питання",
    faqs: [
      {
        q: "Як довго виготовляється замовлення?",
        a: "Стандартний виріб — 10–14 днів, bespoke — від 3 до 6 тижнів залежно від складності."
      },
      {
        q: "Чи можна замовити гравіювання?",
        a: "Так, у конструкторі є поле для тексту. Латиниця, кирилиця, до 30 символів."
      },
      {
        q: "Яка гарантія на вироби?",
        a: "Усі вироби мають гарантію 12 місяців. Безкоштовне обслуговування та чищення раз на рік."
      },
      {
        q: "Як працює оплата і підтвердження?",
        a: "Після оформлення ми резервуємо виріб і зв’язуємося з вами для підтвердження деталей та передплати."
      }
    ],
    finalTitle: "Готові обрати своє?",
    finalSubtitle: "Перегляньте колекцію або створіть унікальне прикраса у конструкторі",
    finalPrimary: "Переглянути колекцію",
    finalSecondary: "Створити своє",
    catalogEyebrow: "Колекція",
    catalogTitle: "Усі твори",
    productBack: "← До колекції",
    productMaterial: "Матеріал",
    productStone: "Камінь",
    productSize: "Розмір",
    productDescription: "Опис",
    addToCart: "Додати до кошика",
    viewPiece: "Переглянути виріб",
    handcraftedFinish: "Ручна відділка",
    transparentPricing: "Прозора ціна",
    personalApproach: "Персональний підхід",
    constructorEyebrow: "Bespoke",
    constructorTitle: "Конструктор прикрас",
    constructorPreview: "Попередній перегляд",
    constructorTrustLeft: "10–21 день виготовлення",
    constructorTrustRight: "Безкоштовна доставка",
    required: "* обов'язково"
  },
  en: {
    navCollection: "Collection",
    navConstructor: "Constructor",
    heroSlides: [
      {
        eyebrow: "Signature handcrafted jewelry atelier",
        title: "Jewelry\nborn from\nlove"
      },
      {
        eyebrow: "Personal design from master craftspeople",
        title: "Every detail\nis your story"
      },
      {
        eyebrow: "Aurora Collection 2026",
        title: "Timeless\nElegance"
      }
    ],
    heroCtaPrimary: "View Collection",
    heroCtaSecondary: "Create Your Own",
    trust: ["Handcrafted", "Transparent\nPricing", "Personal\nApproach", "Free\nShipping"],
    featuredEyebrow: "Featured Works",
    featuredTitle: "Aurora Collection",
    featuredSubtitle: "Each piece is the result of handwork and close attention to material.",
    catalogButton: "Collection →",
    bespokeEyebrow: "Bespoke",
    bespokeTitle: "Create your\nunique piece",
    bespokeSubtitle: "Choose type, material, stones and engraving — we will bring your idea to life in metal",
    bespokeCta: "Open Constructor",
    editorialEyebrow: "Approach",
    editorialTitle: "Why Aurora",
    editorialCards: [
      {
        title: "Proportion and balance",
        text: "Every form is refined down to the millimeter. We do not chase trends — we create pieces that age gracefully."
      },
      {
        title: "Personality",
        text: "Engraving, stone choice, and size — each detail reflects you."
      },
      {
        title: "Transparent process",
        text: "From sketch to finished piece, we keep you informed at every step."
      }
    ],
    faqEyebrow: "FAQ",
    faqTitle: "Frequently Asked",
    faqs: [
      {
        q: "How long does production take?",
        a: "Standard pieces take 10–14 days, bespoke from 3 to 6 weeks depending on complexity."
      },
      {
        q: "Can I order engraving?",
        a: "Yes, the constructor includes a text field. Latin, Cyrillic, up to 30 characters."
      },
      {
        q: "What warranty do pieces have?",
        a: "All pieces carry a 12-month warranty. Free servicing and cleaning once a year."
      },
      {
        q: "How do payment and confirmation work?",
        a: "After checkout we reserve the piece and contact you to confirm details and prepayment."
      }
    ],
    finalTitle: "Ready to choose yours?",
    finalSubtitle: "Browse the collection or create a unique piece in the constructor",
    finalPrimary: "View Collection",
    finalSecondary: "Create Your Own",
    catalogEyebrow: "Collection",
    catalogTitle: "All Works",
    productBack: "← Back to collection",
    productMaterial: "Material",
    productStone: "Stone",
    productSize: "Size",
    productDescription: "Description",
    addToCart: "Add to cart",
    viewPiece: "View piece",
    handcraftedFinish: "Handcrafted Finish",
    transparentPricing: "Transparent Pricing",
    personalApproach: "Personal Approach",
    constructorEyebrow: "Bespoke",
    constructorTitle: "Jewelry Constructor",
    constructorPreview: "Preview",
    constructorTrustLeft: "10–21 day production",
    constructorTrustRight: "Free shipping",
    required: "* required"
  }
};

export const CONSTRUCTOR_SLOT_CONFIGS = {
  ring: [
    { id: "center", labelUk: "Центр", labelEn: "Center", size: "lg" },
    { id: "left", labelUk: "Ліворуч", labelEn: "Left", size: "sm" },
    { id: "right", labelUk: "Праворуч", labelEn: "Right", size: "sm" }
  ],
  bracelet: Array.from({ length: 6 }, (_, index) => ({
    id: `slot-${index + 1}`,
    labelUk: `Камінь ${index + 1}`,
    labelEn: `Stone ${index + 1}`,
    size: "sm"
  })),
  pendant: [
    { id: "pendant", labelUk: "Кулон", labelEn: "Pendant", size: "lg" }
  ],
  earrings: [
    { id: "left", labelUk: "Ліва", labelEn: "Left", size: "lg" },
    { id: "right", labelUk: "Права", labelEn: "Right", size: "lg" }
  ]
};

export const CONSTRUCTOR_STONE_MEDIA = {
  pearl: "/assets/generated/pearl.png",
  onyx: "/assets/generated/onyx.png",
  rose_quartz: "/assets/generated/rose_quartz.png",
  garnet: "/assets/generated/garnet.png",
  opal: "/assets/generated/opal.png",
  none: "/assets/preview/stone-none.svg",
  heart_charm: "/assets/generated/heart_charm.png"
};

export function compactCatalogFilters(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value)));
}

export function normalizeCatalogFilterChange(currentFilters, key, value) {
  const nextFilters = { ...currentFilters, [key]: value };
  if (!value) delete nextFilters[key];

  if (key === "type" && value !== "Ring") {
    delete nextFilters.ringSize;
    delete nextFilters.ringType;
  }
  if (key === "type" && value !== "Bracelet") {
    delete nextFilters.braceletLength;
  }

  return compactCatalogFilters(nextFilters);
}

export function productAttributeEntries(filters = {}) {
  const entries = [
    ["Type", filters.type],
    ["Metal", filters.metal],
    ["Stone type", filters.stoneType],
    ["Stone shape", filters.stoneShape],
    ["Stone color", filters.stoneColor],
    ["Stone size", filters.stoneSize]
  ];

  if (filters.type === "Ring") {
    entries.push(["Ring size", filters.ringSize], ["Ring type", filters.ringType]);
  }

  if (filters.type === "Bracelet") {
    entries.push(["Bracelet length", filters.braceletLength]);
  }

  return entries.filter(([, value]) => Boolean(value));
}

export function productAttributeValues(filters = {}) {
  return productAttributeEntries(filters).map(([, value]) => value);
}

export function referenceCopy(locale) {
  return REFERENCE_COPY[locale] || REFERENCE_COPY.en;
}

export function productDisplayImage(product, index = 0) {
  return (
    REFERENCE_IMAGES.productBySlug[product?.slug] ||
    REFERENCE_IMAGES.featured[index % REFERENCE_IMAGES.featured.length] ||
    product?.thumbnail_url ||
    FALLBACK_PRODUCT_IMAGE
  );
}

export function productTypeLabel(product, locale) {
  const labels = {
    uk: {
      Ring: "Каблучка",
      Bracelet: "Браслет",
      Earrings: "Сережки",
      Pendant: "Підвіска",
      Necklace: "Намисто"
    },
    en: {
      Ring: "Ring",
      Bracelet: "Bracelet",
      Earrings: "Earrings",
      Pendant: "Pendant",
      Necklace: "Necklace"
    }
  };

  const type = product?.filters?.type || product?.type || "Pendant";
  return labels[locale]?.[type] || type;
}

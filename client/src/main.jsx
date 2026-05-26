import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Heart,
  Menu,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  Check,
  Trash2,
  Truck,
  User,
  X
} from "lucide-react";
import { accountApi, adminCatalogApi, adminOrdersApi, authApi, cartApi, catalogApi, constructorApi, ordersApi } from "./api";
import {
  ABOUT_PAGE_CONTENT,
  CONSTRUCTOR_STONE_MEDIA,
  FALLBACK_PRODUCT_IMAGE,
  REFERENCE_IMAGES,
  localizeProductFilterValue,
  productAttributeEntries,
  productAttributeValues,
  productDisplayImage,
  productTypeLabel,
  referenceCopy
} from "./content";
import {
  getReadyProductDefaultSize,
  getReadyProductNormalizedSize,
  getReadyProductSizeDefinition,
  getReadyProductSizeLabel,
  getReadyProductSizeOptions,
  getReadyProductSizeTitle,
  readyProductConfigurationsEqual
} from "./ready-product";
import {
  extractPendantChainOption,
  getPendantChainColorNote,
  getPendantChainOptionLabel,
  getPendantChainOptions,
  getPendantChainSummary,
  getPendantChainUpsellNote,
  normalizePendantType,
  resolveCustomDesignPendantChain,
  resolveReadyProductPendantChain
} from "./pendant-chain";
import { buildMaterialAwareBaseAssetCandidates, buildStoneCodeMap, JewelryPreview, previewStoneStyle } from "./jewelry-preview";
import { formatCurrency } from "./utils";
import "./styles.css";

const LOCAL_STORAGE_KEY = "aurora-locale";
const GUEST_CART_STORAGE_KEY = "aurora-guest-cart";
const POST_AUTH_REDIRECT_KEY = "aurora-post-auth-redirect";
const HOME_HERO_VIDEO = "/assets/videos/home-hero-main.mp4";
const HOME_HERO_POSTER = "/assets/images/aurora-jewelry-hero.png";
const LOCALE_LABELS = {
  uk: "UK",
  en: "EN"
};
const HOME_HERO_COPY = {
  uk: {
    eyebrow: "АВТОРСЬКА ЮВЕЛІРНА МАЙСТЕРНЯ",
    title: "Прикраси, створені навколо вашої історії",
    subtitle:
      "Оберіть готовий виріб із колекції або створіть власну прикрасу в конструкторі — з металом, каменем і деталями, що мають значення саме для вас.",
    primaryCta: "Переглянути колекцію",
    secondaryCta: "Створити прикрасу",
    note: "Готові вироби та персональні дизайни в одному просторі.",
    supportKicker: "Private atelier service",
    supportTitle: "Колекція та конструктор в одному просторі",
    supportText:
      "Готові авторські прикраси й можливість створити власний дизайн онлайн — від металу до каменю, форми й деталей.",
    supportPoints: [
      "Ручна робота",
      "Вибір металу й каменю",
      "Персональне налаштування"
    ]
  },
  en: {
    eyebrow: "HANDCRAFTED JEWELRY ATELIER",
    title: "Jewelry shaped around your story",
    subtitle:
      "Choose a finished piece from the collection or create your own design in the constructor — with the metal, stone, and details that feel personal to you.",
    primaryCta: "Explore the collection",
    secondaryCta: "Create your piece",
    note: "Finished jewelry and personal designs in one refined space.",
    supportKicker: "Private atelier service",
    supportTitle: "Collection and constructor in one space",
    supportText:
      "Finished handcrafted jewelry and the option to create your own design online — from metal and stone to shape and detail.",
    supportPoints: [
      "Handcrafted pieces",
      "Metal and stone selection",
      "Personal customization"
    ]
  }
};
const LOCALE_FORMATS = {
  uk: "uk-UA",
  en: "en-US"
};
const MAX_CART_ITEM_QUANTITY = 100;

const GENERATED_STONE_ASSETS = [
  { code: "none", label: "No stone", path: "/assets/preview/stone-none.svg" },
  { code: "pearl", label: "Pearl", path: "/assets/generated/pearl.png" },
  { code: "onyx", label: "Onyx", path: "/assets/generated/onyx.png" },
  { code: "rose_quartz", label: "Rose quartz", path: "/assets/generated/rose_quartz.png" },
  { code: "garnet", label: "Garnet", path: "/assets/generated/garnet.png" },
  { code: "opal", label: "Opal", path: "/assets/generated/opal.png" },
  { code: "diamond", label: "Diamond", path: "/assets/generated/diamind.png" },
  { code: "heart_charm", label: "Heart charm", path: "/assets/generated/heart_charm.png" }
];

const GENERATED_LAYOUT_BASES = {
  ring: ["/assets/generated/ring.png", "/assets/generated/ring-solitaire.png", "/assets/generated/ring-duet.png"],
  bracelet: ["/assets/generated/bracelet.png", "/assets/generated/bracelet-line.png", "/assets/generated/bracelet-duet.png"],
  earrings: ["/assets/generated/earrings.png", "/assets/generated/earrings-stud.png", "/assets/generated/earrings-arc.png"],
  pendant: {
    heart: ["/assets/generated/pendant1.png"],
    moon: ["/assets/generated/pendant2.png"],
    drop: ["/assets/generated/pendant3.png"]
  }
};

const CONSTRUCTOR_MATERIAL_TONES = {
  silver: "#b7bec8",
  gold: "#b8914f",
  rose_gold: "#c88d78"
};

const CONSTRUCTOR_PREVIEW_BASES = {
  bracelet: "/assets/generated/bracelet.png",
  ring: "/assets/generated/ring.png",
  pendant: {
    heart: "/assets/generated/pendant1.png",
    moon: "/assets/generated/pendant2.png",
    drop: "/assets/generated/pendant3.png"
  },
  earrings: "/assets/generated/earrings.png"
};

const CONSTRUCTOR_PREVIEW_SLOT_POSITIONS = {
  bracelet: {
    "slot-1": { left: "50%", top: "14.7%" },
    "slot-2": { left: "82.25%", top: "31.05%" },
    "slot-3": { left: "82.05%", top: "62%" },
    "slot-4": { left: "49.8%", top: "77.2%" },
    "slot-5": { left: "17.75%", top: "62%" },
    "slot-6": { left: "17.55%", top: "31.05%" }
  },
  ring: {
    left: { left: "23.1%", top: "53.4%" },
    center: { left: "50.4%", top: "49%" },
    right: { left: "78.2%", top: "53.4%" }
  },
  pendant: {
    heart: { left: "50.3%", top: "55.3%" },
    moon: { left: "51.2%", top: "53.5%" },
    drop: { left: "49.8%", top: "58.3%" }
  },
  earrings: {
    left: { left: "29.9%", top: "65.1%" },
    right: { left: "70.8%", top: "65.1%" }
  }
};

const CONSTRUCTOR_STONE_SCALE = {
  pearl: { slot: "126%", picker: "122%", preview: "128%" },
  onyx: { slot: "126%", picker: "122%", preview: "128%" },
  rose_quartz: { slot: "126%", picker: "122%", preview: "128%" },
  garnet: { slot: "126%", picker: "122%", preview: "128%" },
  opal: { slot: "126%", picker: "122%", preview: "128%" },
  heart_charm: { slot: "94%", picker: "92%", preview: "96%" }
};

function resolveStoneMediaMap(values = []) {
  const next = { ...CONSTRUCTOR_STONE_MEDIA };
  values.forEach((item) => {
    const code = String(item?.code || "").trim();
    const assetPath = String(item?.asset_url || item?.asset_path || "").trim();
    if (code && assetPath) next[code] = assetPath;
  });
  return next;
}

function stoneBackgroundStyle(code, mode = "slot", mediaMap = CONSTRUCTOR_STONE_MEDIA) {
  const url = mediaMap[code] || CONSTRUCTOR_STONE_MEDIA[code] || CONSTRUCTOR_STONE_MEDIA.pearl;
  const scale = CONSTRUCTOR_STONE_SCALE[code]?.[mode] || "128%";
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: scale,
    backgroundPosition: "center center"
  };
}

const translations = {
  en: {
    navCollections: "Collections",
    navBespoke: "Bespoke",
    navCare: "Care",
    navFaq: "FAQ",
    searchPlaceholder: "Search jewelry...",
    account: "Account",
    authLoginTitle: "Sign in",
    authRegisterTitle: "Create account",
    authLoginTab: "Sign in",
    authRegisterTab: "Create account",
    authSubmitLogin: "Sign in",
    authSubmitRegister: "Create account",
    authGoogle: "Continue with Google",
    authVerificationTitle: "Verify email",
    authVerificationText: "Enter the confirmation code we sent to your email.",
    authVerificationCode: "Verification code",
    authSubmitVerification: "Verify account",
    authResendCode: "Resend code",
    authBackToLogin: "Back to sign in",
    authLoginLead: "Sign in to continue checkout, review your reservations, and keep every atelier update in one place.",
    authRegisterLead: "Create your account to reserve pieces, confirm delivery details, and follow each order through the atelier.",
    authVerifyLead: "We protect your reservation history with a short confirmation step before the atelier opens your account.",
    authPasswordHint: "Minimum 6 characters.",
    authLoginBadge: "Private client access",
    authRegisterBadge: "Create your client profile",
    authVerifyBadge: "Verify your email",
    authSignInChip1: "Order timeline",
    authSignInChip2: "Checkout resume",
    authRegisterChip1: "Atelier updates",
    authRegisterChip2: "Faster checkout",
    authVerifyChip1: "Secure access",
    authVerifyChip2: "Protected reservations",
    authAsideLoginText: "A quiet client space for tracking atelier progress, confirming delivery details, and returning to the pieces you reserved.",
    authAsideRegisterText: "Your account keeps bespoke requests, ready pieces, and every status update in one refined place.",
    authAsideVerifyText: "One final confirmation step links your email to your reservations, atelier notes, and future order updates.",
    password: "Password",
    cart: "Cart",
    toggleLanguage: "Toggle language",
    toggleNavigation: "Toggle navigation",
    heroLabel: "Aurora Atelier highlights",
    previousSlide: "Previous slide",
    nextSlide: "Next slide",
    showSlide: "Show",
    hero1Title: "Ethereal Elegance",
    hero1Subtitle: "Handcrafted jewelry collection",
    hero1Description: "Discover timeless pieces that carry a quiet, personal kind of luxury.",
    hero1Cta: "Explore Collection",
    hero2Title: "Artisan Craftsmanship",
    hero2Subtitle: "Bespoke jewelry design",
    hero2Description: "Create a unique necklace or bracelet with materials, stones and engraving chosen by you.",
    hero2Cta: "Start Designing",
    hero3Title: "Celestial Radiance",
    hero3Subtitle: "Custom order journey",
    hero3Description: "A focused atelier experience from first configuration to paid reservation and order status.",
    hero3Cta: "View Rarities",
    heroStatement: "Jewelry with the calm confidence of a personal signature.",
    heroLead: "Aurora Atelier creates made-to-order necklaces and bracelets for people who want meaning, proportion and tactility in every detail.",
    bookConsultation: "Book Consultation",
    trustGuarantee: "Atelier Guarantee",
    trustGuaranteeText: "Every piece is reviewed before delivery.",
    trustDelivery: "Clear Delivery",
    trustDeliveryText: "Delivery details stay visible through checkout.",
    trustMaterials: "Verified Materials",
    trustMaterialsText: "Only active constructor options are accepted.",
    trustService: "Bespoke Service",
    trustServiceText: "Personal design with transparent price logic.",
    productBadge: "Hand finished",
    productFavorite: "Atelier favorite",
    viewPiece: "View piece",
    featuredBadge: "Curated Selection",
    featuredTitle: "Featured Collections",
    featuredText: "Discover our most refined pieces, each a testament to exceptional craftsmanship and timeless design.",
    collectionPreparing: "The collection is being prepared",
    collectionPreparingText: "The atelier is selecting the next pieces. You can still build a custom design.",
    openConstructor: "Open constructor",
    viewAllCollections: "View All Collections",
    catalogEyebrow: "Artisan jewelry",
    catalogTitle: "Ready-made pieces",
    catalogText: "Choose a finished piece or move into the constructor for a personalized order. Every item keeps the calm Aurora proportion and a clear path to checkout.",
    designYourPiece: "Design your piece",
    browseCollection: "Browse collection",
    piecesInEdit: "pieces in the atelier edit",
    transparentBeforeCheckout: "transparent prices before checkout",
    handFinished: "Hand finished",
    handFinishedText: "Each piece is checked before delivery.",
    transparentPrice: "Transparent price",
    transparentPriceText: "The final amount is visible before checkout.",
    personalRoute: "Personal route",
    personalRouteText: "Start with a finished piece or personalize it.",
    collection: "Collection",
    atelierShowcase: "Atelier Showcase",
    sort: "Sort",
    featured: "Featured",
    priceLowHigh: "Price low to high",
    priceHighLow: "Price high to low",
    searchOrConstructor: "Change your search or open the constructor to build a personal design.",
    productUnavailable: "This piece is not available",
    returnToCollection: "Return to collection",
    loadingPiece: "Loading atelier piece",
    preparingProduct: "Preparing product details.",
    atelierSelected: "Atelier selected",
    material: "Material",
    checkedFinish: "checked finish",
    fit: "Fit",
    dailyWear: "balanced for daily wear",
    gift: "Gift",
    personalNote: "ready for a personal note",
    adding: "Adding...",
    addToOrder: "Add to order",
    addedPiece: "Piece added to your order.",
    authRequired: "Sign in to save the piece to your order.",
    care: "Care",
    careProductText: "Wipe with a soft cloth after wear and store separately from other jewelry.",
    delivery: "Delivery",
    deliveryText: "We confirm the order after prepayment and keep the status visible in your account.",
    personalVersion: "Prefer a personal version? Open the constructor",
    productStoryTitle: "From finished piece to personal signature.",
    productPoint1: "Choose the ready piece",
    productPoint2: "Reserve it through checkout",
    productPoint3: "Track the atelier timeline",
    engravingPlaceholder: "Initials, date or one quiet word",
    chooseOption: "Choose option",
    constructorEyebrow: "Build your own piece",
    constructorTitle: "Jewelry constructor",
    constructorText: "Compose a personal piece with atelier rules. The server validates your choices, calculates the price, and keeps the preview layered as you work.",
    constructorUnavailable: "Constructor is unavailable",
    personalComposition: "Personal composition",
    builderTitle: "Build a piece with atelier rules.",
    builderText: "Choose only the details that change the character of the piece. Required fields are marked and checked by the pricing service.",
    jewelryType: "Jewelry type",
    currentPrice: "Current price",
    designReady: "The design is ready to be reserved in your order.",
    fillRequired: "Fill required parameters",
    addToCart: "Add to cart",
    addCustomDesign: "Add custom design",
    customAdded: "Custom design added to your order.",
    livePreview: "Live preview",
    layeredPiece: "Your piece, layered.",
    calculating: "Calculating",
    validated: "Validated",
    serverSidePrice: "server-side price",
    piece: "Piece",
    currentType: "current type",
    selectedDetails: "selected details",
    almostThere: "Almost there",
    yourCart: "Your cart",
    cartIntro: "Review selected pieces, adjust quantities and continue into secure checkout.",
    cartDidNotLoad: "Cart did not load",
    loadingCart: "Loading your cart",
    preparingCart: "Preparing your order edit.",
    orderEdit: "Order edit",
    emptyCartTitle: "Your order edit is still empty",
    emptyCartText: "Choose a finished piece or create a custom design before checkout.",
    exploreCollection: "Explore collection",
    selectedPieces: "Selected pieces",
    personalDesign: "Personal design",
    finishedPiece: "Finished piece",
    qty: "Qty",
    configuredDesign: "Configured design",
    remove: "Remove",
    itemRemoved: "Item removed from your order.",
    reservationSummary: "Reservation summary",
    readyCheckout: "Ready for checkout",
    subtotal: "Subtotal",
    proceedCheckout: "Proceed to secure checkout",
    awaitingPayment: "Reservation created",
    confirmed: "Confirmed",
    inProgress: "In progress",
    completed: "Completed",
    purchaseHistory: "Purchase history",
    myOrders: "My orders",
    ordersIntro: "Follow every reservation from payment confirmation to atelier completion.",
    ordersDidNotLoad: "Orders did not load",
    loadingOrders: "Loading your orders",
    preparingHistory: "Preparing atelier history.",
    atelierHistory: "Atelier history",
    noOrdersTitle: "No atelier orders yet",
    noOrdersText: "When you reserve a piece, every status update will appear here.",
    chooseFirstPiece: "Choose first piece",
    orderTotal: "Order total",
    orderAttention: "This order needs atelier attention.",
    orderOnSchedule: "Production status is on schedule.",
    orderDidNotLoad: "Order did not load",
    loadingOrder: "Loading order details",
    preparingDossier: "Preparing the atelier dossier.",
    orderDossier: "Order dossier",
    reservedTotal: "reserved total",
    orderItems: "Pieces in this order",
    atelierTimeline: "Atelier timeline",
    checkout: "Checkout",
    secureCheckout: "Secure checkout",
    confirmOrder: "Confirm your order",
    checkoutIntro: "Reserve selected pieces, leave delivery details, and we will contact you to confirm the next step.",
    checkoutDidNotLoad: "Checkout did not load",
    loadingCheckout: "Loading checkout",
    preparingReservation: "Preparing secure reservation.",
    nothingToReserve: "Nothing to reserve yet",
    addBeforeCheckout: "Add a piece before opening checkout.",
    secureReservation: "Secure reservation",
    confirmDetails: "Confirm details for the atelier",
    confirmDetailsText: "We use these details to confirm delivery and keep you updated on the order status.",
    name: "Name",
    email: "Email",
    phone: "Phone",
    deliveryMethod: "Delivery method",
    novaPoshta: "Nova Poshta",
    courier: "Courier",
    deliveryAddress: "Delivery address",
    addressPlaceholder: "City, branch or full courier address",
    acceptOffer: "I accept the public offer and understand the custom production terms.",
    acceptReturn: "I accept the return policy for personalized jewelry.",
    creatingOrder: "Creating reservation...",
    createOrder: "Create reservation",
    orderSummary: "Order summary",
    reservedAfterPrepayment: "Reserved for confirmation",
    total: "Total",
    paymentCopy: "We reserve your piece immediately and confirm delivery and prepayment with you afterwards.",
    stepOrderCreated: "reservation created",
    stepPaymentConfirmed: "manager confirms details",
    stepAtelierStarts: "atelier starts",
    orderReservedToast: "Your order is reserved. We will confirm the next step with you shortly.",
    orderReservedCopy: "Your order has been reserved. Open the dossier to track status and await our confirmation.",
    confirming: "Confirming...",
    confirmDemoPayment: "Open order dossier",
    bespokeService: "Bespoke Service",
    bespokeTitle: "Create Your Masterpiece",
    bespokeText: "Work through the constructor to shape a personal necklace or bracelet. Choose the material, stone, length and engraving while the system keeps the configuration valid and the price transparent.",
    bespokePoint1: "Personal configuration in the jewelry constructor",
    bespokePoint2: "Server-validated options and transparent pricing",
    bespokePoint3: "Checkout, payment confirmation and order timeline",
    startJourney: "Start Your Journey",
    editorial1Label: "01 / Proportion",
    editorial1Title: "Designed to sit naturally, not loudly.",
    editorial1Text: "Every silhouette is built around balance: chain length, central focus and the negative space around the piece.",
    editorial2Label: "02 / Personal mark",
    editorial2Title: "Customization with restraint.",
    editorial2Text: "Choose material, stone and engraving without losing the quiet line of the original design.",
    editorial3Label: "03 / Process",
    editorial3Title: "Clear order path from first click.",
    editorial3Text: "The system validates your configuration, calculates the final price and keeps every order status visible.",
    careGuide: "Care guide",
    careHeading: "Made for everyday rituals, cared for with intention.",
    careText: "Store separately, avoid perfume on metal, wipe after wear and keep stones away from aggressive chemistry. We include care notes with every order.",
    afterWearing: "After wearing",
    softCloth: "soft dry cloth",
    storage: "Storage",
    separatePouch: "separate pouch",
    cleaning: "Cleaning",
    noChemistry: "no abrasive chemistry",
    questions: "Questions",
    faqHeading: "Everything important before you order.",
    faq1Q: "When does production start?",
    faq1A: "After full prepayment. This protects the atelier time reserved for your piece.",
    faq2Q: "Can I change the design later?",
    faq2A: "Small changes are possible before the order moves into production.",
    faq3Q: "How do I track status?",
    faq3A: "Your account shows the current order status and history from confirmation to completion.",
    footerText: "Quietly expressive jewelry made for personal rituals, meaningful gifts and everyday elegance.",
    footerCollections: "Collections",
    readyPieces: "Ready pieces",
    constructor: "Constructor",
    footerServices: "Services",
    bespokeDesign: "Bespoke design",
    contact: "Contact",
    kharkivAtelier: "Kharkiv atelier",
    finalCta: "Create the piece you will reach for without thinking."
  },
  uk: {
    navCollections: "Колекція",
    navBespoke: "На замовлення",
    navCare: "Догляд",
    navFaq: "FAQ",
    searchPlaceholder: "Пошук прикрас...",
    account: "Акаунт",
    authLoginTitle: "Вхід до акаунта",
    authRegisterTitle: "Створити акаунт",
    authLoginTab: "Вхід",
    authRegisterTab: "Реєстрація",
    authSubmitLogin: "Увійти",
    authSubmitRegister: "Зареєструватися",
    authGoogle: "Продовжити з Google",
    authVerificationTitle: "Підтвердіть email",
    authVerificationText: "Введіть код підтвердження, який ми надіслали на вашу пошту.",
    authVerificationCode: "Код підтвердження",
    authSubmitVerification: "Підтвердити акаунт",
    authResendCode: "Надіслати код ще раз",
    authBackToLogin: "Повернутися до входу",
    authLoginLead: "Увійдіть, щоб продовжити оформлення, переглядати свої резерви та зберігати всі оновлення ательє в одному місці.",
    authRegisterLead: "Створіть акаунт, щоб резервувати вироби, підтверджувати доставку та відстежувати кожне замовлення в ательє.",
    authVerifyLead: "Ми захищаємо історію ваших резервів коротким підтвердженням email перед відкриттям доступу до акаунта.",
    authPasswordHint: "Мінімум 6 символів.",
    authLoginBadge: "Приватний кабінет клієнта",
    authRegisterBadge: "Створення клієнтського профілю",
    authVerifyBadge: "Підтвердження email",
    authSignInChip1: "Статуси замовлень",
    authSignInChip2: "Продовження оформлення",
    authRegisterChip1: "Оновлення ательє",
    authRegisterChip2: "Швидше оформлення",
    authVerifyChip1: "Захищений доступ",
    authVerifyChip2: "Збережені резерви",
    authAsideLoginText: "Спокійний клієнтський простір для відстеження етапів ательє, підтвердження доставки та повернення до зарезервованих виробів.",
    authAsideRegisterText: "Ваш акаунт зберігає індивідуальні запити, готові вироби та кожне оновлення статусу в одному вишуканому місці.",
    authAsideVerifyText: "Останній крок підтвердження поєднує вашу пошту з резервами, нотатками ательє та майбутніми оновленнями замовлень.",
    password: "Пароль",
    cart: "Кошик",
    toggleLanguage: "Перемкнути мову",
    toggleNavigation: "Відкрити навігацію",
    heroLabel: "Слайди Aurora Atelier",
    previousSlide: "Попередній слайд",
    nextSlide: "Наступний слайд",
    showSlide: "Показати",
    hero1Title: "Тиха елегантність",
    hero1Subtitle: "Авторська колекція прикрас",
    hero1Description: "Відкрийте позачасові вироби з м'яким особистим відчуттям розкоші.",
    hero1Cta: "Дивитися колекцію",
    hero2Title: "Ручна майстерність",
    hero2Subtitle: "Дизайн прикрас на замовлення",
    hero2Description: "Створіть унікальне кольє або браслет з матеріалами, каменями й гравіюванням, які обираєте ви.",
    hero2Cta: "Почати дизайн",
    hero3Title: "Небесне сяйво",
    hero3Subtitle: "Шлях індивідуального замовлення",
    hero3Description: "Зосереджений шлях від першої конфігурації до оплати резерву й статусу замовлення.",
    hero3Cta: "Дивитися рідкісні вироби",
    heroStatement: "Прикраси зі спокійною впевненістю особистого підпису.",
    heroLead: "Aurora Atelier створює кольє та браслети на замовлення для тих, хто цінує сенс, пропорцію й тактильність у кожній деталі.",
    bookConsultation: "Замовити консультацію",
    trustGuarantee: "Гарантія ательє",
    trustGuaranteeText: "Кожен виріб перевіряється перед доставкою.",
    trustDelivery: "Зрозуміла доставка",
    trustDeliveryText: "Деталі доставки залишаються видимими під час оформлення.",
    trustMaterials: "Перевірені матеріали",
    trustMaterialsText: "Приймаються лише активні опції конструктора.",
    trustService: "Індивідуальний сервіс",
    trustServiceText: "Персональний дизайн із прозорою логікою ціни.",
    productBadge: "Ручне фінішування",
    productFavorite: "Вибір ательє",
    viewPiece: "Дивитися виріб",
    featuredBadge: "Добірка",
    featuredTitle: "Обрані колекції",
    featuredText: "Відкрийте найвитонченіші вироби, кожен з яких створений навколо майстерності й позачасового дизайну.",
    collectionPreparing: "Колекція готується",
    collectionPreparingText: "Ательє добирає наступні вироби. Ви вже можете створити персональний дизайн.",
    openConstructor: "Відкрити конструктор",
    viewAllCollections: "Дивитися всі колекції",
    catalogEyebrow: "Авторські прикраси",
    catalogTitle: "Готові вироби",
    catalogText: "Оберіть готовий виріб або перейдіть у конструктор для персонального замовлення. Кожна прикраса зберігає спокійну пропорцію Aurora і зрозумілий шлях до оформлення.",
    designYourPiece: "Створити прикрасу",
    browseCollection: "Переглянути колекцію",
    piecesInEdit: "виробів у добірці ательє",
    transparentBeforeCheckout: "прозорі ціни до оформлення",
    handFinished: "Ручне фінішування",
    handFinishedText: "Кожен виріб перевіряється перед доставкою.",
    transparentPrice: "Прозора ціна",
    transparentPriceText: "Фінальна сума видима до оформлення.",
    personalRoute: "Особистий маршрут",
    personalRouteText: "Почніть з готового виробу або персоналізуйте його.",
    collection: "Колекція",
    atelierShowcase: "Вітрина ательє",
    sort: "Сортування",
    featured: "Рекомендовані",
    priceLowHigh: "Ціна за зростанням",
    priceHighLow: "Ціна за спаданням",
    searchOrConstructor: "Змініть пошук або відкрийте конструктор, щоб створити персональний дизайн.",
    productUnavailable: "Цей виріб недоступний",
    returnToCollection: "Повернутися до колекції",
    loadingPiece: "Завантаження виробу",
    preparingProduct: "Готуємо деталі виробу.",
    atelierSelected: "Вибір ательє",
    material: "Матеріал",
    checkedFinish: "перевірений фініш",
    fit: "Посадка",
    dailyWear: "баланс для щоденного носіння",
    gift: "Подарунок",
    personalNote: "готово до особистої нотатки",
    adding: "Додаємо...",
    addToOrder: "Додати до замовлення",
    addedPiece: "Виріб додано до замовлення.",
    authRequired: "Увійдіть, щоб зберегти виріб у замовленні.",
    care: "Догляд",
    careProductText: "Протирайте м'якою тканиною після носіння й зберігайте окремо від інших прикрас.",
    delivery: "Доставка",
    deliveryText: "Ми підтверджуємо замовлення після передплати й показуємо статус у кабінеті.",
    personalVersion: "Хочете особисту версію? Відкрийте конструктор",
    productStoryTitle: "Від готового виробу до особистого підпису.",
    productPoint1: "Оберіть готовий виріб",
    productPoint2: "Зарезервуйте його через оформлення",
    productPoint3: "Відстежуйте таймлайн ательє",
    engravingPlaceholder: "Ініціали, дата або одне тихе слово",
    chooseOption: "Оберіть варіант",
    constructorEyebrow: "Створіть свою прикрасу",
    constructorTitle: "Конструктор прикрас",
    constructorText: "Зберіть персональний виріб за правилами ательє. Сервер перевіряє вибір, рахує ціну й оновлює шаровий перегляд.",
    constructorUnavailable: "Конструктор недоступний",
    personalComposition: "Персональна композиція",
    builderTitle: "Створіть виріб за правилами ательє.",
    builderText: "Оберіть лише деталі, які змінюють характер прикраси. Обов'язкові поля позначені й перевіряються сервісом ціни.",
    jewelryType: "Тип прикраси",
    currentPrice: "Поточна ціна",
    designReady: "Дизайн готовий до резервування у замовленні.",
    fillRequired: "Заповніть обов'язкові параметри",
    addToCart: "Додати до кошика",
    addCustomDesign: "Додати персональний дизайн",
    customAdded: "Персональний дизайн додано до замовлення.",
    livePreview: "Живий перегляд",
    layeredPiece: "Ваш виріб у шарах.",
    calculating: "Рахуємо",
    validated: "Перевірено",
    serverSidePrice: "ціна на сервері",
    piece: "Виріб",
    currentType: "поточний тип",
    selectedDetails: "обраних деталей",
    almostThere: "Майже готово",
    yourCart: "Ваш кошик",
    cartIntro: "Перегляньте обрані вироби, змініть кількість і переходьте до безпечного оформлення.",
    cartDidNotLoad: "Кошик не завантажився",
    loadingCart: "Завантаження кошика",
    preparingCart: "Готуємо ваше замовлення.",
    orderEdit: "Редагування замовлення",
    emptyCartTitle: "Ваше замовлення ще порожнє",
    emptyCartText: "Оберіть готовий виріб або створіть персональний дизайн перед оформленням.",
    exploreCollection: "Дивитися колекцію",
    selectedPieces: "Обрані вироби",
    personalDesign: "Персональний дизайн",
    finishedPiece: "Готовий виріб",
    qty: "К-сть",
    configuredDesign: "Налаштований дизайн",
    remove: "Видалити",
    itemRemoved: "Виріб видалено із замовлення.",
    reservationSummary: "Резюме резерву",
    readyCheckout: "Готово до оформлення",
    subtotal: "Проміжна сума",
    proceedCheckout: "Перейти до безпечного оформлення",
    awaitingPayment: "Резерв створено",
    confirmed: "Підтверджено",
    inProgress: "У роботі",
    completed: "Завершено",
    purchaseHistory: "Історія покупок",
    myOrders: "Мої замовлення",
    ordersIntro: "Відстежуйте кожен резерв від підтвердження оплати до завершення в ательє.",
    ordersDidNotLoad: "Замовлення не завантажилися",
    loadingOrders: "Завантаження замовлень",
    preparingHistory: "Готуємо історію ательє.",
    atelierHistory: "Історія ательє",
    noOrdersTitle: "Замовлень ательє ще немає",
    noOrdersText: "Коли ви зарезервуєте виріб, усі оновлення статусу з'являться тут.",
    chooseFirstPiece: "Обрати перший виріб",
    orderTotal: "Сума замовлення",
    orderAttention: "Це замовлення потребує уваги ательє.",
    orderOnSchedule: "Виробничий статус у графіку.",
    orderDidNotLoad: "Замовлення не завантажилося",
    loadingOrder: "Завантаження деталей замовлення",
    preparingDossier: "Готуємо досьє ательє.",
    orderDossier: "Досьє замовлення",
    reservedTotal: "зарезервована сума",
    orderItems: "Вироби в цьому замовленні",
    atelierTimeline: "Таймлайн ательє",
    checkout: "Оформлення",
    secureCheckout: "Безпечне оформлення",
    confirmOrder: "Підтвердіть замовлення",
    checkoutIntro: "Зарезервуйте обрані вироби, залиште деталі доставки, і ми зв’яжемося з вами для підтвердження наступного кроку.",
    checkoutDidNotLoad: "Оформлення не завантажилося",
    loadingCheckout: "Завантаження оформлення",
    preparingReservation: "Готуємо безпечний резерв.",
    nothingToReserve: "Поки немає що резервувати",
    addBeforeCheckout: "Додайте виріб перед оформленням.",
    secureReservation: "Безпечний резерв",
    confirmDetails: "Підтвердіть деталі для ательє",
    confirmDetailsText: "Ми використаємо ці дані для доставки й оновлень статусу замовлення.",
    name: "Ім'я",
    email: "Email",
    phone: "Телефон",
    deliveryMethod: "Спосіб доставки",
    novaPoshta: "Нова пошта",
    courier: "Кур'єр",
    deliveryAddress: "Адреса доставки",
    addressPlaceholder: "Місто, відділення або повна адреса",
    acceptOffer: "Я приймаю публічну оферту й умови персонального виготовлення.",
    acceptReturn: "Я приймаю політику повернення персоналізованих прикрас.",
    creatingOrder: "Створюємо резерв...",
    createOrder: "Створити резерв",
    orderSummary: "Резюме замовлення",
    reservedAfterPrepayment: "Резерв до підтвердження",
    total: "Разом",
    paymentCopy: "Ми одразу резервуємо виріб і окремо підтверджуємо з вами доставку та передплату.",
    stepOrderCreated: "резерв створено",
    stepPaymentConfirmed: "менеджер підтверджує деталі",
    stepAtelierStarts: "ательє починає",
    orderReservedToast: "Замовлення зарезервовано. Ми окремо підтвердимо з вами наступний крок.",
    orderReservedCopy: "Ваше замовлення зарезервовано. Відкрийте досьє та очікуйте підтвердження від команди ательє.",
    confirming: "Підтверджуємо...",
    confirmDemoPayment: "Відкрити досьє замовлення",
    bespokeService: "Індивідуальний сервіс",
    bespokeTitle: "Створіть свій виріб",
    bespokeText: "Пройдіть через конструктор, щоб сформувати персональне кольє або браслет. Оберіть матеріал, камінь, довжину й гравіювання, а система збереже валідність і прозору ціну.",
    bespokePoint1: "Персональна конфігурація в конструкторі прикрас",
    bespokePoint2: "Перевірені сервером опції й прозора ціна",
    bespokePoint3: "Оформлення, підтвердження оплати й таймлайн замовлення",
    startJourney: "Почати шлях",
    editorial1Label: "01 / Пропорція",
    editorial1Title: "Створено, щоб сидіти природно, а не голосно.",
    editorial1Text: "Кожен силует побудований навколо балансу: довжини ланцюжка, центрального акценту й простору навколо виробу.",
    editorial2Label: "02 / Особистий знак",
    editorial2Title: "Персоналізація без зайвого шуму.",
    editorial2Text: "Оберіть матеріал, камінь і гравіювання, не втрачаючи чисту лінію початкового дизайну.",
    editorial3Label: "03 / Процес",
    editorial3Title: "Зрозумілий шлях замовлення з першого кліку.",
    editorial3Text: "Система перевіряє конфігурацію, рахує фінальну ціну й показує кожен статус замовлення.",
    careGuide: "Догляд",
    careHeading: "Для щоденних ритуалів, з уважним доглядом.",
    careText: "Зберігайте окремо, не наносіть парфуми на метал, протирайте після носіння й бережіть камені від агресивної хімії. Ми додаємо нотатки з догляду до кожного замовлення.",
    afterWearing: "Після носіння",
    softCloth: "м'яка суха серветка",
    storage: "Зберігання",
    separatePouch: "окремий мішечок",
    cleaning: "Очищення",
    noChemistry: "без абразивної хімії",
    questions: "Питання",
    faqHeading: "Усе важливе перед замовленням.",
    faq1Q: "Коли починається виготовлення?",
    faq1A: "Після повної передплати. Так ми резервуємо час майстра саме під ваш виріб.",
    faq2Q: "Чи можна змінити дизайн пізніше?",
    faq2A: "Невеликі зміни можливі до переходу замовлення у виробництво.",
    faq3Q: "Як відстежувати статус?",
    faq3A: "У кабінеті видно поточний статус і всю історію від підтвердження до завершення.",
    footerText: "Авторські прикраси для особистих ритуалів, важливих подарунків і щоденної елегантності.",
    footerCollections: "Колекції",
    readyPieces: "Готові вироби",
    constructor: "Конструктор",
    footerServices: "Сервіси",
    bespokeDesign: "Дизайн на замовлення",
    contact: "Контакти",
    kharkivAtelier: "Харківське ательє",
    finalCta: "Створіть прикрасу, до якої будете тягнутися без роздумів."
  }
};

const LocaleContext = createContext(null);
const PENDING_CART_ITEM_KEY = "aurora-pending-cart-item";

function getInitialLocale() {
  const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  return stored === "en" || stored === "uk" ? stored : "uk";
}

function useI18n() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("Locale context is missing");
  return value;
}

function getCartItemCount(cart) {
  return (cart?.items || []).reduce((sum, item) => sum + Math.max(1, Number(item?.quantity) || 0), 0);
}

function syncCartCount(cart) {
  const count = getCartItemCount(cart);
  window.dispatchEvent(new CustomEvent("aurora:cart-updated", { detail: { count, cart } }));
  return count;
}

function announceCartAddition(detail = {}) {
  window.dispatchEvent(new CustomEvent("aurora:item-added", { detail }));
}

function isPendantItem(item, typeById = {}) {
  if (!item) return false;
  if (item.item_type === "ready_product") {
    return normalizePendantType(item.product_type);
  }
  const typeCode = typeById[String(item.jewelry_type_id)]?.code || item.jewelry_type_code;
  return normalizePendantType(typeCode) || Boolean(item.configuration?.chain);
}

function getItemChainConfiguration(item, typeById = {}) {
  if (!isPendantItem(item, typeById)) return null;
  return item?.configuration?.chain || { option: "none", length: null, metal: null, price: 0 };
}

function getPendantChainDisplay(item, locale, typeById = {}, options = {}) {
  const chain = getItemChainConfiguration(item, typeById);
  if (!chain) return null;

  const isEnglish = locale === "en";
  const includeLabel = options.includeLabel !== false;
  const useExplicitMetal = options.includeMetal !== false;

  if (chain.option === "none") {
    return {
      text: includeLabel
        ? (isEnglish ? "Configuration: without chain" : "Комплектація: без ланцюжка")
        : (isEnglish ? "without chain" : "без ланцюжка"),
      surcharge: null,
      chain
    };
  }

  const chainLength = chain.length || Number(String(chain.option || "").replace("cm", ""));
  const parts = [
    isEnglish ? `chain ${chainLength} cm` : `ланцюжок ${chainLength} см`,
    useExplicitMetal
      ? (isEnglish ? `color ${chain.metal}` : `колір ${chain.metal}`)
      : (isEnglish ? "matching pendant color" : "у колір підвіски")
  ];

  return {
    text: `${includeLabel ? (isEnglish ? "Configuration: " : "Комплектація: ") : ""}${parts.join(", ")}`,
    surcharge:
      Number(chain.price || 0) > 0
        ? `${isEnglish ? "Chain surcharge" : "Доплата за ланцюжок"}: ${formatCurrency(Number(chain.price || 0), "UAH", LOCALE_FORMATS[locale] || LOCALE_FORMATS.uk)}`
        : null,
    chain
  };
}

function buildGuestCart(items = []) {
  const safeItems = (items || []).map((item, index) => {
    const quantity = Math.max(1, Number(item?.quantity) || 1);
    const unitPrice = Number(item?.unit_price || 0);
    const slug = String(item?.product_slug || "").trim();
    const productType = item?.product_type || null;
    const normalizedSize =
      item?.item_type === "ready_product"
        ? getReadyProductNormalizedSize(productType, item?.configuration?.size || item?.selected_size)
        : "";
    const thumbnailUrl =
      item?.item_type === "ready_product" && slug
        ? `/assets/products/${slug}.png`
        : item?.thumbnail_url || null;
    return {
      ...item,
      id: item?.id || `guest-${index + 1}-${Date.now()}`,
      configuration:
        item?.item_type === "ready_product"
          ? {
              ...(item?.configuration || {}),
              ...(normalizedSize ? { size: normalizedSize } : {})
            }
          : item?.configuration || {},
      thumbnail_url: thumbnailUrl,
      quantity,
      unit_price: unitPrice,
      line_total: unitPrice * quantity
    };
  });
  const subtotal = safeItems.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
  return {
    id: "guest-cart",
    status: "guest",
    items: safeItems,
    subtotal_amount: subtotal,
    discount_amount: 0,
    total_amount: subtotal,
    currency: "UAH"
  };
}

function readGuestCart() {
  try {
    const raw = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) return buildGuestCart([]);
    const parsed = JSON.parse(raw);
    return buildGuestCart(parsed?.items || []);
  } catch {
    return buildGuestCart([]);
  }
}

function writeGuestCart(cart) {
  try {
    window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify({ items: cart?.items || [] }));
  } catch {}
}

function clearGuestCart() {
  try {
    window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
  } catch {}
}

function setPostAuthRedirect(path) {
  try {
    window.sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
  } catch {}
}

function consumePostAuthRedirect() {
  try {
    const next = window.sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
    if (!next) return null;
    window.sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    return next;
  } catch {
    return null;
  }
}

function addGuestCartItem(item) {
  const cart = readGuestCart();
  const nextItems = [...cart.items];
  const nextId = () => `guest-${window.crypto?.randomUUID?.() || Date.now()}`;

  if (item.item_type === "ready_product") {
    const normalizedSize = getReadyProductNormalizedSize(item.product_type, item?.configuration?.size || item?.selected_size);
    const nextReadyItem = {
      ...item,
      configuration: {
        ...(item.configuration || {}),
        ...(normalizedSize ? { size: normalizedSize } : {})
      }
    };
    const existingIndex = nextItems.findIndex(
      (entry) =>
        entry.item_type === "ready_product" &&
        String(entry.product_id) === String(item.product_id) &&
        readyProductConfigurationsEqual(entry?.configuration || {}, nextReadyItem?.configuration || {})
    );
    if (existingIndex >= 0) {
      const current = nextItems[existingIndex];
      nextItems[existingIndex] = {
        ...current,
        quantity: Math.min(MAX_CART_ITEM_QUANTITY, Number(current.quantity || 1) + Number(item.quantity || 1))
      };
    } else {
      nextItems.push({
        ...nextReadyItem,
        id: nextId(),
        quantity: Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Number(nextReadyItem.quantity || 1)))
      });
    }
  } else {
    nextItems.push({
      ...item,
      id: nextId(),
      quantity: Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Number(item.quantity || 1)))
    });
  }

  const nextCart = buildGuestCart(nextItems);
  writeGuestCart(nextCart);
  syncCartCount(nextCart);
  return nextCart;
}

function updateGuestCartItem(itemId, quantity) {
  const cart = readGuestCart();
  const nextItems = cart.items.map((item) =>
    String(item.id) === String(itemId)
      ? { ...item, quantity: Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Number(quantity) || 1)) }
      : item
  );
  const nextCart = buildGuestCart(nextItems);
  writeGuestCart(nextCart);
  syncCartCount(nextCart);
  return nextCart;
}

function patchGuestCartItem(itemId, patch = {}) {
  const cart = readGuestCart();
  const nextItems = cart.items.map((item) => {
    if (String(item.id) !== String(itemId)) return item;
    return {
      ...item,
      ...patch,
      configuration: {
        ...(item.configuration || {}),
        ...(patch.configuration || {})
      }
    };
  });
  const nextCart = buildGuestCart(nextItems);
  writeGuestCart(nextCart);
  syncCartCount(nextCart);
  return nextCart;
}

function removeGuestCartItem(itemId) {
  const cart = readGuestCart();
  const nextItems = cart.items.filter((item) => String(item.id) !== String(itemId));
  const nextCart = buildGuestCart(nextItems);
  writeGuestCart(nextCart);
  syncCartCount(nextCart);
  return nextCart;
}

async function mergeGuestCartIntoAccountCart() {
  const guestCart = readGuestCart();
  if (!guestCart.items.length) return null;

  let lastCart = null;
  for (const item of guestCart.items) {
    const payload = {
      item_type: item.item_type,
      product_id: item.product_id,
      jewelry_type_id: item.jewelry_type_id,
      quantity: item.quantity,
      configuration: item.configuration
    };
    lastCart = await cartApi.addItem(payload);
  }

  clearGuestCart();
  if (lastCart) syncCartCount(lastCart);
  return lastCart;
}

function savePendingCartItem(payload) {
  try {
    window.sessionStorage.setItem(PENDING_CART_ITEM_KEY, JSON.stringify(payload));
  } catch {}
}

function consumePendingCartItem() {
  try {
    const raw = window.sessionStorage.getItem(PENDING_CART_ITEM_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PENDING_CART_ITEM_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [accountHref, setAccountHref] = useState("/auth");
  const [cartCelebrating, setCartCelebrating] = useState(false);
  const { locale, toggleLocale, t } = useI18n();
  const copy = referenceCopy(locale);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;

    async function refreshSession() {
      try {
        const session = await authApi.getSession();
        if (active) setAccountHref(session?.authenticated ? "/account" : "/auth");
      } catch {
        if (active) setAccountHref("/auth");
      }
    }

    refreshSession();
    window.addEventListener("focus", refreshSession);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshSession);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function refreshCartCount() {
      try {
        const cart = await cartApi.getCart();
        if (active) setCartCount(syncCartCount(cart));
      } catch {
        if (active) setCartCount(syncCartCount(readGuestCart()));
      }
    }

    function handleCartUpdated(event) {
      if (!active) return;
      const nextCount = Number(event?.detail?.count);
      setCartCount(Number.isFinite(nextCount) ? nextCount : 0);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") refreshCartCount();
    }

    function handleItemAdded() {
      if (!active) return;
      setCartCelebrating(false);
      window.requestAnimationFrame(() => setCartCelebrating(true));
      window.setTimeout(() => {
        if (active) setCartCelebrating(false);
      }, 900);
    }

    refreshCartCount();
    window.addEventListener("aurora:cart-updated", handleCartUpdated);
    window.addEventListener("aurora:item-added", handleItemAdded);
    window.addEventListener("focus", refreshCartCount);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener("aurora:cart-updated", handleCartUpdated);
      window.removeEventListener("aurora:item-added", handleItemAdded);
      window.removeEventListener("focus", refreshCartCount);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const links = [
    [copy.navHome, "/"],
    [copy.navAbout, "/about"],
    [copy.navCollection, "/catalog"],
    [copy.navConstructor, "/constructor"]
  ];
  const localeLabel = locale === "uk" ? "EN" : "UK";

  return (
    <header className={`site-nav${scrolled ? " scrolled" : ""}`}>
      <div className="nav-inner">
        <a className="nav-brand" href="/">
          Aurora Atelier
        </a>

        <nav className="nav-links-desktop" aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <a className="nav-link" key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <button type="button" className="icon-button header-action" onClick={toggleLocale} aria-label={t("toggleLanguage")}>
            <span className="lang-toggle">{localeLabel}</span>
          </button>
          <a className={`icon-button header-action bag-button${cartCelebrating ? " is-celebrating" : ""}`} href="/cart" aria-label={t("cart")}>
            <ShoppingBag aria-hidden="true" />
            {cartCount > 0 ? <span className="cart-badge">{cartCount > 99 ? "99+" : cartCount}</span> : null}
          </a>
          <a className="icon-button header-action" href={accountHref} aria-label={t("account")}>
            <User aria-hidden="true" />
          </a>
          <button
            type="button"
            className="icon-button header-action nav-mobile-toggle"
            aria-label={t("toggleNavigation")}
            onClick={() => setMobileMenuOpen((value) => !value)}
          >
            {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="nav-mobile-menu">
          {links.map(([label, href]) => (
            <a className="nav-mobile-link" key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
              {label}
            </a>
          ))}
        </div>
      ) : null}
    </header>
  );
}

function Hero() {
  const { locale } = useI18n();
  const hero = HOME_HERO_COPY[locale] || HOME_HERO_COPY.uk;

  return (
    <section className="aurora-hero" aria-label="Aurora Atelier hero">
      <div className="aurora-hero-media" aria-hidden="true">
        <img className="aurora-hero-poster" src={HOME_HERO_POSTER} alt="" />
        <video
          className="aurora-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={HOME_HERO_POSTER}
        >
          <source src={HOME_HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="aurora-hero-overlay" />
        <div className="aurora-hero-glow" />
      </div>

      <div className="aurora-hero-shell">
        <div className="aurora-hero-copy">
          <span className="aurora-hero-eyebrow">{hero.eyebrow}</span>
          <h1 className="aurora-hero-title">{hero.title}</h1>
          <p className="aurora-hero-statement">{hero.subtitle}</p>
          <div className="aurora-hero-actions">
            <button
              type="button"
              className="button"
              onClick={() => {
                window.location.href = "/catalog";
              }}
            >
              {hero.primaryCta}
            </button>
            <button
              type="button"
              className="button-ghost-light aurora-hero-secondary"
              onClick={() => {
                window.location.href = "/constructor";
              }}
            >
              {hero.secondaryCta}
            </button>
          </div>
          <p className="aurora-hero-lead">{hero.note}</p>
        </div>

      </div>
    </section>
  );
}

function TrustMetrics() {
  const { locale } = useI18n();
  const copy = referenceCopy(locale);
  const metrics = [
    { icon: Award, title: copy.trust[0] },
    { icon: Search, title: copy.trust[1] },
    { icon: User, title: copy.trust[2] },
    { icon: Truck, title: copy.trust[3] }
  ];

  return (
    <section className="trust-strip">
      {metrics.map(({ icon: Icon, title }) => (
        <article className="trust-item" key={title}>
          <div className="trust-icon">
            <Icon aria-hidden="true" />
          </div>
          <span className="trust-label" style={{ whiteSpace: "pre-line" }}>{title}</span>
        </article>
      ))}
    </section>
  );
}

function HomeTwoPaths() {
  const { locale } = useI18n();
  const copy = referenceCopy(locale);
  const [hiddenImages, setHiddenImages] = useState({
    collection: false,
    constructor: false
  });

  const cards = [
    {
      key: "collection",
      image: REFERENCE_IMAGES.homePaths?.collection,
      ...copy.twoPaths.collection
    },
    {
      key: "constructor",
      image: REFERENCE_IMAGES.homePaths?.constructor,
      ...copy.twoPaths.constructor
    }
  ];

  function handleImageError(key) {
    setHiddenImages((current) => (current[key] ? current : { ...current, [key]: true }));
  }

  return (
    <section className="home-paths-section section" data-locale={locale}>
      <div className="section-inner">
        <div className="home-paths-intro">
          <p className="home-paths-eyebrow">{copy.twoPaths.eyebrow}</p>
          <h2 className="home-paths-title">{copy.twoPaths.title}</h2>
        </div>
        <div className="home-paths-grid" role="list">
          {cards.map((card) => (
            <a key={card.key} className={`home-path-card home-path-card-${card.key}`} href={card.href}>
              <div className="home-path-media">
                {card.image && !hiddenImages[card.key] ? (
                  <img
                    src={card.image}
                    alt=""
                    loading="lazy"
                    onError={() => handleImageError(card.key)}
                  />
                ) : null}
                <div className="home-path-overlay" />
              </div>

              <div className="home-path-body">
                <span className="home-path-label">{card.label}</span>
                <div className="home-path-copy">
                  <h3 className="home-path-card-title">{card.title}</h3>
                  <p className="home-path-text">{card.text}</p>
                </div>
                <div className="home-path-tags">
                  {card.tags.map((tag) => (
                    <span key={tag} className="home-path-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="home-path-cta">
                  <span>{card.cta}</span>
                  <ChevronRight aria-hidden="true" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeCategories() {
  const { locale } = useI18n();
  const copy = referenceCopy(locale);
  const [hiddenImages, setHiddenImages] = useState({
    rings: false,
    earrings: false,
    bracelets: false,
    pendants: false
  });

  const categories = [
    { key: "rings", image: REFERENCE_IMAGES.homeCategories?.rings, ...copy.homeCategories.rings },
    { key: "earrings", image: REFERENCE_IMAGES.homeCategories?.earrings, ...copy.homeCategories.earrings },
    { key: "bracelets", image: REFERENCE_IMAGES.homeCategories?.bracelets, ...copy.homeCategories.bracelets },
    { key: "pendants", image: REFERENCE_IMAGES.homeCategories?.pendants, ...copy.homeCategories.pendants }
  ];

  function handleImageError(key) {
    setHiddenImages((current) => (current[key] ? current : { ...current, [key]: true }));
  }

  return (
    <section className="home-categories-section section" data-locale={locale}>
      <div className="section-inner">
        <div className="home-categories-heading">
          <p className="home-categories-eyebrow">{copy.homeCategories.eyebrow}</p>
          <h2 className="home-categories-title">{copy.homeCategories.title}</h2>
          <p className="home-categories-subtitle">{copy.homeCategories.subtitle}</p>
        </div>

        <div className="home-categories-grid" role="list">
          {categories.map((category) => (
            <a
              key={category.key}
              className={`home-category-card home-category-card-${category.key}`}
              href={category.href}
            >
              <div className="home-category-media">
                {category.image && !hiddenImages[category.key] ? (
                  <img
                    src={category.image}
                    alt=""
                    loading="lazy"
                    onError={() => handleImageError(category.key)}
                  />
                ) : null}
                <div className="home-category-overlay" />
              </div>

              <div className="home-category-copy">
                <h3 className="home-category-title-card">{category.title}</h3>
                <p className="home-category-text">{category.text}</p>
                <span className="home-category-cta">
                  <span>{category.cta}</span>
                  <ChevronRight aria-hidden="true" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function normalizeFeaturedProductPrice(product) {
  const value = Number(product?.price);
  return Number.isFinite(value) ? value : null;
}

function selectFeaturedProducts(products = []) {
  return [...(products || [])]
    .sort((left, right) => {
      const leftPrice = normalizeFeaturedProductPrice(left);
      const rightPrice = normalizeFeaturedProductPrice(right);

      if (rightPrice !== null && leftPrice === null) return 1;
      if (leftPrice !== null && rightPrice === null) return -1;
      if (rightPrice !== null && leftPrice !== null && rightPrice !== leftPrice) {
        return rightPrice - leftPrice;
      }

      return 0;
    })
    .slice(0, 4);
}

function FeaturedProductCard({ product, locale, index }) {
  const copy = referenceCopy(locale);
  const typeLabel = productTypeLabel(product, locale);
  const metalLabel = localizeProductFilterValue(product?.filters?.metal, locale);

  return (
    <a className="featured-card" href={`/products/${product.slug}`}>
      <div className="featured-card-media">
        <img src={productDisplayImage(product, index)} alt={product.name} />
        <div className="featured-card-topline">
          <span className="featured-card-badge">{copy.featuredCardBadge}</span>
          <span className="featured-card-type">{typeLabel}</span>
        </div>
        <div className="featured-card-overlay">
          <span className="featured-card-cta">
            <span>{copy.viewPiece}</span>
            <ChevronRight aria-hidden="true" />
          </span>
        </div>
      </div>
      <div className="featured-card-info">
        <div className="featured-card-name">{product.name}</div>
        <div className="featured-card-meta">
          <span>{typeLabel}</span>
          {metalLabel ? <span>{metalLabel}</span> : null}
        </div>
        <div className="featured-card-price">{formatCurrency(product.price, product.currency, LOCALE_FORMATS[locale])}</div>
      </div>
    </a>
  );
}

function FeaturedCollections({ products, locale }) {
  const featured = useMemo(() => selectFeaturedProducts(products), [products]);
  const copy = referenceCopy(locale === "uk-UA" ? "uk" : "en");

  return (
    <section className="section featured-section" id="collections">
      <div className="section-inner">
        <div className="featured-layout">
          <div className="featured-intro">
            <p className="featured-eyebrow">{copy.featuredEyebrow}</p>
            <h2 className="featured-title">{copy.featuredTitle}</h2>
            <p className="featured-subtitle">{copy.featuredSubtitle}</p>
            <div className="featured-section-footer">
              <a className="button" href="/catalog">
                {copy.catalogButton}
              </a>
            </div>
          </div>

          {featured.length ? (
            <div className="featured-grid">
              {featured.map((product, index) => (
                <FeaturedProductCard key={product.id || product.slug} product={product} locale={locale === "uk-UA" ? "uk" : "en"} index={index} />
              ))}
            </div>
          ) : (
            <div className="empty-state-react featured-empty-state">
              <h3>{copy.featuredTitle}</h3>
              <p>{copy.featuredEmptyText}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, locale }) {
  const { t } = useI18n();
  const attributes = productAttributeValues(product.filters, locale);

  return (
    <article className="react-product-card">
      <a className="product-image-link" href={`/products/${product.slug}`}>
        <img src={productDisplayImage(product)} alt={product.name} />
        <span className="product-badge">{t("productBadge")}</span>
        <span className="favorite-button" aria-hidden="true">
          <Heart />
        </span>
      </a>
      <div className="react-product-body">
        <div className="rating-row">
          <span>5.0</span>
          <small>{t("productFavorite")}</small>
        </div>
        <h3>{product.name}</h3>
        {attributes.length ? (
          <div className="product-attribute-list" aria-label="Product attributes">
            {attributes.map((attribute) => (
              <span key={attribute}>{attribute}</span>
            ))}
          </div>
        ) : null}
        <div className="product-footer">
          <strong>{formatCurrency(product.price, product.currency, locale)}</strong>
          <a className="small-button" href={`/products/${product.slug}`}>
            {t("viewPiece")}
          </a>
        </div>
      </div>
    </article>
  );
}

const CATALOG_MULTI_FILTER_KEYS = [
  "metal",
  "stoneType",
  "stoneShape",
  "stoneColor",
  "stoneSize",
  "ringSize",
  "ringType",
  "braceletLength"
];

function createEmptyCatalogFilterState() {
  return {
    metal: [],
    stoneType: [],
    stoneShape: [],
    stoneColor: [],
    stoneSize: [],
    ringSize: [],
    ringType: [],
    braceletLength: [],
    priceMin: "",
    priceMax: "",
    sort: "default"
  };
}

function getCatalogFilterValue(product, key) {
  if (key === "ringType") return product?.filters?.ringType || product?.filters?.ringStyle || "";
  if (key === "stoneType") return product?.filters?.stoneType || product?.filters?.stone || "";
  return product?.filters?.[key] || "";
}

function parseCatalogNumericToken(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(",", ".");
  const numeric = Number.parseFloat(normalized);
  return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
}

function sortCatalogFacetValues(values = [], key, locale) {
  const normalizedLocale = locale === "uk" ? "uk-UA" : "en-US";
  const numericKeys = new Set(["ringSize", "braceletLength", "stoneSize"]);

  return [...values].sort((left, right) => {
    if (numericKeys.has(key)) {
      const diff = parseCatalogNumericToken(left) - parseCatalogNumericToken(right);
      if (diff !== 0) return diff;
    }

    return localizeProductFilterValue(left, locale).localeCompare(localizeProductFilterValue(right, locale), normalizedLocale);
  });
}

function normalizeCatalogPriceInput(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

const CATALOG_TYPE_FILTERS = new Set(["Ring", "Earrings", "Bracelet", "Pendant"]);

function getCatalogTypeFromSearch() {
  if (typeof window === "undefined") return "all";
  const queryType = new URLSearchParams(window.location.search).get("type");
  return CATALOG_TYPE_FILTERS.has(queryType) ? queryType : "all";
}

function productMatchesCatalogFilters(product, activeType, filters, options = {}) {
  const ignoreKey = options.ignoreKey || null;
  const ignorePrice = options.ignorePrice || false;
  const productType = product?.filters?.type || "Pendant";

  if (activeType !== "all" && productType !== activeType) {
    return false;
  }

  for (const key of CATALOG_MULTI_FILTER_KEYS) {
    if (ignoreKey === key) continue;
    const selectedValues = filters?.[key] || [];
    if (!selectedValues.length) continue;
    const productValue = getCatalogFilterValue(product, key);
    if (!productValue || !selectedValues.includes(productValue)) {
      return false;
    }
  }

  if (!ignorePrice) {
    const price = Number(product?.price || 0);
    const priceMin = Number(filters?.priceMin || 0);
    const priceMax = Number(filters?.priceMax || 0);

    if (filters?.priceMin !== "" && price < priceMin) {
      return false;
    }

    if (filters?.priceMax !== "" && price > priceMax) {
      return false;
    }
  }

  return true;
}

function getCatalogUiCopy(locale = "uk") {
  return locale === "uk"
    ? {
        all: "Усі",
        rings: "Каблучки",
        bracelets: "Браслети",
        pendants: "Підвіски",
        earrings: "Сережки",
        filters: "Фільтри",
        found: "Знайдено",
        items: "виробів",
        reset: "Скинути фільтри",
        sortDefault: "За замовчуванням",
        sortPriceAsc: "Ціна: від нижчої до вищої",
        sortPriceDesc: "Ціна: від вищої до нижчої",
        sortNewest: "Новинки",
        priceRange: "Діапазон ціни",
        from: "Від",
        to: "До",
        noResults: "За обраними фільтрами прикрас не знайдено.",
        categoryFiltersTitle: "Фільтри колекції",
        showResults: "Показати вироби",
        closeFilters: "Закрити фільтри",
        noProducts: "Колекція ще готується",
        noProductsText: "Спробуйте повернутися пізніше або перейдіть у конструктор."
      }
    : {
        all: "All",
        rings: "Rings",
        bracelets: "Bracelets",
        pendants: "Pendants",
        earrings: "Earrings",
        filters: "Filters",
        found: "Found",
        items: "pieces",
        reset: "Reset filters",
        sortDefault: "Default",
        sortPriceAsc: "Price: low to high",
        sortPriceDesc: "Price: high to low",
        sortNewest: "New arrivals",
        priceRange: "Price range",
        from: "From",
        to: "To",
        noResults: "No jewelry matched the selected filters.",
        categoryFiltersTitle: "Collection filters",
        showResults: "Show pieces",
        closeFilters: "Close filters",
        noProducts: "The collection is being prepared",
        noProductsText: "Please check back soon or move into the constructor."
      };
}

function CatalogFacetGroup({ title, options, selectedValues, onToggle, locale }) {
  if (!options.length) return null;

  return (
    <section className="catalog-filter-group">
      <div className="catalog-filter-group-title">{title}</div>
      <div className="catalog-filter-options">
        {options.map((option) => {
          const isActive = selectedValues.includes(option);
          return (
            <button
              key={option}
              type="button"
              className={`catalog-filter-chip${isActive ? " active" : ""}`}
              onClick={() => onToggle(option)}
            >
              <span>{localizeProductFilterValue(option, locale)}</span>
              {isActive ? <Check size={14} strokeWidth={2.4} /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}


function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [activeType, setActiveType] = useState(() => getCatalogTypeFromSearch());
  const [catalogFilters, setCatalogFilters] = useState(() => createEmptyCatalogFilterState());
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const { locale, t } = useI18n();
  const copy = referenceCopy(locale);
  const catalogUi = getCatalogUiCopy(locale);

  useEffect(() => {
    let active = true;
    setLoadError("");

    catalogApi
      .listProducts()
      .then((items) => {
        if (active) setProducts(items || []);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isMobileFiltersOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileFiltersOpen]);

  useEffect(() => {
    const syncFromUrl = () => setActiveType(getCatalogTypeFromSearch());
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (activeType === "all") {
      url.searchParams.delete("type");
    } else {
      url.searchParams.set("type", activeType);
    }
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState({}, "", nextUrl);
    }
  }, [activeType]);

  const categoryFilters = [
    { id: "all", label: catalogUi.all },
    { id: "Ring", label: catalogUi.rings },
    { id: "Bracelet", label: catalogUi.bracelets },
    { id: "Pendant", label: catalogUi.pendants },
    { id: "Earrings", label: catalogUi.earrings }
  ];

  const sortOptions = [
    { value: "default", label: catalogUi.sortDefault },
    { value: "price_asc", label: catalogUi.sortPriceAsc },
    { value: "price_desc", label: catalogUi.sortPriceDesc },
    { value: "newest", label: catalogUi.sortNewest }
  ];

  const typeScopedProducts = useMemo(() => {
    if (activeType === "all") return products;
    return products.filter((product) => (product.filters?.type || "Pendant") === activeType);
  }, [activeType, products]);

  const productsMatchingFilters = useMemo(
    () => typeScopedProducts.filter((product) => productMatchesCatalogFilters(product, activeType, catalogFilters)),
    [activeType, catalogFilters, typeScopedProducts]
  );

  const visibleProducts = useMemo(() => {
    const sorted = [...productsMatchingFilters];

    if (catalogFilters.sort === "price_asc") {
      sorted.sort((left, right) => Number(left.price || 0) - Number(right.price || 0));
      return sorted;
    }

    if (catalogFilters.sort === "price_desc") {
      sorted.sort((left, right) => Number(right.price || 0) - Number(left.price || 0));
      return sorted;
    }

    if (catalogFilters.sort === "newest") {
      sorted.sort((left, right) => {
        const leftDate = Date.parse(left.createdAt || 0) || 0;
        const rightDate = Date.parse(right.createdAt || 0) || 0;
        if (rightDate !== leftDate) return rightDate - leftDate;
        return Number(right.id || 0) - Number(left.id || 0);
      });
    }

    return sorted;
  }, [catalogFilters.sort, productsMatchingFilters]);

  const priceBounds = useMemo(() => {
    const scope = typeScopedProducts.filter((product) => productMatchesCatalogFilters(product, activeType, catalogFilters, { ignorePrice: true }));
    if (!scope.length) return { min: 0, max: 0 };

    const prices = scope.map((product) => Number(product.price || 0));
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }, [activeType, catalogFilters, typeScopedProducts]);

  const filterDefinitions = useMemo(() => {
    const definitions = [
      { key: "metal", label: locale === "uk" ? "Метал" : "Metal" },
      { key: "stoneType", label: locale === "uk" ? "Камінь" : "Stone" },
      { key: "stoneShape", label: locale === "uk" ? "Огранювання" : "Stone cut" },
      { key: "stoneColor", label: locale === "uk" ? "Колір каменю" : "Stone color" },
      { key: "stoneSize", label: locale === "uk" ? "Розмір каменю" : "Stone size" }
    ];

    if (activeType === "Ring") {
      definitions.push(
        { key: "ringSize", label: locale === "uk" ? "Розмір каблучки" : "Ring size" },
        { key: "ringType", label: locale === "uk" ? "Стиль каблучки" : "Ring style" }
      );
    }

    if (activeType === "Bracelet") {
      definitions.push({ key: "braceletLength", label: locale === "uk" ? "Довжина браслета" : "Bracelet length" });
    }

    return definitions
      .map((definition) => {
        const scopedProducts = typeScopedProducts.filter((product) =>
          productMatchesCatalogFilters(product, activeType, catalogFilters, { ignoreKey: definition.key })
        );
        const options = sortCatalogFacetValues(
          [...new Set(scopedProducts.map((product) => getCatalogFilterValue(product, definition.key)).filter(Boolean))],
          definition.key,
          locale
        );
        return { ...definition, options };
      })
      .filter((definition) => definition.options.length);
  }, [activeType, catalogFilters, locale, typeScopedProducts]);

  const hasActiveFilters = useMemo(() => {
    if (activeType !== "all") return true;
    if (catalogFilters.sort !== "default") return true;
    if (catalogFilters.priceMin !== "" || catalogFilters.priceMax !== "") return true;
    return CATALOG_MULTI_FILTER_KEYS.some((key) => (catalogFilters[key] || []).length > 0);
  }, [activeType, catalogFilters]);

  function handleTypeChange(typeId) {
    setActiveType(typeId);
    setCatalogFilters((current) => ({
      ...current,
      ringSize: typeId === "Ring" ? current.ringSize : [],
      ringType: typeId === "Ring" ? current.ringType : [],
      braceletLength: typeId === "Bracelet" ? current.braceletLength : []
    }));
  }

  function toggleFilterValue(key, value) {
    setCatalogFilters((current) => {
      const selectedValues = current[key] || [];
      const nextValues = selectedValues.includes(value)
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value];
      return { ...current, [key]: nextValues };
    });
  }

  function resetCatalogFilters() {
    setActiveType("all");
    setCatalogFilters(createEmptyCatalogFilterState());
    setIsMobileFiltersOpen(false);
  }

  function renderFiltersContent(isDrawer = false) {
    return (
      <div className={`catalog-filters-surface${isDrawer ? " is-drawer" : ""}`}>
        <div className="catalog-filters-surface-head">
          <div>
            <p className="catalog-filters-kicker">{catalogUi.filters}</p>
            <h2>{catalogUi.categoryFiltersTitle}</h2>
          </div>
          <div className="catalog-filters-head-actions">
            {hasActiveFilters ? (
              <button type="button" className="catalog-reset-button" onClick={resetCatalogFilters}>
                {catalogUi.reset}
              </button>
            ) : null}
            {isDrawer ? (
              <button type="button" className="catalog-drawer-close" onClick={() => setIsMobileFiltersOpen(false)} aria-label={catalogUi.closeFilters}>
                <X size={18} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="catalog-filters-scroll">
          {filterDefinitions.map((definition) => (
            <CatalogFacetGroup
              key={definition.key}
              title={definition.label}
              options={definition.options}
              selectedValues={catalogFilters[definition.key] || []}
              onToggle={(value) => toggleFilterValue(definition.key, value)}
              locale={locale}
            />
          ))}

          <section className="catalog-filter-group">
            <div className="catalog-filter-group-title">{catalogUi.priceRange}</div>
            <div className="catalog-price-grid">
              <label className="catalog-price-field">
                <span>{catalogUi.from}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={catalogFilters.priceMin}
                  onChange={(event) => setCatalogFilters((current) => ({ ...current, priceMin: normalizeCatalogPriceInput(event.target.value) }))}
                  placeholder={priceBounds.min ? String(priceBounds.min) : "0"}
                />
              </label>
              <label className="catalog-price-field">
                <span>{catalogUi.to}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={catalogFilters.priceMax}
                  onChange={(event) => setCatalogFilters((current) => ({ ...current, priceMax: normalizeCatalogPriceInput(event.target.value) }))}
                  placeholder={priceBounds.max ? String(priceBounds.max) : "0"}
                />
              </label>
            </div>
          </section>
        </div>

        {isDrawer ? (
          <div className="catalog-drawer-footer">
            {hasActiveFilters ? (
              <button type="button" className="catalog-drawer-secondary" onClick={resetCatalogFilters}>
                {catalogUi.reset}
              </button>
            ) : null}
            <button type="button" className="button catalog-drawer-apply" onClick={() => setIsMobileFiltersOpen(false)}>
              {catalogUi.showResults}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="page-main">
        <div className="page-header">
          <div className="section-inner">
            <p className="eyebrow">{copy.catalogEyebrow}</p>
            <h1 className="page-title">{copy.catalogTitle}</h1>
          </div>
        </div>

        <div className="catalog-trust-strip">
          <div className="section-inner">
            <div className="catalog-trust-items">
              {[copy.handcraftedFinish, copy.transparentPricing, copy.personalApproach].map((item) => (
                <div key={item} className="catalog-trust-item">
                  <span className="catalog-trust-dot" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="section-inner" style={{ paddingTop: "2rem" }}>
          <div className="filter-bar">
            {categoryFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`filter-pill${activeType === filter.id ? " active" : ""}`}
                onClick={() => handleTypeChange(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loadError ? <p className="load-error">{loadError}</p> : null}

          <div className="catalog-mobile-actions">
            <button type="button" className="catalog-mobile-filter-button" onClick={() => setIsMobileFiltersOpen(true)}>
              {catalogUi.filters}
            </button>
          </div>

          <div className="catalog-layout">
            <aside className="catalog-filters-column">
              {renderFiltersContent(false)}
            </aside>

            <div className="catalog-results-column">
              <div className="catalog-toolbar">
                <div className="catalog-toolbar-meta">
                  <strong>{catalogUi.found}</strong>
                  <span>{visibleProducts.length} {catalogUi.items}</span>
                </div>
                <div className="catalog-toolbar-actions">
                  {hasActiveFilters ? (
                    <button type="button" className="catalog-toolbar-reset" onClick={resetCatalogFilters}>
                      {catalogUi.reset}
                    </button>
                  ) : null}
                  <label className="catalog-sort-control">
                    <span>{t("sort")}</span>
                    <select
                      value={catalogFilters.sort}
                      onChange={(event) => setCatalogFilters((current) => ({ ...current, sort: event.target.value }))}
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {visibleProducts.length ? (
                <div className="product-grid">
                  {visibleProducts.map((product, index) => (
                    <a className="product-card" href={`/products/${product.slug}`} key={product.id || product.slug}>
                      <div className="product-card-img">
                        <img src={productDisplayImage(product, index)} alt={product.name} />
                      </div>
                      <div className="product-card-body">
                        <div className="product-card-type">{productTypeLabel(product, locale)}</div>
                        <div className="product-card-name">{product.name}</div>
                        <div className="product-card-material">
                          {localizeProductFilterValue(product.filters?.metal, locale) || (locale === "uk" ? "Авторська прикраса" : "Signature piece")}
                        </div>
                        <div className="product-card-price">{formatCurrency(product.price, product.currency, LOCALE_FORMATS[locale])}</div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : products.length ? (
                <div className="empty-state-react catalog-empty-state">
                  <h3>{catalogUi.noResults}</h3>
                  <p>{t("searchOrConstructor")}</p>
                  {hasActiveFilters ? (
                    <button type="button" className="small-button is-active" onClick={resetCatalogFilters}>
                      {catalogUi.reset}
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="empty-state-react catalog-empty-state">
                  <h3>{catalogUi.noProducts}</h3>
                  <p>{catalogUi.noProductsText}</p>
                </div>
              )}
            </div>
          </div>

          {isMobileFiltersOpen ? (
            <div className="catalog-drawer-shell" role="dialog" aria-modal="true" aria-label={catalogUi.filters}>
              <button type="button" className="catalog-drawer-backdrop" onClick={() => setIsMobileFiltersOpen(false)} aria-label={catalogUi.closeFilters} />
              <div className="catalog-drawer-panel">
                {renderFiltersContent(true)}
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}

function ProductPage() {
  const slug = window.location.pathname.split("/").filter(Boolean).at(-1);
  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedReadySize, setSelectedReadySize] = useState("");
  const [selectedChainOption, setSelectedChainOption] = useState("none");
  const { locale, t } = useI18n();
  const copy = referenceCopy(locale);

  useEffect(() => {
    let active = true;

    catalogApi
      .getProduct(slug)
      .then((item) => {
        if (active) setProduct(item);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!product) return;
    setSelectedReadySize(getReadyProductDefaultSize(product, locale));
    setSelectedChainOption(normalizePendantType(product) ? "none" : "none");
  }, [locale, product]);

  function showAddedFeedback(quantityValue, sizeCode, chain) {
    const sizeLabel = sizeCode ? getReadyProductSizeLabel(product, sizeCode, locale) : "";
    const chainLabel = chain?.option && chain.option !== "none" ? getPendantChainOptionLabel(chain.option, locale) : "";
    announceCartAddition({
      productSlug: product?.slug,
      quantity: quantityValue,
      size: sizeLabel,
      chain: chainLabel
    });
    setToast({
      kind: "success",
      title: t("addedPiece"),
      meta: [
        quantityValue > 1 ? `${t("qty")}: ${quantityValue}` : null,
        sizeLabel || null,
        chainLabel || null
      ].filter(Boolean).join(" · ")
    });
  }

  async function handleAddToCart() {
    if (!product) return;
    setIsAdding(true);
    const readyProductSize = getReadyProductNormalizedSize(product, selectedReadySize, locale);
    const readyChain = resolveReadyProductPendantChain(product, selectedChainOption);
    const payload = {
      item_type: "ready_product",
      product_id: product.id,
      configuration: {
        ...(readyProductSize ? { size: readyProductSize } : {}),
        ...(readyChain ? { chainOption: readyChain.option } : {})
      },
      quantity: qty
    };
    try {
      const cart = await cartApi.addItem(payload);
      syncCartCount(cart);
      showAddedFeedback(Math.min(MAX_CART_ITEM_QUANTITY, qty), readyProductSize, readyChain);
    } catch (error) {
      if (error.status === 401 || error.message.toLowerCase().includes("auth")) {
        addGuestCartItem({
          item_type: "ready_product",
          product_id: product.id,
          product_type: product.filters?.type || product.type || null,
          product_slug: product.slug,
          title: product.name,
          configuration: {
            ...(readyProductSize ? { size: readyProductSize } : {}),
            ...(readyChain ? { chain: readyChain } : {})
          },
          unit_price: Number(product.price || 0) + Number(readyChain?.price || 0),
          quantity: qty
        });
        showAddedFeedback(Math.min(MAX_CART_ITEM_QUANTITY, qty), readyProductSize, readyChain);
        return;
      }
      setToast({ kind: "error", title: error.message, meta: "" });
    } finally {
      setIsAdding(false);
    }
  }

  const primaryImage = product ? productDisplayImage(product) : FALLBACK_PRODUCT_IMAGE;
  const isPendantProduct = normalizePendantType(product);
  const readySizeOptions = product ? getReadyProductSizeOptions(product, locale) : [];
  const readySizeDefinition = product ? getReadyProductSizeDefinition(product) : null;
  const chainOptions = getPendantChainOptions(locale);
  const selectedChain = product ? resolveReadyProductPendantChain(product, selectedChainOption) : null;
  const selectedReadySizeLabel = readySizeOptions.find((item) => item.code === selectedReadySize)?.label || "";
  const displayFilters = product?.filters
    ? {
        ...product.filters,
        ringSize: product.filters.type === "Ring" && selectedReadySizeLabel ? selectedReadySizeLabel : product.filters.ringSize,
        braceletLength: product.filters.type === "Bracelet" && selectedReadySizeLabel ? selectedReadySizeLabel : product.filters.braceletLength
      }
    : null;
  const attributeEntries = productAttributeEntries(displayFilters, locale);
  const displayPrice = Number(product?.price || 0) + Number(selectedChain?.price || 0);

  return (
    <>
      <Header />
      <main className="page-main">
        {loadError ? (
          <section className="section">
            <div className="container empty-state-react">
              <h1>{t("productUnavailable")}</h1>
              <p>{loadError}</p>
              <a className="button" href="/catalog">
                {t("returnToCollection")}
              </a>
            </div>
          </section>
        ) : null}

        {!loadError && !product ? (
          <section className="section">
            <div className="container empty-state-react">
              <h1>{t("loadingPiece")}</h1>
              <p>{t("preparingProduct")}</p>
            </div>
          </section>
        ) : null}

        {product ? (
          <div className="section-inner" style={{ paddingTop: "2rem" }}>
            <a className="back-btn" href="/catalog">
              {copy.productBack}
            </a>
            <div className="product-layout">
              <div className="product-gallery">
                <div className="product-main-img">
                  <img src={primaryImage} alt={product.name} />
                </div>
              </div>

              <div className="product-info">
                <p className="product-type-label">{productTypeLabel(product, locale)}</p>
                <h1 className="product-name">{product.name}</h1>
                <div className="product-price-row">
                  <span className="product-price">{formatCurrency(displayPrice, product.currency, LOCALE_FORMATS[locale])}</span>
                </div>

                <div className="product-attrs">
                  {attributeEntries.map(([label, value]) => (
                    <div className="product-attr" key={label}>
                      <span className="product-attr-label">{label}</span>
                      <span className="product-attr-val">{value}</span>
                    </div>
                  ))}
                </div>

                {readySizeDefinition && readySizeOptions.length ? (
                  <div className="product-sizes">
                    <p className="product-attr-label" style={{ marginBottom: "0.75rem" }}>{getReadyProductSizeTitle(product, locale)}</p>
                    <div className="size-grid">
                      {readySizeOptions.map((size) => (
                        <button
                          className={`size-btn${selectedReadySize === size.code ? " active" : ""}`}
                          key={size.code}
                          type="button"
                          onClick={() => setSelectedReadySize(size.code)}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {isPendantProduct ? (
                  <div className="product-sizes">
                    <p className="product-attr-label" style={{ marginBottom: "0.75rem" }}>{locale === "uk" ? "Комплектація" : "Configuration"}</p>
                    <p className="product-desc-text" style={{ marginBottom: "1rem" }}>{getPendantChainUpsellNote(locale)}</p>
                    <div className="size-grid">
                      {chainOptions.map((option) => (
                        <button
                          className={`size-btn${selectedChainOption === option.code ? " active" : ""}`}
                          key={option.code}
                          type="button"
                          onClick={() => setSelectedChainOption(option.code)}
                        >
                          <span className="size-val">{option.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="summary-breakdown" style={{ marginTop: "1rem" }}>
                      <span>{getPendantChainColorNote(product?.filters?.metal, locale)}</span>
                      <span>{selectedChain?.price ? formatCurrency(selectedChain.price, product.currency, LOCALE_FORMATS[locale]) : locale === "uk" ? "0 грн" : "0 UAH"}</span>
                    </div>
                  </div>
                ) : null}

                <div className="product-desc">
                  <p className="product-attr-label" style={{ marginBottom: "0.5rem" }}>{copy.productDescription}</p>
                  <p className="product-desc-text">{product.description}</p>
                </div>

                <div className="product-actions">
                  <div className="qty-control">
                    <button className="qty-btn" type="button" onClick={() => setQty((current) => Math.max(1, current - 1))}>-</button>
                    <span className="qty-val">{qty}</span>
                    <button className="qty-btn" type="button" onClick={() => setQty((current) => Math.min(MAX_CART_ITEM_QUANTITY, current + 1))}>+</button>
                  </div>
                  <button className="button product-add-btn" type="button" onClick={handleAddToCart} disabled={isAdding}>
                    {isAdding ? t("adding") : copy.addToCart}
                  </button>
                </div>

                <div className="product-trust">
                  {[t("trustGuarantee"), t("trustDelivery"), t("trustMaterials")].map((item) => (
                    <div key={item} className="product-trust-item">
                      <Check aria-hidden="true" size={14} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
      {toast ? (
        <div className={`react-toast ${toast.kind === "success" ? "react-toast-success" : "react-toast-error"}`}>
          <div className="react-toast-icon">{toast.kind === "success" ? <Check aria-hidden="true" size={16} /> : <X aria-hidden="true" size={16} />}</div>
          <div className="react-toast-copy">
            <strong>{toast.title}</strong>
            {toast.meta ? <span>{toast.meta}</span> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function PreviewStage({ calculation, currentType }) {
  const layers = calculation?.preview_layers?.length
    ? calculation.preview_layers
    : currentType?.preview_base_asset
      ? [{ layer_key: "base", asset_url: currentType.preview_base_asset, z_index: 1 }]
      : [];

  const fallbackImage =
    currentType?.code === "bracelet"
      ? "/assets/preview/bracelet-base.png"
      : currentType?.code === "pendant"
        ? FALLBACK_PRODUCT_IMAGE
        : "/assets/preview/necklace-base.png";

  return (
    <div className="constructor-preview-stage">
      <img className="constructor-preview-fallback" src={fallbackImage} alt="" aria-hidden="true" />
      {layers.map((layer) =>
        layer.text_placeholder ? (
          <div className="constructor-preview-layer" style={{ zIndex: layer.z_index }} key={`${layer.layer_key}-${layer.z_index}`}>
            <span className="constructor-engraving">{layer.text_placeholder}</span>
          </div>
        ) : layer.asset_url ? (
          <div className="constructor-preview-layer" style={{ zIndex: layer.z_index }} key={`${layer.layer_key}-${layer.asset_url}`}>
            <img src={layer.asset_url} alt={layer.layer_key || "preview layer"} />
          </div>
        ) : null
      )}
    </div>
  );
}

function ConstructorField({ option, values, value, onChange }) {
  const { t } = useI18n();
  if (option.input_type === "text") {
    return (
      <label className="constructor-field">
        <span>
          {option.label}
          {option.is_required ? " *" : ""}
        </span>
        <input
          value={value || ""}
          maxLength={24}
          placeholder={t("engravingPlaceholder")}
          onChange={(event) => onChange(option.code, event.target.value)}
        />
      </label>
    );
  }

  return (
    <label className="constructor-field">
      <span>
        {option.label}
        {option.is_required ? " *" : ""}
      </span>
      <select value={value || ""} onChange={(event) => onChange(option.code, event.target.value)}>
        <option value="">{t("chooseOption")}</option>
        {values.map((item) => (
          <option value={item.code} key={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TypeIcon({ type, active }) {
  const color = active ? "var(--accent)" : "var(--ink-muted)";

  if (type === "ring") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <ellipse cx="16" cy="20" rx="12" ry="5" />
        <path d="M4 20 Q4 8 16 8 Q28 8 28 20" />
      </svg>
    );
  }

  if (type === "bracelet") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <ellipse cx="16" cy="16" rx="12" ry="8" />
        <ellipse cx="16" cy="14" rx="12" ry="8" />
      </svg>
    );
  }

  if (type === "pendant") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <path d="M10 10 Q16 5 22 10 Q22 15 16 22 Q10 15 10 10" />
        <circle cx="16" cy="24" r="2.5" fill={color} opacity="0.4" />
      </svg>
    );
  }

  if (type === "earrings") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <circle cx="10" cy="8" r="3" />
        <line x1="10" y1="11" x2="10" y2="18" />
        <ellipse cx="10" cy="23" rx="4" ry="5" />
        <circle cx="22" cy="8" r="3" />
        <line x1="22" y1="11" x2="22" y2="18" />
        <ellipse cx="22" cy="23" rx="4" ry="5" />
      </svg>
    );
  }

  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="16" cy="16" r="10" />
    </svg>
  );
}

function ConstructorGem({ value, size = "sm", mediaMap }) {
  const style = value
    ? stoneBackgroundStyle(value.code, "slot", mediaMap)
    : undefined;

  return <span className={`constructor-gem constructor-gem-${size}${value ? " has-image" : ""}`} style={style} aria-hidden="true" />;
}

function resolvePrimaryStoneCode(slots, selections) {
  const orderedCodes = slots.map((slot) => selections[slot.id]).filter(Boolean);
  if (!orderedCodes.length) return "";

  const counts = orderedCodes.reduce((accumulator, code) => {
    accumulator[code] = (accumulator[code] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] || orderedCodes[0] || "";
}

function ConstructorSlots({ locale, typeCode, slots = [], selections, values, onSelectSlot, mediaMap }) {
  const [activeSlotCode, setActiveSlotCode] = useState(null);
  const panelRef = React.useRef(null);
  const slotSignature = slots.map((slot) => slot.code).join("|");
  const displayedCount = slots.filter((slot) => {
    const selectedValue = values.find((item) => item.code === selections?.[slot.code]) || null;
    return Boolean(selectedValue && selectedValue.code !== "none");
  }).length;

  useEffect(() => {
    setActiveSlotCode(null);
  }, [typeCode, slotSignature]);

  useEffect(() => {
    if (!activeSlotCode || !panelRef.current) return;
    panelRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeSlotCode]);

  const activeValueCode = activeSlotCode ? selections?.[activeSlotCode] || "none" : "none";
  const activeSlot = slots.find((slot) => slot.code === activeSlotCode) || null;

  return (
    <div className="stone-slots-wrap">
      <div className="stone-slots-header">
        <span className="stone-count-badge">
          {displayedCount}/{slots.length} {locale === "uk" ? "слотів" : "slots"}
        </span>
      </div>
      <div className={`slots-row slots-row-${typeCode}`}>
        {slots.map((slot) => {
          const isActive = activeSlotCode === slot.code;
          const label = localizedConstructorValue(slot, locale, ["label"]);
          const selectedValue = values.find((item) => item.code === selections?.[slot.code]) || null;
          const hasSelection = Boolean(selectedValue && selectedValue.code !== "none");
          const slotSize = Number(slot?.diameter || 0) >= 15 ? "lg" : "sm";
          return (
            <div className="slot-container" key={slot.id || slot.code}>
              <button
                type="button"
                className={`stone-slot stone-slot-${slotSize}${hasSelection ? " slot-filled" : " slot-empty"}${isActive ? " slot-active" : ""}`}
                onClick={() => setActiveSlotCode(isActive ? null : slot.code)}
                title={label}
              >
                {hasSelection ? <ConstructorGem value={selectedValue} size={slotSize} mediaMap={mediaMap} /> : <span className="slot-add-icon">+</span>}
              </button>
              <span className="slot-label">{label}</span>
              {hasSelection ? <span className="slot-stone-name">{selectedValue.label}</span> : null}
            </div>
          );
        })}
      </div>

      {activeSlot ? (
        <div className="stone-picker-panel" ref={panelRef}>
          <p className="stone-picker-title">
            {locale === "uk" ? "Оберіть камінь для" : "Choose stone for"}{" "}
            <strong>{localizedConstructorValue(activeSlot, locale, ["label"])}</strong>
          </p>
          <div className="stone-picker-grid">
            {values.map((item) => {
              const isCurrent = item.code === activeValueCode;
              const canPreviewImage = item.code !== "none";
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`stone-pick-btn${isCurrent ? " current" : ""}`}
                  onClick={() => {
                    onSelectSlot(activeSlot.code, item.code);
                    setActiveSlotCode(null);
                  }}
                >
                  <span className={`stone-pick-media${canPreviewImage ? " has-image" : ""}`} style={canPreviewImage ? stoneBackgroundStyle(item.code, "picker", mediaMap) : undefined} />
                  <span className="stone-pick-meta">
                    <span className="stone-pick-name">{item.label}</span>
                    <span className="stone-pick-price">{item.price_delta > 0 ? `+${item.price_delta}` : item.price_delta || 0} грн</span>
                  </span>
                  {isCurrent ? (
                    <span className="stone-pick-check">
                      <Check aria-hidden="true" size={12} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ConstructorVisualPreview({ variant, slots = [], stonesByCode = {}, selections = {}, engraving = "", materialCode = "" }) {
  return (
    <div className="constructor-preview-art">
      <JewelryPreview
        variant={variant}
        slots={slots}
        stonesByCode={stonesByCode}
        selections={selections}
        engraving={engraving}
        materialCode={materialCode}
      />
    </div>
  );
}

function ConstructorPage() {
  const [config, setConfig] = useState(null);
  const [jewelryTypeId, setJewelryTypeId] = useState("");
  const [configuration, setConfiguration] = useState({});
  const [calculation, setCalculation] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const { locale, t } = useI18n();
  const copy = referenceCopy(locale);
  const modelLabel = locale === "uk" ? "Модель" : "Model";
  const materialLabel = locale === "uk" ? "Матеріал" : "Material";
  const sizeLabel = locale === "uk" ? "Розмір" : "Size";
  const stoneLabel = locale === "uk" ? "Камені" : "Stones";
  const engravingLabel = locale === "uk" ? "Гравіювання" : "Engraving";
  const requiredLabel = copy.required;
  const noVariantsText = locale === "uk" ? "Моделі скоро з’являться" : "Variants are coming soon";

  useEffect(() => {
    let active = true;

    constructorApi
      .getConfig()
      .then((data) => {
        if (!active) return;
        setConfig(data);
        setJewelryTypeId(String(data.types?.[0]?.id || ""));
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });

    return () => {
      active = false;
    };
  }, []);

  const types = config?.types || [];
  const variants = config?.variants || [];
  const stones = config?.stones || [];
  const variantStoneMatrix = config?.variantStoneMatrix || [];
  const currentType = types.find((item) => String(item.id) === String(jewelryTypeId)) || types[0] || null;
  const typeVariants = useMemo(
    () => variants
      .filter((item) => String(item.type_id) === String(currentType?.id))
      .sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0)),
    [variants, currentType]
  );
  const currentVariant = typeVariants.find((item) => String(item.id) === String(configuration.variant_id)) || typeVariants[0] || null;
  const currentSlots = useMemo(
    () => (
      currentVariant
        ? [...(config?.slotsByVariant?.[currentVariant.id] || [])].sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
        : []
    ),
    [config, currentVariant]
  );
  const stonesById = useMemo(() => Object.fromEntries(stones.map((stone) => [String(stone.id), stone])), [stones]);
  const stoneValues = useMemo(
    () => (
      currentVariant
        ? variantStoneMatrix
          .filter((item) => String(item.variant_id) === String(currentVariant.id) && item.is_enabled !== false)
          .sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
          .map((entry) => {
            const stone = stonesById[String(entry.stone_id)];
            return stone ? { ...stone, price_delta: Number(entry.price_delta || 0), is_default: Boolean(entry.is_default) } : null;
          })
          .filter(Boolean)
        : []
    ),
    [currentVariant, stonesById, variantStoneMatrix]
  );
  const stoneValuesByCode = useMemo(() => Object.fromEntries(stoneValues.map((item) => [item.code, item])), [stoneValues]);
  const stonesByCode = useMemo(() => buildStoneCodeMap(stoneValues), [stoneValues]);
  const stoneMediaMap = useMemo(() => resolveStoneMediaMap(stoneValues), [stoneValues]);
  const slotSelections = configuration.stone_slots && typeof configuration.stone_slots === "object" ? configuration.stone_slots : {};
  const selectedMaterial = currentType?.materials?.find((item) => item.code === configuration.material) || null;
  const selectedSize = currentType?.size_options?.find((item) => item.code === configuration.size) || null;
  const engravingEnabled = Boolean(currentType?.engraving?.enabled);

  useEffect(() => {
    if (!jewelryTypeId || !currentVariant?.id) return undefined;
    let active = true;
    setIsCalculating(true);

    const timer = window.setTimeout(() => {
      constructorApi
        .calculatePrice({
          jewelry_type_id: Number(jewelryTypeId),
          configuration
        })
        .then((result) => {
          if (active) setCalculation(result);
        })
        .catch((error) => {
          if (active) setToast(error.message);
        })
        .finally(() => {
          if (active) setIsCalculating(false);
        });
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [jewelryTypeId, currentVariant, configuration]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const missingRequired = calculation?.missing_required || [];
  const isValid = Boolean(calculation?.is_valid);
  const selectedSummary = [
    currentVariant ? [modelLabel, localizedConstructorValue(currentVariant, locale, ["name"])] : null,
    selectedMaterial ? [materialLabel, localizedConstructorValue(selectedMaterial, locale, ["label"])] : null,
    selectedSize ? [sizeLabel, localizedConstructorValue(selectedSize, locale, ["label"])] : null
  ].filter(Boolean);
  const selectedSlotSummary = currentSlots
    .map((slot) => {
      const stoneCode = slotSelections[slot.code];
      const stone = stoneValuesByCode[stoneCode];
      if (!stone || stone.code === "none") return null;
      return {
        id: slot.id || slot.code,
        label: localizedConstructorValue(slot, locale, ["label"]),
        value: localizedConstructorValue(stone, locale, ["label"])
      };
    })
    .filter(Boolean);

  useEffect(() => {
    if (!currentType) return;

    setConfiguration((current) => {
      let changed = false;
      const next = { ...current };
      const defaultVariant = typeVariants[0] || null;

      if (defaultVariant && !typeVariants.some((item) => String(item.id) === String(next.variant_id))) {
        next.variant_id = Number(defaultVariant.id);
        changed = true;
      }

      const materials = currentType.materials || [];
      if (materials.length && !materials.some((item) => item.code === next.material)) {
        next.material = materials[0].code;
        changed = true;
      }

      const sizes = currentType.size_options || [];
      if (sizes.length) {
        const defaultSize = sizes.find((item) => item.is_default) || sizes[0];
        if (!sizes.some((item) => item.code === next.size) && defaultSize) {
          next.size = defaultSize.code;
          changed = true;
        }
      } else if (next.size) {
        delete next.size;
        changed = true;
      }

      if (!engravingEnabled && next.engraving_text) {
        delete next.engraving_text;
        changed = true;
      }

      const allowedSlotCodes = new Set(currentSlots.map((slot) => slot.code));
      const allowedStoneCodes = new Set(stoneValues.map((stone) => stone.code));
      const sanitizedSlotSelections = Object.fromEntries(
        Object.entries(current.stone_slots || {}).filter(
          ([slotCode, stoneCode]) => allowedSlotCodes.has(slotCode) && allowedStoneCodes.has(stoneCode)
        )
      );
      if (JSON.stringify(sanitizedSlotSelections) !== JSON.stringify(current.stone_slots || {})) {
        next.stone_slots = sanitizedSlotSelections;
        changed = true;
      } else if (!next.stone_slots && currentSlots.length) {
        next.stone_slots = sanitizedSlotSelections;
        changed = true;
      }

      const primaryStoneCode = resolvePrimaryStoneCode(currentSlots, sanitizedSlotSelections);
      if (primaryStoneCode) {
        if (next.stone !== primaryStoneCode) {
          next.stone = primaryStoneCode;
          changed = true;
        }
      } else if (next.stone) {
        delete next.stone;
        changed = true;
      }

      return changed ? next : current;
    });
  }, [currentType, currentSlots, engravingEnabled, stoneValues, typeVariants]);

  function updateConfiguration(code, value) {
    setConfiguration((current) => ({
      ...current,
      [code]: value
    }));
  }

  function updateSlotSelection(slotCode, stoneCode) {
    setConfiguration((current) => {
      const next = { ...(current.stone_slots || {}) };
      if (!stoneCode || stoneCode === "none") {
        delete next[slotCode];
      } else {
        next[slotCode] = stoneCode;
      }

      const primaryStoneCode = resolvePrimaryStoneCode(currentSlots, next);
      const nextConfiguration = {
        ...current,
        stone_slots: next
      };
      if (primaryStoneCode) nextConfiguration.stone = primaryStoneCode;
      else delete nextConfiguration.stone;
      return nextConfiguration;
    });
  }

  function handleTypeChange(event) {
    setJewelryTypeId(event.target.value);
    setConfiguration({});
    setCalculation(null);
  }

  function handleVariantChange(variantId) {
    setConfiguration((current) => ({
      ...current,
      variant_id: Number(variantId)
    }));
    setCalculation(null);
  }

  async function handleAddDesign() {
    if (!isValid || !jewelryTypeId) return;
    setIsAdding(true);
    const payload = {
      item_type: "custom_design",
      jewelry_type_id: Number(jewelryTypeId),
      configuration
    };
    try {
      const cart = await cartApi.addItem(payload);
      syncCartCount(cart);
      window.location.href = "/cart";
    } catch (error) {
      if (error.status === 401 || error.message.toLowerCase().includes("auth")) {
        addGuestCartItem({
          item_type: "custom_design",
          jewelry_type_id: Number(jewelryTypeId),
          jewelry_type_code: currentType?.code,
          title: calculation?.jewelry_type || currentType?.name || t("personalDesign"),
          configuration,
          unit_price: Number(calculation?.price || 0),
          quantity: 1
        });
        window.location.href = "/cart";
        return;
      }
      setToast(error.message);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <>
      <Header />
      <main className="page-main">
        <div className="page-header">
          <div className="section-inner">
            <p className="eyebrow">{copy.constructorEyebrow}</p>
            <h1 className="page-title">{copy.constructorTitle}</h1>
          </div>
        </div>

        {loadError ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t("constructorUnavailable")}</h2>
              <p>{loadError}</p>
            </div>
          </section>
        ) : null}

        {!loadError && config ? (
          <div className="section-inner constructor-wrap">
            <div className="constructor-layout">
              <div className="constructor-options">
                <div className="constructor-section">
                  <p className="constructor-label">{t("jewelryType")}</p>
                  <div className="type-grid">
                    {types.map((item) => {
                      const isActive = String(item.id) === String(jewelryTypeId);
                      return (
                        <button key={item.id} className={`type-btn${isActive ? " active" : ""}`} type="button" onClick={() => handleTypeChange({ target: { value: String(item.id) } })}>
                          <TypeIcon type={item.code} active={isActive} />
                          <span>{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="constructor-section">
                  <div className="constructor-section-head">
                    <p className="constructor-label">{modelLabel}</p>
                    <span className="required-badge">{requiredLabel}</span>
                  </div>
                  {typeVariants.length ? (
                    <div className="constructor-variant-grid">
                      {typeVariants.map((variant) => {
                        const isActive = String(variant.id) === String(currentVariant?.id);
                        return (
                          <button
                            key={variant.id}
                            className={`constructor-variant-btn${isActive ? " active" : ""}`}
                            type="button"
                            onClick={() => handleVariantChange(variant.id)}
                          >
                            <span className="constructor-variant-art">
                              {variant.base_asset_url ? <img src={variant.base_asset_url} alt="" aria-hidden="true" /> : null}
                            </span>
                            <span className="constructor-variant-copy">
                              <strong>{localizedConstructorValue(variant, locale, ["name"])}</strong>
                              <small>{variant.code}</small>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="constructor-empty-copy">{noVariantsText}</p>
                  )}
                </div>

                {currentType?.materials?.length ? (
                  <div className="constructor-section">
                    <div className="constructor-section-head">
                      <p className="constructor-label">{materialLabel}</p>
                      <span className="required-badge">{requiredLabel}</span>
                    </div>
                    <div className="material-list">
                      {currentType.materials.map((item) => (
                        <button
                          key={item.code}
                          className={`material-btn${configuration.material === item.code ? " active" : ""}`}
                          type="button"
                          onClick={() => updateConfiguration("material", item.code)}
                        >
                          <span className="material-swatch" style={{ background: CONSTRUCTOR_MATERIAL_TONES[item.code] || "#d7d1c8" }} />
                          <span className="material-name">{item.label}</span>
                          {item.price_delta ? <span className="material-price-delta">{item.price_delta > 0 ? `+${item.price_delta}` : item.price_delta}</span> : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {currentSlots.length ? (
                  <div className="constructor-section">
                    <div className="constructor-section-head">
                      <p className="constructor-label">{stoneLabel}</p>
                      <span className="required-badge">{requiredLabel}</span>
                    </div>
                    <ConstructorSlots
                      locale={locale}
                      typeCode={currentType?.code || "ring"}
                      slots={currentSlots}
                      selections={slotSelections}
                      values={stoneValues}
                      onSelectSlot={updateSlotSelection}
                      mediaMap={stoneMediaMap}
                    />
                  </div>
                ) : null}

                {currentType?.size_options?.length ? (
                  <div className="constructor-section">
                    <div className="constructor-section-head">
                      <p className="constructor-label">{sizeLabel}</p>
                      <span className="required-badge">{requiredLabel}</span>
                    </div>
                    <div className="size-grid">
                      {currentType.size_options.map((item) => (
                        <button
                          key={item.code}
                          className={`size-btn${configuration.size === item.code ? " active" : ""}`}
                          type="button"
                          onClick={() => updateConfiguration("size", item.code)}
                        >
                          <span className="size-val">{item.label}</span>
                          {item.price_delta ? (
                            <span className={`size-price-delta${item.price_delta > 0 ? " pos" : " neg"}`}>
                              {item.price_delta > 0 ? `+${item.price_delta}` : item.price_delta}
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {engravingEnabled ? (
                  <div className="constructor-section">
                    <div className="constructor-section-head">
                      <p className="constructor-label">{engravingLabel}</p>
                    </div>
                    <div className="field">
                      <input
                        type="text"
                        className="field-input"
                        value={configuration.engraving_text || ""}
                        maxLength={Number(currentType?.engraving?.max_length || 24)}
                        placeholder={t("engravingPlaceholder")}
                        onChange={(event) => updateConfiguration("engraving_text", event.target.value)}
                      />
                      <span className="field-counter">
                        {String(configuration.engraving_text || "").length}/{Number(currentType?.engraving?.max_length || 24)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              <aside className="constructor-preview-wrap">
                <div className="constructor-preview-sticky">
                  <div className="preview-stage">
                    <p className="constructor-label" style={{ marginBottom: "1.5rem", textAlign: "center" }}>{copy.constructorPreview}</p>
                    <div className="preview-canvas">
                      <ConstructorVisualPreview
                        variant={currentVariant}
                        slots={currentSlots}
                        stonesByCode={stonesByCode}
                        selections={slotSelections}
                        engraving={configuration.engraving_text || ""}
                        materialCode={configuration.material || ""}
                      />
                    </div>
                    {selectedSummary.length ? (
                      <div className="preview-stones-list">
                        {selectedSummary.map(([label, value]) => (
                          <span className="preview-stone-tag" key={`${label}-${value}`}>
                            <span className="preview-stone-dot" />
                            {label}: {value}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {selectedSlotSummary.length ? (
                      <div className="preview-stones-list">
                        {selectedSlotSummary.map((item) => (
                          <span className="preview-stone-tag" key={`${item.id}-${item.value}`}>
                            <span className="preview-stone-dot" />
                            {item.label}: {item.value}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="summary-card">
                    <div className="summary-row">
                      <span className="summary-label">{t("currentPrice")}</span>
                      <span className="summary-price">
                        {formatCurrency(
                          calculation?.price ?? currentType?.base_price ?? 0,
                          calculation?.currency || "UAH",
                          LOCALE_FORMATS[locale]
                        )}
                      </span>
                    </div>
                    <div className="summary-breakdown">
                      <span>{isCalculating ? t("calculating") : t("validated")}</span>
                      <span>{currentType?.name || t("piece")}</span>
                    </div>
                    {selectedSummary.map(([label, value]) => (
                      <div className="summary-breakdown" key={`${label}-${value}`}>
                        <span>{label}</span>
                        <span>{value}</span>
                      </div>
                    ))}
                    {!isValid ? (
                      <div className="summary-breakdown" style={{ color: "var(--danger)" }}>
                        <span>{t("fillRequired")}</span>
                        <span>{missingRequired.join(", ")}</span>
                      </div>
                    ) : null}
                    <div className="summary-divider" />
                    <button className="button constructor-add-btn" type="button" disabled={!isValid || isAdding} onClick={handleAddDesign}>
                      {isAdding ? t("adding") : t("addCustomDesign")}
                    </button>
                    <div className="constructor-trust">
                      <span>{copy.constructorTrustLeft}</span>
                      <span>{copy.constructorTrustRight}</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
      {toast ? <div className="react-toast">{toast}</div> : null}
    </>
  );
}

function CartPage() {
  const [cart, setCart] = useState(null);
  const [constructorConfig, setConstructorConfig] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [busyItemId, setBusyItemId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { localeFormat: locale, t } = useI18n();

  useEffect(() => {
    let active = true;

    async function loadCartState() {
      try {
        const session = await authApi.getSession();
        if (session?.authenticated) {
          const data = await cartApi.getCart();
          if (active) {
            setIsAuthenticated(true);
            setCart(data);
            syncCartCount(data);
          }
          return;
        }
      } catch {}

      if (active) {
        const guestCart = readGuestCart();
        setIsAuthenticated(false);
        setCart(guestCart);
        syncCartCount(guestCart);
      }
    }

    loadCartState().catch((error) => {
      if (active) setLoadError(error.message);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    constructorApi
      .getConfig()
      .then((data) => {
        if (active) setConstructorConfig(data);
      })
      .catch(() => {
        if (active) setConstructorConfig(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function updateQuantity(item, quantity) {
    const nextQuantity = Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Number(quantity) || 1));
    setBusyItemId(item.id);
    try {
      const updated = isAuthenticated
        ? await cartApi.updateItem(item.id, { quantity: nextQuantity })
        : updateGuestCartItem(item.id, nextQuantity);
      setCart(updated);
      syncCartCount(updated);
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusyItemId(null);
    }
  }

  async function removeItem(item) {
    setBusyItemId(item.id);
    try {
      const updated = isAuthenticated
        ? await cartApi.deleteItem(item.id)
        : removeGuestCartItem(item.id);
      setCart(updated);
      syncCartCount(updated);
      setToast(t("itemRemoved"));
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusyItemId(null);
    }
  }

  const items = cart?.items || [];
  const typeById = Object.fromEntries((constructorConfig?.types || []).map((entry) => [String(entry.id), entry]));

  function handleProceedCheckout(event) {
    if (!isAuthenticated) {
      event.preventDefault();
      setPostAuthRedirect("/checkout");
      window.location.href = "/auth";
    }
  }

  return (
    <>
      <Header />
      <main>
        <section className="cart-react-hero">
          <div className="container cart-react-heading">
            <span className="badge">{t("almostThere")}</span>
            <h1>{t("yourCart")}</h1>
            <p>{t("cartIntro")}</p>
          </div>
        </section>

        {loadError ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t("cartDidNotLoad")}</h2>
              <p>{loadError}</p>
            </div>
          </section>
        ) : null}

        {!loadError && !cart ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t("loadingCart")}</h2>
              <p>{t("preparingCart")}</p>
            </div>
          </section>
        ) : null}

        {cart && !items.length ? (
          <section className="section">
            <div className="container empty-state-react cart-empty-state">
              <span className="badge">{t("orderEdit")}</span>
              <h2>{t("emptyCartTitle")}</h2>
              <p>{t("emptyCartText")}</p>
              <div className="hero-actions">
                <a className="button" href="/catalog">
                  {t("exploreCollection")}
                </a>
                <a className="button button-outline" href="/constructor">
                  {t("addCustomDesign")}
                </a>
              </div>
            </div>
          </section>
        ) : null}

        {cart && items.length ? (
          <section className="cart-workspace-section">
            <div className="container cart-workspace">
              <div className="cart-items-panel">
                <div className="section-heading">
                  <span className="badge">{t("orderEdit")}</span>
                  <h2>{t("selectedPieces")}</h2>
                </div>
                <div className="cart-item-list">
                  {items.map((item) => (
                    <article className={`cart-react-item${item.item_type === "custom_design" ? " is-custom" : ""}`} key={item.id}>
                      <div className="cart-item-main">
                        <div className="cart-item-preview-wrap">
                          <CartItemPreview item={item} constructorConfig={constructorConfig} />
                        </div>
                        <div className="cart-item-copy">
                          <div className="cart-item-head">
                            <div>
                              <span className="badge subtle">{item.item_type === "custom_design" ? t("configuredDesign") : t("finishedPiece")}</span>
                              <h3>{item.title}</h3>
                              <p>{item.item_type === "custom_design" ? t("personalDesign") : t("finishedPiece")}</p>
                            </div>
                          </div>

                          {item.item_type === "custom_design" ? (
                            <div className="cart-item-meta-grid">
                              {typeById[String(item.jewelry_type_id)]?.size_options?.length ? (
                                <div className="cart-item-meta">
                                  <span>{locale === "uk-UA" ? "Розмір" : "Size"}</span>
                                  <strong>{findTypeOptionLabel(typeById[String(item.jewelry_type_id)]?.size_options, item.configuration?.size) || "-"}</strong>
                                </div>
                              ) : null}
                              {getPendantChainDisplay(item, locale, typeById) ? (
                                <div className="cart-item-meta">
                                  <span>{locale === "uk-UA" ? "Комплектація" : "Configuration"}</span>
                                  <strong>{getPendantChainDisplay(item, locale, typeById, { includeLabel: false }).text}</strong>
                                </div>
                              ) : null}
                              {getPendantChainDisplay(item, locale, typeById)?.surcharge ? (
                                <div className="cart-item-meta">
                                  <span>{locale === "uk-UA" ? "Доплата за ланцюжок" : "Chain surcharge"}</span>
                                  <strong>{formatCurrency(Number(getPendantChainDisplay(item, locale, typeById).chain?.price || 0), cart.currency, locale)}</strong>
                                </div>
                              ) : null}
                              {item.configuration?.engraving_text ? (
                                <div className="cart-item-meta">
                                  <span>{locale === "uk-UA" ? "Гравіювання" : "Engraving"}</span>
                                  <strong>{item.configuration.engraving_text}</strong>
                                </div>
                              ) : null}
                            </div>
                          ) : item.configuration?.size || getPendantChainDisplay(item, locale, typeById) ? (
                            <div className="cart-item-meta-grid">
                              {item.configuration?.size ? (
                                <div className="cart-item-meta">
                                  <span>{getReadyProductSizeTitle(item.product_type, locale)}</span>
                                  <strong>{getReadyProductSizeLabel(item.product_type, item.configuration.size, locale)}</strong>
                                </div>
                              ) : null}
                              {getPendantChainDisplay(item, locale, typeById) ? (
                                <div className="cart-item-meta">
                                  <span>{locale === "uk-UA" ? "Комплектація" : "Configuration"}</span>
                                  <strong>{getPendantChainDisplay(item, locale, typeById, { includeLabel: false }).text}</strong>
                                </div>
                              ) : null}
                              {getPendantChainDisplay(item, locale, typeById)?.surcharge ? (
                                <div className="cart-item-meta">
                                  <span>{locale === "uk-UA" ? "Доплата за ланцюжок" : "Chain surcharge"}</span>
                                  <strong>{formatCurrency(Number(getPendantChainDisplay(item, locale, typeById).chain?.price || 0), cart.currency, locale)}</strong>
                                </div>
                              ) : null}
                            </div>
                          ) : null}

                          {item.item_type === "ready_product" && item.product_slug ? (
                            <a className="text-cta" href={`/products/${item.product_slug}`}>
                              {t("viewPiece")}
                              <ChevronRight aria-hidden="true" />
                            </a>
                          ) : null}
                        </div>
                      </div>

	                      <div className="cart-item-controls">
	                          <div className="cart-item-controls-top">
                            <div className="cart-item-control-cluster">
	                            <label className="cart-quantity">
	                              <span>{t("qty")}</span>
	                              <input
	                                type="number"
	                                min="1"
                                  max={MAX_CART_ITEM_QUANTITY}
	                                value={item.quantity}
	                                disabled={busyItemId === item.id}
	                                onChange={(event) => updateQuantity(item, event.target.value)}
	                              />
	                            </label>
                            </div>
	                          <button
	                            type="button"
	                            className="cart-remove-button"
                            disabled={busyItemId === item.id}
                            onClick={() => removeItem(item)}
                            aria-label={`${t("remove")} ${item.title}`}
                          >
                            <Trash2 aria-hidden="true" />
                          </button>
                        </div>
                        <strong className="cart-item-price">{formatCurrency(item.line_total, cart.currency, locale)}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="cart-summary-panel">
                <span className="badge">{t("reservationSummary")}</span>
                <h2>{t("readyCheckout")}</h2>
                <div className="cart-summary-total">
                  <span>{t("subtotal")}</span>
                  <strong>{formatCurrency(cart.subtotal_amount, cart.currency, locale)}</strong>
                </div>
                <a className="button cart-checkout-button" href="/checkout" onClick={handleProceedCheckout}>
                  {t("proceedCheckout")}
                  <ChevronRight aria-hidden="true" />
                </a>
                {!isAuthenticated ? (
                  <p className="cart-guest-note">{locale === "uk-UA" ? "Щоб оформити замовлення, увійдіть або зареєструйтесь. Кошик не зникне і закріпиться за вашим акаунтом." : "To place the order, sign in or create an account. Your cart will stay intact and attach to your account."}</p>
                ) : null}
                <a className="button button-outline" href="/constructor">
                  {t("addCustomDesign")}
                </a>
              </aside>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
      {toast ? <div className="react-toast">{toast}</div> : null}
    </>
  );
}

function formatOrderDate(value, locale = "uk-UA") {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function orderStatusLabel(status, t) {
  const labels = {
    created_pending_payment: t("awaitingPayment"),
    confirmed: t("confirmed"),
    in_progress: t("inProgress"),
    completed: t("completed")
  };
  return labels[status] || status;
}

function statusClassName(status, overdue = false) {
  if (overdue) return "status-pill overdue";
  if (status === "confirmed") return "status-pill confirmed";
  if (status === "in_progress") return "status-pill progress";
  if (status === "completed") return "status-pill completed";
  return "status-pill pending";
}

const ADMIN_LOCALE = LOCALE_FORMATS.uk;
const ADMIN_ORDER_STATUS_COPY = {
  awaitingPayment: "Очікує оплату",
  confirmed: "Підтверджено",
  inProgress: "У роботі",
  completed: "Завершено"
};

const ADMIN_UI = {
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

const ADMIN_TYPE_CODE_LABELS = {
  ring: "Каблучка",
  bracelet: "Браслет",
  pendant: "Підвіска",
  earrings: "Сережки"
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

const ADMIN_ASSET_KIND_LABELS = {
  "jewelry-base": "База прикраси",
  stone: "Камінь",
  product: "Товар",
  other: "Інше"
};

function adminOrderStatusLabel(status) {
  return orderStatusLabel(status, (key) => ADMIN_ORDER_STATUS_COPY[key] || key);
}

function adminPaymentStateLabel(state) {
  if (state === "paid") return "Оплачено";
  if (state === "unpaid") return "Не оплачено";
  return state || "—";
}

function adminTypeCodeLabel(code) {
  return ADMIN_TYPE_CODE_LABELS[code] || code || "";
}

function adminProductFilterLabel(key) {
  return ADMIN_PRODUCT_FILTER_LABELS[key] || key;
}

function adminProductFilterValueLabel(key, value) {
  return ADMIN_PRODUCT_FILTER_VALUE_LABELS[key]?.[value] || value;
}

function adminAssetKindLabel(kind) {
  return ADMIN_ASSET_KIND_LABELS[kind] || kind;
}

function adminLocalizedEntry(primary, fallback, finalValue = "") {
  return primary || fallback || finalValue;
}

function OrdersPage() {
  const [orders, setOrders] = useState(null);
  const [loadError, setLoadError] = useState("");
  const { localeFormat: locale, t } = useI18n();

  useEffect(() => {
    let active = true;
    ordersApi
      .getMyOrders()
      .then((data) => {
        if (active) setOrders(data || []);
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401 || error.message.toLowerCase().includes("auth")) {
          window.location.href = "/auth";
          return;
        }
        setLoadError(error.message);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Header />
      <main>
        <section className="orders-react-hero">
          <div className="container orders-react-heading">
            <span className="badge">{t("purchaseHistory")}</span>
            <h1>{t("myOrders")}</h1>
            <p>{t("ordersIntro")}</p>
          </div>
        </section>

        {loadError ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t("ordersDidNotLoad")}</h2>
              <p>{loadError}</p>
            </div>
          </section>
        ) : null}

        {!loadError && !orders ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t("loadingOrders")}</h2>
              <p>{t("preparingHistory")}</p>
            </div>
          </section>
        ) : null}

        {orders && !orders.length ? (
          <section className="section">
            <div className="container empty-state-react cart-empty-state">
              <span className="badge">{t("atelierHistory")}</span>
              <h2>{t("noOrdersTitle")}</h2>
              <p>{t("noOrdersText")}</p>
              <a className="button" href="/catalog">
                {t("chooseFirstPiece")}
              </a>
            </div>
          </section>
        ) : null}

        {orders && orders.length ? (
          <section className="orders-list-section">
            <div className="container orders-list-grid">
              {orders.map((order) => (
                <a className="order-card-react" href={`/orders/${order.id}`} key={order.id}>
                  <div className="order-card-top">
                    <div>
                      <strong>{order.order_number}</strong>
                      <p>{formatOrderDate(order.created_at, locale)}</p>
                    </div>
                    <span className={statusClassName(order.status, order.overdue)}>{orderStatusLabel(order.status, t)}</span>
                  </div>
                  <div className="order-card-total">
                    <span>{t("orderTotal")}</span>
                    <strong>{formatCurrency(order.total_amount, order.currency, locale)}</strong>
                  </div>
                  <p className={order.overdue ? "cart-warning" : ""}>
                    {order.overdue ? t("orderAttention") : t("orderOnSchedule")}
                  </p>
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}

function AccountPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loadError, setLoadError] = useState("");
  const { localeFormat: locale, t } = useI18n();

  useEffect(() => {
    let active = true;
    accountApi
      .getDashboard()
      .then((data) => {
        if (active) setDashboard(data);
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401 || error.message.toLowerCase().includes("auth")) {
          window.location.href = "/auth";
          return;
        }
        setLoadError(error.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const user = dashboard?.user || null;
  const currentOrder = dashboard?.current_order || null;
  const completedOrders = dashboard?.completed_orders || [];

  return (
    <>
      <Header />
      <main>
        <section className="orders-react-hero">
          <div className="container orders-react-heading">
            <span className="badge">{t("account")}</span>
            <h1>{t("account")}</h1>
            <p>{t("faq3A")}</p>
          </div>
        </section>

        {loadError ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t("ordersDidNotLoad")}</h2>
              <p>{loadError}</p>
            </div>
          </section>
        ) : null}

        {!loadError && !dashboard ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t("loadingOrder")}</h2>
              <p>{t("preparingDossier")}</p>
            </div>
          </section>
        ) : null}

        {dashboard ? (
          <section className="account-dashboard-section">
            <div className="container account-dashboard-grid">
              <section className="account-profile-card">
                <span className="badge">{locale === "uk-UA" ? "Профіль" : "Profile"}</span>
                <h2>{user?.full_name || "Aurora Client"}</h2>
                <div className="account-profile-meta">
                  <div>
                    <span>{t("email")}</span>
                    <strong>{user?.email || "—"}</strong>
                  </div>
                  <div>
                    <span>{t("phone")}</span>
                    <strong>{user?.phone || "—"}</strong>
                  </div>
                </div>
                <div className="account-profile-chip-row">
                  <span className="status-pill completed">{user?.email_verified ? (locale === "uk-UA" ? "Пошта підтверджена" : "Email verified") : (locale === "uk-UA" ? "Пошта не підтверджена" : "Email not verified")}</span>
                  <span className="status-pill pending">{user?.auth_provider === "google" ? "Google" : "Local"}</span>
                </div>
              </section>

              <section className="account-current-order-card">
                <div className="account-panel-head">
                  <div>
                    <span className="badge">{locale === "uk-UA" ? "Поточне замовлення" : "Current order"}</span>
                    <h2>{locale === "uk-UA" ? "Нинішній виріб" : "Active order"}</h2>
                  </div>
                  {currentOrder ? <span className={statusClassName(currentOrder.status, currentOrder.overdue)}>{orderStatusLabel(currentOrder.status, t)}</span> : null}
                </div>

                {!currentOrder ? (
                  <div className="account-empty-block">
                    <p>{locale === "uk-UA" ? "Зараз немає активних замовлень. Завершені вироби нижче в історії." : "You do not have an active order right now. Completed pieces are listed below."}</p>
                    <a className="button" href="/catalog">{t("chooseFirstPiece")}</a>
                  </div>
                ) : (
                  <div className="account-order-summary">
                    <div className="account-order-meta-row">
                      <div>
                        <span>{locale === "uk-UA" ? "Номер" : "Order"}</span>
                        <strong>{currentOrder.order_number}</strong>
                      </div>
                      <div>
                        <span>{locale === "uk-UA" ? "Створено" : "Created"}</span>
                        <strong>{formatOrderDate(currentOrder.created_at, locale)}</strong>
                      </div>
                      <div>
                        <span>{locale === "uk-UA" ? "Оновлено" : "Updated"}</span>
                        <strong>{formatOrderDate(currentOrder.updated_at, locale)}</strong>
                      </div>
                      <div>
                        <span>{t("orderTotal")}</span>
                        <strong>{formatCurrency(currentOrder.total_amount, currentOrder.currency, locale)}</strong>
                      </div>
                    </div>
                    <div className="account-order-items">
                        {currentOrder.items.map((item) => (
                          <div className="account-order-item" key={item.id}>
                            <div>
                              <strong>{item.title}</strong>
                              <span>
                                {locale === "uk-UA" ? `Кількість: ${item.quantity}` : `Qty: ${item.quantity}`}
                                {item.configuration?.size ? ` · ${getReadyProductSizeLabel(item.product_type, item.configuration.size, locale)}` : ""}
                                {getPendantChainDisplay(item, locale) ? ` · ${getPendantChainDisplay(item, locale, {}, { includeLabel: false }).text}` : ""}
                              </span>
                            </div>
                            <strong>{formatCurrency(item.line_total, currentOrder.currency, locale)}</strong>
                          </div>
                        ))}
                    </div>
                    <a className="button button-ghost" href={`/orders/${currentOrder.id}`}>
                      {locale === "uk-UA" ? "Відкрити досьє замовлення" : "Open order dossier"}
                    </a>
                  </div>
                )}
              </section>
            </div>

            <div className="container account-history-stack">
              <div className="section-heading">
                <span className="badge">{t("purchaseHistory")}</span>
                <h2>{locale === "uk-UA" ? "Завершені замовлення" : "Completed orders"}</h2>
                <p>{locale === "uk-UA" ? "Тут зберігається історія всіх завершених виробів із датами, сумами та складом замовлення." : "Here is the record of completed orders with dates, totals, and purchased pieces."}</p>
              </div>

              {!completedOrders.length ? (
                <div className="empty-state-react">
                  <h2>{locale === "uk-UA" ? "Поки немає завершених замовлень" : "No completed orders yet"}</h2>
                  <p>{locale === "uk-UA" ? "Коли виріб буде завершений, він з’явиться тут." : "When a piece is completed, it will appear here."}</p>
                </div>
              ) : (
                <div className="account-history-grid">
                  {completedOrders.map((order) => (
                    <article className="account-history-card" key={order.id}>
                      <div className="account-panel-head">
                        <div>
                          <strong>{order.order_number}</strong>
                          <p>{formatOrderDate(order.completed_at || order.updated_at || order.created_at, locale)}</p>
                        </div>
                        <span className="status-pill completed">{locale === "uk-UA" ? "Завершено" : "Completed"}</span>
                      </div>
                      <div className="account-history-total">
                        <span>{t("orderTotal")}</span>
                        <strong>{formatCurrency(order.total_amount, order.currency, locale)}</strong>
                      </div>
                      <div className="account-order-items">
                        {order.items.map((item) => (
                          <div className="account-order-item" key={item.id}>
                            <div>
                              <strong>{item.title}</strong>
                              <span>
                                {locale === "uk-UA" ? `Кількість: ${item.quantity}` : `Qty: ${item.quantity}`}
                                {item.configuration?.size ? ` · ${getReadyProductSizeLabel(item.product_type, item.configuration.size, locale)}` : ""}
                                {getPendantChainDisplay(item, locale) ? ` · ${getPendantChainDisplay(item, locale, {}, { includeLabel: false }).text}` : ""}
                              </span>
                            </div>
                            <strong>{formatCurrency(item.line_total, order.currency, locale)}</strong>
                          </div>
                        ))}
                      </div>
                      <a className="small-button" href={`/orders/${order.id}`}>
                        {locale === "uk-UA" ? "Дивитися досьє" : "View dossier"}
                      </a>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}

function OrderDetailPage() {
  const orderId = window.location.pathname.split("/").filter(Boolean).at(-1);
  const [order, setOrder] = useState(null);
  const [constructorConfig, setConstructorConfig] = useState(null);
  const [loadError, setLoadError] = useState("");
  const { localeFormat: locale, t } = useI18n();

  useEffect(() => {
    let active = true;
    ordersApi
      .getOrder(orderId)
      .then((data) => {
        if (active) setOrder(data);
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401 || error.message.toLowerCase().includes("auth")) {
          window.location.href = "/auth";
          return;
        }
        setLoadError(error.message);
      });
    return () => {
      active = false;
    };
  }, [orderId]);

  useEffect(() => {
    let active = true;
    constructorApi
      .getConfig()
      .then((data) => {
        if (active) setConstructorConfig(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const typeById = useMemo(
    () => Object.fromEntries((constructorConfig?.types || []).map((entry) => [String(entry.id), entry])),
    [constructorConfig]
  );
  const variantsById = useMemo(
    () => Object.fromEntries((constructorConfig?.variants || []).map((entry) => [String(entry.id), entry])),
    [constructorConfig]
  );
  const stonesByCode = useMemo(() => buildStoneCodeMap(constructorConfig?.stones || []), [constructorConfig]);
  const activePayment = order?.payments?.find((payment) => payment.status === "succeeded") || order?.payments?.[0] || null;

  return (
    <>
      <Header />
      <main>
        {loadError ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t("orderDidNotLoad")}</h2>
              <p>{loadError}</p>
            </div>
          </section>
        ) : null}

        {!loadError && !order ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t("loadingOrder")}</h2>
              <p>{t("preparingDossier")}</p>
            </div>
          </section>
        ) : null}

        {order ? (
          <>
            <section className="order-detail-hero">
              <div className="container order-detail-head">
                <div className="order-detail-head-copy">
                  <span className="badge">{t("orderDossier")}</span>
                  <h1>{order.order_number}</h1>
                  <p>
                    {locale === "uk-UA" ? "Статус, склад замовлення та персональні деталі зібрані в одному спокійному досьє." : "Status, order composition, and personal details gathered in one calm dossier."}
                  </p>
                </div>
                <div className="order-detail-status-stack">
                  <span className={statusClassName(order.status, order.overdue)}>{orderStatusLabel(order.status, t)}</span>
                  <div className="order-detail-status-note">
                    <span>{locale === "uk-UA" ? "Оновлено" : "Updated"}</span>
                    <strong>{formatOrderDate(order.history?.at(-1)?.created_at || order.created_at, locale)}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="order-detail-section">
              <div className="container order-detail-grid">
                <div className="order-detail-main-column">
                  <section className="order-detail-card order-detail-items-card">
                    <div className="section-heading">
                      <span className="badge">{t("orderItems")}</span>
                      <h2>{locale === "uk-UA" ? "Ваші вироби" : "Your pieces"}</h2>
                      <p>{locale === "uk-UA" ? "Кожен виріб показаний разом із деталями замовлення та персональним налаштуванням." : "Each piece is shown with order details and personal configuration."}</p>
                    </div>
                    <div className="order-detail-items-stack">
                      {order.items.map((item) => (
                        <OrderDetailItemCard
                          key={item.id}
                          item={item}
                          order={order}
                          locale={locale}
                          t={t}
                          constructorConfig={constructorConfig}
                          typeById={typeById}
                          variantsById={variantsById}
                          stonesByCode={stonesByCode}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="order-detail-card">
                    <div className="section-heading">
                      <span className="badge">{t("atelierTimeline")}</span>
                      <h2>{locale === "uk-UA" ? "Таймлайн замовлення" : "Order timeline"}</h2>
                    </div>
                    <div className="timeline-react">
                      {order.history.map((entry) => (
                        <article className="timeline-react-item" key={entry.id}>
                          <strong>{orderStatusLabel(entry.new_status, t)}</strong>
                          <span>{formatOrderDate(entry.created_at, locale)}</span>
                          {entry.comment ? <p>{entry.comment}</p> : null}
                        </article>
                      ))}
                    </div>
                  </section>
                </div>

                <aside className="order-detail-side-column">
                  <section className="order-detail-card order-detail-summary-card">
                    <span className="badge subtle">{locale === "uk-UA" ? "Резюме замовлення" : "Order summary"}</span>
                    <h2>{locale === "uk-UA" ? "Готово до виготовлення" : "Ready for production"}</h2>
                    <div className="order-detail-total-box">
                      <span>{locale === "uk-UA" ? "Підсумкова сума" : "Final total"}</span>
                      <strong>{formatCurrency(order.total_amount, order.currency, locale)}</strong>
                    </div>
                    <div className="order-detail-meta-grid">
                      <div>
                        <span>{locale === "uk-UA" ? "Позицій" : "Items"}</span>
                        <strong>{order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</strong>
                      </div>
                      <div>
                        <span>{locale === "uk-UA" ? "Створено" : "Created"}</span>
                        <strong>{formatOrderDate(order.created_at, locale)}</strong>
                      </div>
                      <div>
                        <span>{locale === "uk-UA" ? "Оплата" : "Payment"}</span>
                        <strong>{activePayment ? orderStatusLabel(order.status, t) : locale === "uk-UA" ? "Очікується" : "Pending"}</strong>
                      </div>
                      <div>
                        <span>{locale === "uk-UA" ? "Доставка" : "Delivery"}</span>
                        <strong>{order.delivery_method}</strong>
                      </div>
                    </div>
                  </section>

                  <section className="order-detail-card">
                    <span className="badge subtle">{locale === "uk-UA" ? "Контактні дані" : "Contact details"}</span>
                    <div className="order-detail-customer-grid">
                      <div>
                        <span>{locale === "uk-UA" ? "Одержувач" : "Recipient"}</span>
                        <strong>{order.customer_name}</strong>
                      </div>
                      <div>
                        <span>Email</span>
                        <strong>{order.email}</strong>
                      </div>
                      <div>
                        <span>{locale === "uk-UA" ? "Телефон" : "Phone"}</span>
                        <strong>{order.phone}</strong>
                      </div>
                      <div className="is-wide">
                        <span>{locale === "uk-UA" ? "Адреса доставки" : "Delivery address"}</span>
                        <strong>{order.delivery_address}</strong>
                      </div>
                    </div>
                  </section>
                </aside>
              </div>
            </section>
          </>
        ) : null}
      </main>
      <Footer />
    </>
  );
}

function CheckoutPage() {
  const [cart, setCart] = useState(null);
  const [sessionUser, setSessionUser] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    email: "",
    phone: "",
    delivery_method: "nova_poshta",
    delivery_address: "",
    accepted_offer: false,
    accepted_return_policy: false
  });
  const { localeFormat: locale, t } = useI18n();

  useEffect(() => {
    let active = true;

    async function loadCheckoutContext() {
      try {
        const session = await authApi.getSession();
        if (!session?.authenticated || !session.user) {
          setPostAuthRedirect("/checkout");
          window.location.href = "/auth";
          return;
        }

        const data = await cartApi.getCart();
        if (!active) return;
        setSessionUser(session.user);
        setForm((current) => ({
          ...current,
          customer_name: current.customer_name || session.user.full_name || "",
          email: session.user.email || current.email,
          phone: current.phone || session.user.phone || ""
        }));
        setCart(data);
      } catch (error) {
        if (!active) return;
        if (error.status === 401 || error.message.toLowerCase().includes("auth")) {
          setPostAuthRedirect("/checkout");
          window.location.href = "/auth";
          return;
        }
        setLoadError(error.message);
      }
    }

    loadCheckoutContext();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function updateForm(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function handleCheckout(event) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await ordersApi.checkout(form);
      setCreatedOrder(result);
      setToast(t("orderReservedToast"));
    } catch (error) {
      setToast(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const items = cart?.items || [];

  return (
    <>
      <Header />
      <main>
        <section className="checkout-react-hero">
          <div className="container checkout-react-heading">
            <span className="badge">{t("secureCheckout")}</span>
            <h1>{t("confirmOrder")}</h1>
            <p>{t("checkoutIntro")}</p>
          </div>
        </section>

        {loadError ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t("checkoutDidNotLoad")}</h2>
              <p>{loadError}</p>
            </div>
          </section>
        ) : null}

        {!loadError && !cart ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t("loadingCheckout")}</h2>
              <p>{t("preparingReservation")}</p>
            </div>
          </section>
        ) : null}

        {cart && !items.length ? (
          <section className="section">
            <div className="container empty-state-react cart-empty-state">
              <span className="badge">{t("checkout")}</span>
              <h2>{t("nothingToReserve")}</h2>
              <p>{t("addBeforeCheckout")}</p>
              <a className="button" href="/catalog">
                {t("returnToCollection")}
              </a>
            </div>
          </section>
        ) : null}

        {cart && items.length ? (
          <section className="checkout-workspace-section">
            <div className="container checkout-workspace">
              <section className="checkout-form-panel">
                <div className="section-heading">
                  <span className="badge">{t("secureReservation")}</span>
                  <h2>{t("confirmDetails")}</h2>
                  <p>{t("confirmDetailsText")}</p>
                </div>

                <form className="checkout-react-form" onSubmit={handleCheckout}>
                  <label>
                    <span>{t("name")}</span>
                    <input name="customer_name" required value={form.customer_name} onChange={updateForm} />
                  </label>
                  {sessionUser ? (
                    <div className="checkout-account-identity">
                      <span>{t("email")}</span>
                      <strong>{sessionUser.email}</strong>
                    </div>
                  ) : null}
                  <label>
                    <span>{t("phone")}</span>
                    <input name="phone" required value={form.phone} onChange={updateForm} />
                  </label>
                  <label>
                    <span>{t("deliveryMethod")}</span>
                    <select name="delivery_method" required value={form.delivery_method} onChange={updateForm}>
                      <option value="nova_poshta">{t("novaPoshta")}</option>
                      <option value="courier">{t("courier")}</option>
                    </select>
                  </label>
                  <label className="checkout-full">
                    <span>{t("deliveryAddress")}</span>
                    <textarea
                      name="delivery_address"
                      required
                      placeholder={t("addressPlaceholder")}
                      value={form.delivery_address}
                      onChange={updateForm}
                    />
                  </label>
                  <label className="checkout-checkbox checkout-full">
                    <input
                      type="checkbox"
                      name="accepted_offer"
                      checked={form.accepted_offer}
                      onChange={updateForm}
                    />
                    <span>{t("acceptOffer")}</span>
                  </label>
                  <label className="checkout-checkbox checkout-full">
                    <input
                      type="checkbox"
                      name="accepted_return_policy"
                      checked={form.accepted_return_policy}
                      onChange={updateForm}
                    />
                    <span>{t("acceptReturn")}</span>
                  </label>
                  <button className="button checkout-submit" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t("creatingOrder") : t("createOrder")}
                    <ChevronRight aria-hidden="true" />
                  </button>
                </form>
              </section>

              <aside className="checkout-summary-panel">
                <span className="badge">{t("orderSummary")}</span>
                <h2>{t("reservedAfterPrepayment")}</h2>
                <div className="checkout-total">
                  <span>{t("total")}</span>
                  <strong>{formatCurrency(cart.subtotal_amount, cart.currency, locale)}</strong>
                </div>

                <div className="checkout-items">
                  {items.map((item) => (
                    <div key={item.id}>
                      <span>
                        {item.title}
                        {item.configuration?.size ? ` · ${getReadyProductSizeLabel(item.product_type, item.configuration.size, locale)}` : ""}
                      </span>
                      <strong>{formatCurrency(item.line_total, cart.currency, locale)}</strong>
                    </div>
                  ))}
                </div>

                <p>
                  {t("paymentCopy")}
                </p>

                <div className="checkout-steps">
                  <div>
                    <strong>1</strong>
                    <span>{t("stepOrderCreated")}</span>
                  </div>
                  <div>
                    <strong>2</strong>
                    <span>{t("stepPaymentConfirmed")}</span>
                  </div>
                  <div>
                    <strong>3</strong>
                    <span>{t("stepAtelierStarts")}</span>
                  </div>
                </div>

                {createdOrder ? (
                  <div className="payment-card">
                    <span className="badge">{createdOrder.order_number}</span>
                    <p>{t("orderReservedCopy")}</p>
                    <a className="button checkout-submit" href={`/orders/${createdOrder.order_id}`}>
                      {t("confirmDemoPayment")}
                      <Check aria-hidden="true" />
                    </a>
                  </div>
                ) : null}
              </aside>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
      {toast ? <div className="react-toast">{toast}</div> : null}
    </>
  );
}

function normalizeLegacyConstructorMaterialCode(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "silver" || normalized === "silver_925") return "silver";
  if (normalized === "gold" || normalized === "gold_plated" || normalized === "solid_gold") return "gold";
  if (normalized === "rose_gold" || normalized === "rose_gold_925" || normalized === "rose_gold_plated") return "rose_gold";
  return normalized;
}

function localizedConstructorValue(entry, locale, keys = ["label", "name"]) {
  if (!entry) return "";

  for (const key of keys) {
    const localized = entry?.[`${key}_${locale}`];
    if (localized) return localized;
    if (entry?.[key]) return entry[key];
  }

  return "";
}

function selectConstructorShowcaseType(types = []) {
  const preferredCodes = ["pendant", "ring", "bracelet", "earrings"];
  return preferredCodes.map((code) => types.find((item) => item.code === code)).find(Boolean) || types[0] || null;
}

function selectConstructorShowcaseVariant(typeCode, variants = []) {
  const orderedVariants = [...variants].sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0));
  const preferredCodesByType = {
    pendant: ["pendant-heart", "pendant-moon", "pendant-drop"],
    ring: ["ring-trinity"],
    bracelet: ["bracelet-orbit"],
    earrings: ["earrings-drop"]
  };
  const preferredCodes = preferredCodesByType[typeCode] || [];

  return preferredCodes.map((code) => orderedVariants.find((item) => item.code === code)).find(Boolean) || orderedVariants[0] || null;
}

function selectConstructorShowcaseMaterial(materials = []) {
  return [...materials].sort((left, right) => Number(right.price_delta || 0) - Number(left.price_delta || 0))[0] || materials[0] || null;
}

function selectConstructorShowcaseStone(stones = []) {
  const preferredCodes = ["diamond", "opal", "pearl", "garnet", "rose_quartz", "onyx", "heart_charm", "none"];
  return preferredCodes.map((code) => stones.find((item) => item.code === code)).find(Boolean) || stones[0] || null;
}

function buildConstructorShowcase(config, locale) {
  const types = config?.types || [];
  const variants = config?.variants || [];
  const stones = config?.stones || [];
  const matrix = config?.variantStoneMatrix || [];
  const currentType = selectConstructorShowcaseType(types);

  if (!currentType) return null;

  const typeVariants = variants.filter((item) => String(item.type_id) === String(currentType.id));
  const currentVariant = selectConstructorShowcaseVariant(currentType.code, typeVariants);
  if (!currentVariant) return null;

  const slots = [...(config?.slotsByVariant?.[currentVariant.id] || [])].sort(
    (left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0)
  );
  const matrixForVariant = matrix.filter(
    (item) => String(item.variant_id) === String(currentVariant.id) && item.is_enabled !== false
  );
  const availableStones = matrixForVariant
    .map((entry) => {
      const stone = stones.find((item) => String(item.id) === String(entry.stone_id));
      return stone ? { ...stone, price_delta: entry.price_delta, is_default: entry.is_default } : null;
    })
    .filter(Boolean);
  const material = selectConstructorShowcaseMaterial(currentType.materials || []);
  const size = (currentType.size_options || []).find((item) => item.is_default) || currentType.size_options?.[0] || null;
  const selectedStone = selectConstructorShowcaseStone(availableStones.filter((item) => item.code !== "none")) || selectConstructorShowcaseStone(availableStones);
  const selections = slots.reduce((accumulator, slot) => {
    accumulator[slot.code] = selectedStone?.code || "none";
    return accumulator;
  }, {});
  const engraving = currentType?.engraving?.enabled ? "AURORA" : "";

  return {
    type: currentType,
    variant: currentVariant,
    slots,
    availableStones,
    selections,
    material,
    size,
    engraving,
    configuration: {
      variant_id: Number(currentVariant.id),
      material: material?.code || "",
      stone_slots: selections,
      ...(size?.code ? { size: size.code } : {}),
      ...(engraving ? { engraving_text: engraving } : {})
    },
    display: {
      type: localizedConstructorValue(currentType, locale, ["name"]),
      variant: localizedConstructorValue(currentVariant, locale, ["name"]),
      material: localizedConstructorValue(material, locale, ["label"]),
      stone: localizedConstructorValue(selectedStone, locale, ["label", "name"]),
      size: localizedConstructorValue(size, locale, ["label"])
    }
  };
}

function Bespoke() {
  const { locale } = useI18n();
  const copy = referenceCopy(locale);
  const [config, setConfig] = useState(null);
  const showcase = useMemo(() => buildConstructorShowcase(config, locale), [config, locale]);
  const stonesByCode = useMemo(() => buildStoneCodeMap(showcase?.availableStones || []), [showcase]);

  useEffect(() => {
    let active = true;

    constructorApi
      .getConfig()
      .then((data) => {
        if (active) setConfig(data || null);
      })
      .catch(() => {
        if (active) setConfig(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const previewChips = [
    showcase?.display?.type,
    showcase?.display?.material,
    showcase?.display?.stone,
    showcase?.type?.engraving?.enabled ? copy.bespokePreviewChipEngraving : ""
  ].filter(Boolean);

  return (
    <section className="section bespoke-section" id="bespoke">
      <div className="section-inner">
        <div className="bespoke-shell">
          <div className="bespoke-top">
            <div className="bespoke-intro">
              <p className="bespoke-eyebrow">{copy.bespokeEyebrow}</p>
              <h2 className="bespoke-title" style={{ whiteSpace: "pre-line" }}>{copy.bespokeTitle}</h2>
              <p className="bespoke-sub">{copy.bespokeSubtitle}</p>
              <div className="bespoke-actions">
                <a className="button bespoke-cta" href="/constructor">
                  <span>{copy.bespokeCta}</span>
                  <ChevronRight aria-hidden="true" />
                </a>
                <p className="bespoke-note">{copy.bespokeNote}</p>
              </div>
            </div>

            <aside className="bespoke-preview-card" aria-label={copy.bespokePreviewTitle}>
              <div className="bespoke-preview-head">
                <div className="bespoke-preview-copy">
                  <p className="bespoke-preview-eyebrow">{copy.bespokePreviewEyebrow}</p>
                  <h3 className="bespoke-preview-title">{copy.bespokePreviewTitle}</h3>
                </div>
                <span className="bespoke-preview-live">{copy.bespokePreviewLive}</span>
              </div>

              <div className="bespoke-preview-stage">
                {showcase?.variant ? (
                  <div className="bespoke-preview-art">
                    <JewelryPreview
                      variant={showcase.variant}
                      slots={showcase.slots}
                      stonesByCode={stonesByCode}
                      selections={showcase.selections}
                      engraving={showcase.engraving}
                      materialCode={showcase.material?.code || ""}
                    />
                  </div>
                ) : (
                  <div className="bespoke-preview-fallback">
                    <img src={REFERENCE_IMAGES.bespoke} alt="" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="bespoke-preview-meta">
                <p className="bespoke-preview-note">{copy.bespokePreviewNote}</p>
                {previewChips.length ? (
                  <div className="bespoke-preview-chips" role="list" aria-label={copy.bespokePreviewTitle}>
                    {previewChips.map((chip) => (
                      <span className="bespoke-preview-chip" key={chip} role="listitem">{chip}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </aside>
          </div>

          <div className="bespoke-steps" role="list" aria-label={copy.bespokeTitle.replace("\n", " ")}>
            {copy.bespokeSteps.map((step) => (
              <article className="bespoke-step-card" key={step.number} role="listitem">
                <span className="bespoke-step-number">{step.number}</span>
                <h3 className="bespoke-step-title">{step.title}</h3>
                <p className="bespoke-step-text">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Editorial() {
  const { locale } = useI18n();
  const copy = referenceCopy(locale);
  const sectionRef = React.useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={`section editorial-section${isVisible ? " is-visible" : ""}`} ref={sectionRef}>
      <div className="section-inner">
        <div className="editorial-shell">
          <div className="editorial-intro">
            <p className="editorial-eyebrow">{copy.editorialEyebrow}</p>
            <h2 className="editorial-title">{copy.editorialTitle}</h2>
            <p className="editorial-subtitle">{copy.editorialSubtitle}</p>
          </div>
          <div className="editorial-divider" aria-hidden="true" />
          <div className="editorial-grid" role="list" aria-label={copy.editorialTitle}>
            {copy.editorialCards.map((card, index) => (
              <article
                className="editorial-card"
                key={card.title}
                role="listitem"
                style={{ "--editorial-delay": `${index * 140}ms` }}
              >
                <div className="editorial-card-topline">
                  <span className="editorial-card-number">{card.number}</span>
                  <span className="editorial-card-dot" aria-hidden="true" />
                </div>
                <div className="editorial-card-body">
                  <h3 className="editorial-card-title">{card.title}</h3>
                  <p className="editorial-card-text">{card.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CareAndFaq() {
  const { locale } = useI18n();
  const copy = referenceCopy(locale);
  const [open, setOpen] = useState(null);

  return (
    <section className="section faq-section" id="faq">
      <div className="section-inner">
        <div className="section-heading">
          <p className="eyebrow">{copy.faqEyebrow}</p>
          <h2 className="section-title">{copy.faqTitle}</h2>
        </div>
        <div className="faq-list">
          {copy.faqs.map((item, index) => (
            <div className={`faq-item${open === index ? " open" : ""}`} key={item.q}>
              <button className="faq-question" type="button" onClick={() => setOpen(open === index ? null : index)}>
                <span>{item.q}</span>
                <span className="faq-arrow">{open === index ? "−" : "+"}</span>
              </button>
              {open === index ? <div className="faq-answer">{item.a}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutVisual({ src, alt, className = "", fallbackClassName = "" }) {
  const [hidden, setHidden] = useState(false);

  return (
    <div className={`${className}${hidden ? " is-fallback" : ""}`}>
      {!hidden && src ? <img src={src} alt={alt} loading="lazy" onError={() => setHidden(true)} /> : null}
      <div className={`about-visual-fallback ${fallbackClassName}`.trim()} aria-hidden={hidden ? "false" : "true"}>
        <span className="about-visual-fallback-line" />
        <span className="about-visual-fallback-line short" />
      </div>
    </div>
  );
}

function AboutPage() {
  const { locale } = useI18n();
  const copy = ABOUT_PAGE_CONTENT[locale] || ABOUT_PAGE_CONTENT.en;
  const [heroVideoUnavailable, setHeroVideoUnavailable] = useState(false);
  const [heroPosterHidden, setHeroPosterHidden] = useState(false);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const galleryItems = [
    {
      ...copy.gallery.items[0],
      src: REFERENCE_IMAGES.about?.workshopOverview,
      className: "about-gallery-card is-large"
    },
    {
      ...copy.gallery.items[1],
      src: REFERENCE_IMAGES.about?.artisanDetail,
      className: "about-gallery-card is-medium"
    },
    {
      ...copy.gallery.items[2],
      src: REFERENCE_IMAGES.about?.materialsTable,
      className: "about-gallery-card is-medium"
    },
    {
      ...copy.gallery.items[3],
      src: REFERENCE_IMAGES.about?.packaging,
      className: "about-gallery-card is-tall"
    }
  ];

  function handleAboutAnchorClick(event, href) {
    if (!href?.startsWith("#")) return;
    event.preventDefault();
    const target = document.querySelector(href);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <Header />
      <main className="about-main" data-locale={locale}>
        <section className="about-hero section">
          <div className="section-inner about-hero-shell">
            <div className="about-hero-media-wrap">
              <div className={`about-hero-media${heroVideoUnavailable ? " is-video-fallback" : ""}`}>
                {!heroPosterHidden ? (
                  <img
                    className={`about-hero-poster${heroVideoReady ? " is-hidden" : ""}`}
                    src={REFERENCE_IMAGES.about?.heroPoster}
                    alt=""
                    aria-hidden="true"
                    onError={() => setHeroPosterHidden(true)}
                  />
                ) : null}
                {!heroVideoUnavailable ? (
                  <video
                    className="about-hero-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    poster={REFERENCE_IMAGES.about?.heroPoster}
                    onLoadedData={() => setHeroVideoReady(true)}
                    onPlaying={() => setHeroVideoReady(true)}
                    onError={() => {
                      setHeroVideoUnavailable(true);
                      setHeroVideoReady(false);
                    }}
                  >
                    <source src={REFERENCE_IMAGES.about?.heroVideo} type="video/mp4" />
                  </video>
                ) : null}
                <div className="about-hero-overlay" />
                <div className="about-hero-atmosphere" aria-hidden="true">
                  <span>atelier</span>
                  <span>process</span>
                  <span>materials</span>
                </div>
              </div>
            </div>

            <div className="about-hero-panel">
              <p className="eyebrow">{copy.hero.eyebrow}</p>
              <h1 className="about-hero-title">{copy.hero.title}</h1>
              <p className="about-hero-text">{copy.hero.text}</p>
              <div className="about-hero-actions">
                <a className="button" href="/catalog">{copy.hero.primaryCta}</a>
                <a className="button button-ghost" href="/constructor">{copy.hero.secondaryCta}</a>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section section">
          <div className="section-inner about-story-grid">
            <div className="about-story-copy">
              <h2 className="section-title about-story-title">{copy.whoWeAre.title}</h2>
              {copy.whoWeAre.paragraphs.map((paragraph) => (
                <p className="about-story-text" key={paragraph}>{paragraph}</p>
              ))}
              <aside className="about-quote-card">
                <span className="about-quote-mark">“</span>
                <p>{copy.whoWeAre.quote}</p>
              </aside>
            </div>

            <div className="about-story-media-stack">
              <AboutVisual
                src={REFERENCE_IMAGES.about?.clientConsultation || REFERENCE_IMAGES.about?.workshopOverview}
                alt={copy.whoWeAre.title}
                className="about-story-media"
                fallbackClassName="is-warm"
              />
            </div>
          </div>
        </section>

        <section className="about-section section about-create-section">
          <div className="section-inner">
            <div className="section-heading about-section-heading">
              <h2 className="section-title">{copy.create.title}</h2>
            </div>
            <div className="about-create-grid" role="list" aria-label={copy.create.title}>
              {copy.create.cards.map((card, index) => (
                <article className="about-create-card" key={card.title} role="listitem">
                  <span className="about-create-index">{`0${index + 1}`}</span>
                  <h3 className="about-create-title">{card.title}</h3>
                  <p className="about-create-text">{card.text}</p>
                  <a
                    className="about-inline-link"
                    href={card.href}
                    onClick={(event) => handleAboutAnchorClick(event, card.href)}
                  >
                    <span>{card.cta}</span>
                    <ChevronRight aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-section section about-process-section" id="about-process">
          <div className="section-inner">
            <div className="section-heading about-process-heading">
              <p className="eyebrow">{copy.process.eyebrow}</p>
              <h2 className="section-title">{copy.process.title}</h2>
            </div>
            <div className="about-process-grid" role="list" aria-label={copy.process.title}>
              {copy.process.steps.map((step) => (
                <article className="about-process-card" key={step.number} role="listitem">
                  <div className="about-process-top">
                    <span className="about-process-number">{step.number}</span>
                    <span className="about-process-line" aria-hidden="true" />
                  </div>
                  <h3 className="about-process-title">{step.title}</h3>
                  <p className="about-process-text">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-section section about-gallery-section">
          <div className="section-inner">
            <div className="section-heading about-section-heading">
              <h2 className="section-title">{copy.gallery.title}</h2>
            </div>
            <div className="about-gallery-grid" role="list" aria-label={copy.gallery.title}>
              {galleryItems.map((item) => (
                <figure className={item.className} key={item.key} role="listitem">
                  <AboutVisual src={item.src} alt={item.caption} className="about-gallery-media" fallbackClassName="is-soft" />
                  <figcaption className="about-gallery-caption">{item.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="about-section section about-principles-section">
          <div className="section-inner">
            <div className="section-heading about-section-heading">
              <h2 className="section-title">{copy.principles.title}</h2>
            </div>
            <div className="about-principles-grid" role="list" aria-label={copy.principles.title}>
              {copy.principles.items.map((item) => (
                <article className="about-principle-card" key={item.number} role="listitem">
                  <span className="about-principle-number">{item.number}</span>
                  <h3 className="about-principle-title">{item.title}</h3>
                  <p className="about-principle-text">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-section section about-final-cta">
          <div className="section-inner">
            <div className="about-final-shell">
              <div className="about-final-copy">
                <h2 className="about-final-title">{copy.cta.title}</h2>
                <p className="about-final-text">{copy.cta.text}</p>
              </div>
              <div className="about-final-actions">
                <a className="button" href="/catalog">{copy.cta.primaryCta}</a>
                <a className="button button-ghost" href="/constructor">{copy.cta.secondaryCta}</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Footer() {
  const { locale } = useI18n();
  const copy = referenceCopy(locale);
  const navigationTitle = locale === "uk" ? "Навігація" : "Navigation";
  const accountTitle = locale === "uk" ? "Акаунт" : "Account";
  const ordersTitle = locale === "uk" ? "Мої замовлення" : "My orders";
  const contactAtelierLabel = locale === "uk" ? "Ательє у Харкові" : "Atelier in Kharkiv";
  const footerOriginLabel = locale === "uk" ? "Створено в Харкові" : "Made in Kharkiv";

  return (
    <footer className="site-footer">
      <div className="section-inner site-footer-inner">
        <div className="site-footer-brand">
          <div className="site-footer-mark">Aurora Atelier</div>
          <p className="site-footer-tagline">{copy.footerText}</p>
        </div>

        <div className="site-footer-columns">
          <div className="site-footer-column">
            <h4 className="site-footer-title">{navigationTitle}</h4>
            <a className="site-footer-link" href="/">{copy.navHome}</a>
            <a className="site-footer-link" href="/about">{copy.navAbout}</a>
            <a className="site-footer-link" href="/catalog">{copy.navCollection}</a>
            <a className="site-footer-link" href="/constructor">{copy.navConstructor}</a>
          </div>
          <div className="site-footer-column">
            <h4 className="site-footer-title">{accountTitle}</h4>
            <a className="site-footer-link" href="/orders">{ordersTitle}</a>
            <a className="site-footer-link" href="/account">{accountTitle}</a>
          </div>
          <div className="site-footer-column">
            <h4 className="site-footer-title">{copy.contact}</h4>
            <span className="site-footer-text">{contactAtelierLabel}</span>
            <a className="site-footer-link site-footer-email" href="mailto:auroraatelier.mail@gmail.com">
              auroraatelier.mail@gmail.com
            </a>
          </div>
        </div>
      </div>

      <div className="section-inner site-footer-bottom">
        <span className="site-footer-meta">© 2026 Aurora Atelier</span>
        <span className="site-footer-meta">{footerOriginLabel}</span>
      </div>
    </footer>
  );
}

function HomePage() {
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const { localeFormat: locale, t } = useI18n();

  useEffect(() => {
    let active = true;

    catalogApi
      .listProducts()
      .then((items) => {
        if (active) setProducts(items || []);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });

    return () => {
      active = false;
    };
  }, []);

    return (
      <>
        <Header />
        <main className="home-main">
          <Hero />
          <TrustMetrics />
          <HomeTwoPaths />
          <HomeCategories />
          {loadError ? <p className="load-error">{loadError}</p> : null}
        <FeaturedCollections products={products} locale={locale} />
        <Bespoke />
        <Editorial />
        <CareAndFaq />
        <section className="final-cta-section">
          <div className="final-cta-inner">
            <h2 className="final-cta-title">{referenceCopy(locale === "uk-UA" ? "uk" : "en").finalTitle}</h2>
            <p className="final-cta-sub">{referenceCopy(locale === "uk-UA" ? "uk" : "en").finalSubtitle}</p>
            <div className="final-cta-actions">
              <a className="button" href="/catalog">
                {referenceCopy(locale === "uk-UA" ? "uk" : "en").finalPrimary}
              </a>
              <a className="button button-ghost" href="/constructor" style={{ color: "#fff", borderColor: "#fff" }}>
                {referenceCopy(locale === "uk-UA" ? "uk" : "en").finalSecondary}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [googleConfig, setGoogleConfig] = useState({ enabled: false, client_id: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const { t, localeFormat } = useI18n();
  const googleButtonRef = React.useRef(null);
  const isUk = localeFormat === "uk-UA";
  const isVerifyStep = Boolean(pendingVerificationEmail);

  const authBenefits = [
    { icon: Shield, label: t("trustGuarantee"), text: t("trustGuaranteeText") },
    { icon: Truck, label: t("trustDelivery"), text: t("trustDeliveryText") },
    { icon: Award, label: t("trustMaterials"), text: t("trustMaterialsText") },
    { icon: Sparkles, label: t("trustService"), text: t("trustServiceText") }
  ];

  const modeMeta = isVerifyStep
    ? {
        badge: t("authVerifyBadge"),
        lead: t("authVerifyLead"),
        chips: [t("authVerifyChip1"), t("authVerifyChip2")],
        asideText: t("authAsideVerifyText")
      }
    : mode === "login"
    ? {
        badge: t("authLoginBadge"),
        lead: t("authLoginLead"),
        chips: [t("authSignInChip1"), t("authSignInChip2")],
        asideText: t("authAsideLoginText")
      }
    : {
        badge: t("authRegisterBadge"),
        lead: t("authRegisterLead"),
        chips: [t("authRegisterChip1"), t("authRegisterChip2")],
        asideText: t("authAsideRegisterText")
      };

  useEffect(() => {
    let active = true;
    authApi.getGoogleConfig()
      .then((config) => {
        if (active) setGoogleConfig(config);
      })
      .catch(() => {
        if (active) setGoogleConfig({ enabled: false, client_id: "" });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!googleConfig.enabled || !googleConfig.client_id || isVerifyStep) return undefined;
    let cancelled = false;

    function renderGoogleButton() {
      if (cancelled || !googleButtonRef.current || !window.google?.accounts?.id) return;
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: googleConfig.client_id,
        callback: async (response) => {
          setError("");
          setNotice("");
          setIsSubmitting(true);
          try {
            await authApi.loginWithGoogle(response.credential);
            await finalizeAfterAuth();
          } catch (err) {
            setError(err.message);
          } finally {
            setIsSubmitting(false);
          }
        }
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: Math.max(260, Math.min(googleButtonRef.current.clientWidth || 360, 420))
      });
    }

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return undefined;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.body.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [googleConfig, isVerifyStep]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (isVerifyStep) {
      if (!verificationCode.trim()) {
        setError(t("authVerificationCode") + " " + t("fillRequired").toLowerCase());
        return;
      }
      setIsSubmitting(true);
      try {
        await authApi.verifyEmail({
          email: pendingVerificationEmail,
          code: verificationCode.trim()
        });
        await finalizeAfterAuth();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === "register" && !name.trim()) {
      setError(t("name") + " " + t("fillRequired").toLowerCase());
      return;
    }
    if (mode === "register" && !phone.trim()) {
      setError(t("phone") + " " + t("fillRequired").toLowerCase());
      return;
    }
    if (!email.includes("@")) {
      setError(t("email") + " " + t("fillRequired").toLowerCase());
      return;
    }
    if (password.length < 6) {
      setError(t("fillRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "register") {
        const result = await authApi.register({
          full_name: name.trim(),
          phone: phone.trim(),
          email,
          password
        });
        if (result?.verification_required) {
          setPendingVerificationEmail(result.verification?.email || email);
          setVerificationCode("");
          setNotice(isUk ? "Ми надіслали код підтвердження на вашу пошту." : "We sent a verification code to your email.");
          return;
        }
      } else {
        await authApi.login({ email, password });
      }
      await finalizeAfterAuth();
    } catch (err) {
      if (err.payload?.error?.code === "EMAIL_NOT_VERIFIED") {
        setPendingVerificationEmail(email);
        setNotice(isUk ? "Спершу підтвердьте email кодом з листа." : "Please verify your email with the code from the message first.");
      }
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function resendCode() {
    setError("");
    setNotice("");
    setIsSubmitting(true);
    try {
      await authApi.resendVerificationCode(pendingVerificationEmail);
      setNotice(isUk ? "Новий код уже надіслано." : "A new code has been sent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetVerificationStep() {
    setPendingVerificationEmail("");
    setVerificationCode("");
    setError("");
    setNotice("");
  }

  async function finalizeAfterAuth() {
    const mergedCart = await mergeGuestCartIntoAccountCart();
    const pendingCartItem = consumePendingCartItem();
    let finalCart = mergedCart;
    if (pendingCartItem) {
      finalCart = await cartApi.addItem(pendingCartItem);
      syncCartCount(finalCart);
    }
    const redirectPath = consumePostAuthRedirect();
    if (redirectPath) {
      window.location.href = redirectPath;
      return;
    }
    if (finalCart || pendingCartItem) {
      window.location.href = "/cart";
      return;
    }
    window.location.href = "/orders";
  }

  return (
    <>
      <Header />
      <main className="auth-react-page">
        <div className="auth-page-shell">
          <section className="auth-form-panel">
            <div className={`auth-form-card${isVerifyStep ? " is-verify-step" : ""}`}>
              <div className="auth-form-chrome">
                <div className="auth-form-kicker">
                  <span className="badge subtle">{t("account")}</span>
                  <p>{modeMeta.badge}</p>
                </div>

                {!isVerifyStep ? (
                  <div className="auth-tabs">
                    <button
                      type="button"
                      className={mode === "login" ? "is-active" : ""}
                      onClick={() => switchMode("login")}
                    >
                      {t("authLoginTab")}
                    </button>
                    <button
                      type="button"
                      className={mode === "register" ? "is-active" : ""}
                      onClick={() => switchMode("register")}
                    >
                      {t("authRegisterTab")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="button button-ghost auth-back-link"
                    onClick={resetVerificationStep}
                    disabled={isSubmitting}
                  >
                    {t("authBackToLogin")}
                  </button>
                )}
              </div>

              <div className="auth-form-inner">
                <div className="section-heading auth-heading-block">
                  <h1>{isVerifyStep ? t("authVerificationTitle") : mode === "login" ? t("authLoginTitle") : t("authRegisterTitle")}</h1>
                  <p className="auth-helper-copy">{modeMeta.lead}</p>
                </div>

                <div className="auth-chip-row" aria-label="Auth flow highlights">
                  {modeMeta.chips.map((chip) => (
                    <span key={chip} className="auth-chip">
                      {chip}
                    </span>
                  ))}
                </div>

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                  {isVerifyStep ? (
                    <>
                      <div className="auth-verify-intro">
                        <p className="auth-helper-copy">{t("authVerificationText")}</p>
                        <strong>{pendingVerificationEmail}</strong>
                      </div>
                      <label className="auth-field auth-field-verify">
                        <span>{t("authVerificationCode")}</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="123456"
                          required
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      {mode === "register" ? (
                        <div className="auth-field-grid">
                          <label className="auth-field">
                            <span>{t("name")}</span>
                            <input
                              type="text"
                              autoComplete="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Aurora Atelier"
                              required
                            />
                          </label>
                          <label className="auth-field">
                            <span>{t("phone")}</span>
                            <input
                              type="tel"
                              autoComplete="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+380991234567"
                              required
                            />
                          </label>
                        </div>
                      ) : null}

                      <label className="auth-field">
                        <span>{t("email")}</span>
                        <input
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                        />
                      </label>

                      <label className="auth-field">
                        <span>{t("password")}</span>
                        <input
                          type="password"
                          autoComplete={mode === "login" ? "current-password" : "new-password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          minLength={6}
                          required
                        />
                        <small className="auth-field-note">{t("authPasswordHint")}</small>
                      </label>
                    </>
                  )}

                  {error ? <p className="auth-error">{error}</p> : null}
                  {notice ? <p className="auth-notice">{notice}</p> : null}

                  <button type="submit" className="button auth-submit-button" disabled={isSubmitting}>
                    {isSubmitting
                      ? t("creatingOrder").replace("...", "").trim() + "..."
                      : isVerifyStep
                      ? t("authSubmitVerification")
                      : mode === "login"
                      ? t("authSubmitLogin")
                      : t("authSubmitRegister")}
                    <Check aria-hidden="true" />
                  </button>

                  {isVerifyStep ? (
                    <div className="auth-secondary-actions">
                      <button type="button" className="button button-outline auth-secondary-button" onClick={resendCode} disabled={isSubmitting}>
                        {t("authResendCode")}
                      </button>
                      <button type="button" className="button button-ghost auth-secondary-button" onClick={resetVerificationStep} disabled={isSubmitting}>
                        {t("authBackToLogin")}
                      </button>
                    </div>
                  ) : null}
                </form>

                {!isVerifyStep && googleConfig.enabled ? (
                  <div className="auth-oauth-panel">
                    <div className="auth-divider"><span>{isUk ? "або" : "or"}</span></div>
                    <div className="auth-google-shell">
                      <div ref={googleButtonRef} className="auth-google-button" aria-label={t("authGoogle")} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <aside className="auth-aside">
            <img src={FALLBACK_PRODUCT_IMAGE} alt="Aurora Atelier" />
            <div className="auth-aside-overlay" />
            <div className="auth-aside-content">
              <span className="badge badge-on-dark">{t("bespokeService")}</span>
              <h2>{t("bespokeTitle")}</h2>
              <p className="auth-aside-text">{modeMeta.asideText}</p>
              <div className="auth-benefits">
                {authBenefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <article key={benefit.label} className="auth-benefit-card">
                      <span className="auth-benefit-icon">
                        <Icon aria-hidden="true" />
                      </span>
                      <div>
                        <strong>{benefit.label}</strong>
                        <p>{benefit.text}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

function AdminShell({ children, title, subtitle }) {
  return (
    <main className="admin-react-page">
      <header className="admin-react-header">
        <div className="admin-react-inner admin-react-header-row">
          <div>
            <a className="admin-brand" href="/admin/orders">Aurora Atelier</a>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <nav className="admin-react-nav" aria-label={ADMIN_UI.shell.navAria}>
            <a href="/admin/orders">{ADMIN_UI.shell.orders}</a>
            <a href="/admin/products">{ADMIN_UI.shell.products}</a>
            <a href="/admin/constructor">{ADMIN_UI.shell.constructor}</a>
            <a href="/">{ADMIN_UI.shell.site}</a>
          </nav>
        </div>
      </header>
      <section className="admin-react-inner admin-react-content">
        {children}
      </section>
    </main>
  );
}

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await authApi.adminLogin({ email, password });
      window.location.href = "/admin/orders";
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-login-react">
      <section className="admin-login-panel">
        <a className="admin-brand" href="/">Aurora Atelier</a>
        <h1>{ADMIN_UI.login.title}</h1>
        <p>{ADMIN_UI.login.subtitle}</p>
        <form className="admin-form-grid" onSubmit={handleSubmit}>
          <label>
            <span>{ADMIN_UI.login.email}</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            <span>{ADMIN_UI.login.password}</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error ? <p className="admin-error">{error}</p> : null}
          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? ADMIN_UI.login.submitting : ADMIN_UI.login.submit}
          </button>
        </form>
      </section>
      <aside className="admin-login-art">
        <img src={FALLBACK_PRODUCT_IMAGE} alt="" />
      </aside>
    </main>
  );
}

function AdminMetric({ label, value }) {
  return (
    <article className="admin-metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function AdminOrdersPage() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [error, setError] = useState("");
  const locale = ADMIN_LOCALE;

  useEffect(() => {
    let active = true;
    adminOrdersApi
      .listOrders(filters)
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((err) => {
        if (!active) return;
        if (err.status === 401 || err.status === 403) {
          window.location.href = "/admin/login";
          return;
        }
        setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [filters]);

  const orders = data?.orders || [];
  const summary = data?.summary || {};

  return (
    <AdminShell title={ADMIN_UI.orders.title} subtitle={ADMIN_UI.orders.subtitle}>
      {error ? <p className="admin-error">{error}</p> : null}
      <div className="admin-metric-grid">
        <AdminMetric label={ADMIN_UI.orders.total} value={summary.total_orders ?? 0} />
        <AdminMetric label={ADMIN_UI.orders.revenue} value={formatCurrency(summary.revenue_total || 0, "UAH", locale)} />
        <AdminMetric label={ADMIN_UI.orders.average} value={formatCurrency(summary.average_order_value || 0, "UAH", locale)} />
        <AdminMetric label={ADMIN_UI.orders.overdue} value={summary.overdue_orders ?? 0} />
      </div>
      <div className="admin-toolbar">
        <input
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder={ADMIN_UI.orders.searchPlaceholder}
        />
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
          <option value="">{ADMIN_UI.orders.allStatuses}</option>
          <option value="created_pending_payment">{adminOrderStatusLabel("created_pending_payment")}</option>
          <option value="confirmed">{adminOrderStatusLabel("confirmed")}</option>
          <option value="in_progress">{adminOrderStatusLabel("in_progress")}</option>
          <option value="completed">{adminOrderStatusLabel("completed")}</option>
        </select>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{ADMIN_UI.orders.order}</th>
              <th>{ADMIN_UI.orders.customer}</th>
              <th>{ADMIN_UI.orders.status}</th>
              <th>{ADMIN_UI.orders.payment}</th>
              <th>{ADMIN_UI.orders.totalAmount}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="admin-order-id">{order.order_number}</td>
                <td>
                  <strong>{order.customer_name}</strong>
                  <span>{order.email}</span>
                </td>
                <td><span className={statusClassName(order.status, order.overdue)}>{adminOrderStatusLabel(order.status)}</span></td>
                <td>{adminPaymentStateLabel(order.payment_state)}</td>
                <td>{formatCurrency(order.total_amount, order.currency, locale)}</td>
                <td><a className="small-button" href={`/admin/orders/${order.id}`}>{ADMIN_UI.common.open}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function AdminOrderDetailPage() {
  const orderId = window.location.pathname.split("/").filter(Boolean).at(-1);
  const [order, setOrder] = useState(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const locale = ADMIN_LOCALE;

  async function loadOrder() {
    try {
      const result = await adminOrdersApi.getOrder(orderId);
      setOrder(result);
      setError("");
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        window.location.href = "/admin/login";
        return;
      }
      setError(err.message);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function updateStatus(nextStatus) {
    setIsUpdating(true);
    try {
      const result = await adminOrdersApi.updateOrderStatus(order.id, nextStatus, comment);
      setOrder(result);
      setComment("");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <AdminShell title={order?.order_number || ADMIN_UI.orderDetail.fallbackTitle} subtitle={ADMIN_UI.orderDetail.subtitle}>
      {error ? <p className="admin-error">{error}</p> : null}
      {!order ? <div className="empty-state-react"><h2>{ADMIN_UI.orderDetail.loading}</h2></div> : (
        <div className="admin-detail-grid">
          <section className="admin-panel">
            <h2>{order.customer_name}</h2>
            <p>{order.email} · {order.phone}</p>
            <p>{order.delivery_method}: {order.delivery_address}</p>
            <strong>{formatCurrency(order.total_amount, order.currency, locale)}</strong>
          </section>
          <section className="admin-panel">
            <h2>{ADMIN_UI.orderDetail.status}</h2>
            <span className={statusClassName(order.status, order.overdue)}>{adminOrderStatusLabel(order.status)}</span>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={ADMIN_UI.orderDetail.commentPlaceholder} />
            <div className="admin-action-row">
              {(order.available_statuses || []).map((status) => (
                <button className="button button-ghost" key={status} type="button" disabled={isUpdating} onClick={() => updateStatus(status)}>
                  {ADMIN_UI.orderDetail.moveTo} {adminOrderStatusLabel(status).toLowerCase()}
                </button>
              ))}
            </div>
          </section>
          <section className="admin-panel wide">
            <h2>{ADMIN_UI.orderDetail.items}</h2>
            <div className="order-items-list">
              {order.items.map((item) => (
                <div key={item.id}>
                  <span>{item.title} × {item.quantity}</span>
                  {item.item_type === "custom_design" && item.jewelry_type_code ? (
                    <p>{`${ADMIN_UI.orderDetail.productType}: ${adminTypeCodeLabel(item.jewelry_type_code)}`}</p>
                  ) : null}
                  {getPendantChainDisplay(item, locale, {}, { includeMetal: true }) ? (
                    <p>{getPendantChainDisplay(item, locale, {}, { includeMetal: true }).text}</p>
                  ) : null}
                  {getPendantChainDisplay(item, locale, {}, { includeMetal: true })?.surcharge ? (
                    <p>{getPendantChainDisplay(item, locale, {}, { includeMetal: true }).surcharge}</p>
                  ) : null}
                  <strong>{formatCurrency(item.line_total, order.currency, locale)}</strong>
                </div>
              ))}
            </div>
          </section>
          <section className="admin-panel wide">
            <h2>{ADMIN_UI.orderDetail.timeline}</h2>
            <div className="timeline-react">
              {order.history.map((entry) => (
                <article className="timeline-react-item" key={entry.id}>
                  <strong>{adminOrderStatusLabel(entry.new_status)}</strong>
                  <span>{formatOrderDate(entry.created_at, locale)}</span>
                  {entry.comment ? <p>{entry.comment}</p> : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}

const ADMIN_PRODUCT_FILTERS = {
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

function emptyProductForm(jewelryTypes = []) {
  return {
    jewelry_type_id: String(jewelryTypes[0]?.id || ""),
    sku: "",
    slug: "",
    name_uk: "",
    name_en: "",
    description_uk: "",
    description_en: "",
    price: "",
    currency: "UAH",
    image_asset_path: "",
    asset_id: "",
    variant_id: "",
    image_alt_uk: "",
    image_alt_en: "",
    is_active: true,
    type: "",
    metal: "",
    stoneType: "",
    stoneShape: "",
    stoneColor: "",
    stoneSize: "",
    ringSize: "",
    ringType: "",
    braceletLength: ""
  };
}

function productToForm(product) {
  return {
    jewelry_type_id: String(product.jewelry_type_id || ""),
    sku: product.sku || "",
    slug: product.slug || "",
    name_uk: product.name_uk || "",
    name_en: product.name_en || "",
    description_uk: product.description_uk || "",
    description_en: product.description_en || "",
    price: String(product.price ?? ""),
    currency: product.currency || "UAH",
    image_asset_path: product.image?.asset_path || "",
    asset_id: product.asset_id ? String(product.asset_id) : "",
    variant_id: product.variant_id ? String(product.variant_id) : "",
    image_alt_uk: product.image?.alt_uk || "",
    image_alt_en: product.image?.alt_en || "",
    is_active: Boolean(product.is_active),
    type: product.filters?.type || "",
    metal: product.filters?.metal || "",
    stoneType: product.filters?.stoneType || "",
    stoneShape: product.filters?.stoneShape || "",
    stoneColor: product.filters?.stoneColor || "",
    stoneSize: product.filters?.stoneSize || "",
    ringSize: product.filters?.ringSize || "",
    ringType: product.filters?.ringType || "",
    braceletLength: product.filters?.braceletLength || ""
  };
}

function optionValueToForm(optionId) {
  return {
    design_option_id: String(optionId || ""),
    code: "",
    label_uk: "",
    label_en: "",
    price_delta: "0",
    layer_key: "stone",
    asset_path: "",
    z_index: "3",
    is_active: true
  };
}

function optionValueRecordToForm(value) {
  return {
    design_option_id: String(value.design_option_id || ""),
    code: value.code || "",
    label_uk: value.label_uk || "",
    label_en: value.label_en || "",
    price_delta: String(value.price_delta ?? 0),
    layer_key: value.layer_key || "stone",
    asset_path: value.asset_path || "",
    z_index: String(value.z_index ?? 3),
    is_active: Boolean(value.is_active)
  };
}

function clampPercent(value) {
  const numeric = Number.parseFloat(String(value || "").replace("%", ""));
  if (!Number.isFinite(numeric)) return "50%";
  return `${Math.min(100, Math.max(0, Number(numeric.toFixed(2))))}%`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Не вдалося завантажити зображення"));
    reader.readAsDataURL(file);
  });
}

function getConstructorSlotKeys(typeCode) {
  if (typeCode === "bracelet") return ["slot-1", "slot-2", "slot-3", "slot-4", "slot-5", "slot-6"];
  if (typeCode === "ring") return ["left", "center", "right"];
  if (typeCode === "earrings") return ["left", "right"];
  return ["pendant"];
}

function getLayoutEditorModel(layouts, typeCode, pendantShape) {
  const safeLayouts = layouts || { bases: CONSTRUCTOR_PREVIEW_BASES, positions: CONSTRUCTOR_PREVIEW_SLOT_POSITIONS };
  if (typeCode === "pendant") {
    const activeShape = pendantShape === "moon" || pendantShape === "drop" ? pendantShape : "heart";
    return {
      baseAsset: safeLayouts.bases?.pendant?.[activeShape] || CONSTRUCTOR_PREVIEW_BASES.pendant[activeShape],
      positions: {
        pendant: safeLayouts.positions?.pendant?.[activeShape] || CONSTRUCTOR_PREVIEW_SLOT_POSITIONS.pendant[activeShape]
      },
      positionGroup: "pendant"
    };
  }

  return {
    baseAsset: safeLayouts.bases?.[typeCode] || CONSTRUCTOR_PREVIEW_BASES[typeCode],
    positions: safeLayouts.positions?.[typeCode] || CONSTRUCTOR_PREVIEW_SLOT_POSITIONS[typeCode],
    positionGroup: typeCode
  };
}

function updateLayoutBaseAsset(draft, typeCode, pendantShape, nextAssetPath) {
  const next = JSON.parse(JSON.stringify(draft));
  if (typeCode === "pendant") {
    next.bases.pendant[pendantShape] = nextAssetPath;
  } else {
    next.bases[typeCode] = nextAssetPath;
  }
  return next;
}

function AdminLayoutBoard({ typeCode, pendantShape, layouts, onMove }) {
  const boardRef = React.useRef(null);
  const [dragKey, setDragKey] = useState(null);
  const model = getLayoutEditorModel(layouts, typeCode, pendantShape);
  const slotKeys = typeCode === "pendant" ? ["pendant"] : getConstructorSlotKeys(typeCode);

  useEffect(() => {
    if (!dragKey) return undefined;
    function handleMove(event) {
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const nextLeft = clampPercent(((event.clientX - rect.left) / rect.width) * 100);
      const nextTop = clampPercent(((event.clientY - rect.top) / rect.height) * 100);
      onMove(dragKey, { left: nextLeft, top: nextTop });
    }

    function handleUp() {
      setDragKey(null);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragKey, onMove]);

  return (
    <div className="admin-layout-board" ref={boardRef}>
      <img className="admin-layout-base" src={model.baseAsset} alt="" aria-hidden="true" />
      {slotKeys.map((slotKey) => {
        const point = model.positions?.[slotKey] || { left: "50%", top: "50%" };
        return (
          <button
            key={slotKey}
            type="button"
            className="admin-layout-handle"
            style={{ left: point.left, top: point.top }}
            onMouseDown={() => setDragKey(slotKey)}
            title={slotKey}
          >
            <span>{slotKey === "pendant" ? "P" : slotKey.replace("slot-", "")}</span>
          </button>
        );
      })}
    </div>
  );
}

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [jewelryTypes, setJewelryTypes] = useState([]);
  const [constructorConfig, setConstructorConfig] = useState(null);
  const [assets, setAssets] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("new");
  const [form, setForm] = useState(emptyProductForm());
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const locale = ADMIN_LOCALE;

  useEffect(() => {
    let active = true;
    Promise.all([adminCatalogApi.listProducts(), adminCatalogApi.listJewelryTypes(), adminCatalogApi.getConstructorConfig(), adminCatalogApi.listAssets()])
      .then(([items, types, constructorData, assetItems]) => {
        if (!active) return;
        setProducts(items || []);
        setJewelryTypes(types || []);
        setConstructorConfig(constructorData || null);
        setAssets(assetItems || []);
        setForm(emptyProductForm(types || []));
      })
      .catch((err) => {
        if (err.status === 401 || err.status === 403) {
          window.location.href = "/admin/login";
          return;
        }
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (selectedProductId === "new") {
      setForm(emptyProductForm(jewelryTypes));
      return;
    }
    const selectedProduct = products.find((item) => String(item.id) === String(selectedProductId));
    if (selectedProduct) setForm(productToForm(selectedProduct));
  }, [selectedProductId, products, jewelryTypes]);

  function updateField(key, value) {
    setForm((current) => {
      if (key === "asset_id") {
        const asset = assets.find((item) => String(item.id) === String(value));
        return { ...current, asset_id: value, image_asset_path: asset?.path || current.image_asset_path };
      }
      return { ...current, [key]: value };
    });
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError("");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const uploaded = await adminCatalogApi.uploadProductImage({ file_name: file.name, data_url: dataUrl });
      setForm((current) => ({ ...current, image_asset_path: uploaded.asset_path }));
      setNotice(ADMIN_UI.products.imageUploaded);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function refreshProducts(nextSelectedId) {
    const items = await adminCatalogApi.listProducts();
    setProducts(items || []);
    if (nextSelectedId) {
      setSelectedProductId(String(nextSelectedId));
    }
  }

  async function handleSaveProduct() {
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        ...form,
        jewelry_type_id: Number(form.jewelry_type_id),
        price: Number(form.price || 0),
        asset_id: form.asset_id ? Number(form.asset_id) : null,
        variant_id: form.variant_id ? Number(form.variant_id) : null
      };
      const saved = selectedProductId === "new"
        ? await adminCatalogApi.createProduct(payload)
        : await adminCatalogApi.updateProduct(selectedProductId, payload);
      await refreshProducts(saved.id);
      setNotice(selectedProductId === "new" ? ADMIN_UI.products.created : ADMIN_UI.products.updated);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate() {
    if (selectedProductId === "new") return;
    setIsSaving(true);
    setError("");
    try {
      await adminCatalogApi.deactivateProduct(selectedProductId);
      await refreshProducts(selectedProductId);
      setNotice(ADMIN_UI.products.archived);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  const availableVariants = (constructorConfig?.variants || []).filter((variant) => {
    if (!form.jewelry_type_id) return true;
    return String(variant.type_id) === String(form.jewelry_type_id);
  });
  const imageAssets = assets.filter((asset) => asset.kind === "product" || asset.kind === "jewelry-base" || asset.kind === "other");

  return (
    <AdminShell title={ADMIN_UI.products.title} subtitle={ADMIN_UI.products.subtitle}>
      {error ? <p className="admin-error">{error}</p> : null}
      {notice ? <p className="admin-success">{notice}</p> : null}
      <div className="admin-editor-grid">
        <aside className="admin-panel admin-sidebar">
          <div className="admin-panel-head">
            <h2>{ADMIN_UI.products.listTitle}</h2>
            <button type="button" className="small-button" onClick={() => setSelectedProductId("new")}>{ADMIN_UI.common.new}</button>
          </div>
          <div className="admin-list-stack">
            {products.map((product) => (
              <button
                type="button"
                key={product.id}
                className={`admin-select-row${String(selectedProductId) === String(product.id) ? " is-active" : ""}`}
                onClick={() => setSelectedProductId(String(product.id))}
              >
                <img src={product.image?.asset_path || FALLBACK_PRODUCT_IMAGE} alt="" />
                <div>
                  <strong>{adminLocalizedEntry(product.name_uk, product.name_en)}</strong>
                  <span>{adminLocalizedEntry(product.jewelry_type_name_uk, product.jewelry_type_name_en, adminTypeCodeLabel(product.jewelry_type_code))}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="admin-panel wide">
          <div className="admin-panel-head">
            <h2>{selectedProductId === "new" ? ADMIN_UI.products.create : ADMIN_UI.products.edit}</h2>
            <div className="admin-inline-actions">
              {selectedProductId !== "new" ? (
                <button type="button" className="small-button button-danger" disabled={isSaving} onClick={handleDeactivate}>
                  {ADMIN_UI.common.archive}
                </button>
              ) : null}
              <button type="button" className="small-button" disabled={isSaving} onClick={handleSaveProduct}>
                {isSaving ? ADMIN_UI.common.saving : ADMIN_UI.common.save}
              </button>
            </div>
          </div>

          <div className="admin-form-grid">
            <label>
              <span>{ADMIN_UI.products.jewelryType}</span>
              <select value={form.jewelry_type_id} onChange={(event) => updateField("jewelry_type_id", event.target.value)}>
                {jewelryTypes.map((type) => (
                  <option key={type.id} value={type.id}>{adminLocalizedEntry(type.name_uk, type.name_en, adminTypeCodeLabel(type.code))}</option>
                ))}
              </select>
            </label>
            <label>
              <span>SKU</span>
              <input value={form.sku} onChange={(event) => updateField("sku", event.target.value)} />
            </label>
            <label>
              <span>{ADMIN_UI.products.slug}</span>
              <input value={form.slug} onChange={(event) => updateField("slug", event.target.value)} />
            </label>
            <label>
              <span>{ADMIN_UI.products.price}</span>
              <input type="number" value={form.price} onChange={(event) => updateField("price", event.target.value)} />
            </label>
            <label>
              <span>{ADMIN_UI.products.nameUk}</span>
              <input value={form.name_uk} onChange={(event) => updateField("name_uk", event.target.value)} />
            </label>
            <label>
              <span>{ADMIN_UI.products.nameEn}</span>
              <input value={form.name_en} onChange={(event) => updateField("name_en", event.target.value)} />
            </label>
            <label className="full">
              <span>{ADMIN_UI.products.descriptionUk}</span>
              <textarea rows={4} value={form.description_uk} onChange={(event) => updateField("description_uk", event.target.value)} />
            </label>
            <label className="full">
              <span>{ADMIN_UI.products.descriptionEn}</span>
              <textarea rows={4} value={form.description_en} onChange={(event) => updateField("description_en", event.target.value)} />
            </label>
            <label className="full">
              <span>{ADMIN_UI.products.primaryImageAsset}</span>
              <input value={form.image_asset_path} onChange={(event) => updateField("image_asset_path", event.target.value)} />
            </label>
            <label>
              <span>{ADMIN_UI.products.linkedVariant}</span>
              <select value={form.variant_id} onChange={(event) => updateField("variant_id", event.target.value)}>
                <option value="">-</option>
                {availableVariants.map((variant) => (
                  <option key={variant.id} value={variant.id}>{adminLocalizedEntry(variant.name_uk, variant.name_en, variant.code)}</option>
                ))}
              </select>
            </label>
            <label>
              <span>{ADMIN_UI.products.assetLibrary}</span>
              <select value={form.asset_id} onChange={(event) => updateField("asset_id", event.target.value)}>
                <option value="">-</option>
                {imageAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>{asset.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>{ADMIN_UI.products.imageAltUk}</span>
              <input value={form.image_alt_uk} onChange={(event) => updateField("image_alt_uk", event.target.value)} />
            </label>
            <label>
              <span>{ADMIN_UI.products.imageAltEn}</span>
              <input value={form.image_alt_en} onChange={(event) => updateField("image_alt_en", event.target.value)} />
            </label>
            <label className="admin-upload-field">
              <span>{ADMIN_UI.products.uploadImage}</span>
              <input type="file" accept="image/png,image/jpeg" disabled={isUploading} onChange={handleImageUpload} />
            </label>
            <label className="admin-toggle">
              <input type="checkbox" checked={form.is_active} onChange={(event) => updateField("is_active", event.target.checked)} />
              <span>{ADMIN_UI.common.active}</span>
            </label>
          </div>

          <div className="admin-subsection">
            <h3>{ADMIN_UI.products.catalogFilters}</h3>
            <div className="admin-form-grid compact">
              {Object.entries(ADMIN_PRODUCT_FILTERS).map(([key, values]) => (
                <label key={key}>
                  <span>{adminProductFilterLabel(key)}</span>
                  <select value={form[key] || ""} onChange={(event) => updateField(key, event.target.value)}>
                    <option value="">-</option>
                    {values.map((value) => (
                      <option key={value} value={value}>{adminProductFilterValueLabel(key, value)}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="admin-product-preview">
            <img src={form.image_asset_path || FALLBACK_PRODUCT_IMAGE} alt={form.name_uk || form.name_en || ADMIN_UI.common.preview} />
            <div>
              <strong>{form.name_uk || form.name_en || ADMIN_UI.products.previewName}</strong>
              <span>{formatCurrency(Number(form.price || 0), form.currency || "UAH", locale)}</span>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function AdminConstructorPage() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTypeCode, setActiveTypeCode] = useState("ring");
  const [activePendantShape, setActivePendantShape] = useState("heart");
  const [layoutDraft, setLayoutDraft] = useState(null);
  const [selectedStoneValueId, setSelectedStoneValueId] = useState("new");
  const [stoneForm, setStoneForm] = useState(optionValueToForm(""));
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [isSavingStone, setIsSavingStone] = useState(false);

  async function loadConfig() {
    const result = await adminCatalogApi.getConstructorConfig();
    setConfig(result);
    setLayoutDraft(JSON.parse(JSON.stringify(result.layouts || { bases: CONSTRUCTOR_PREVIEW_BASES, positions: CONSTRUCTOR_PREVIEW_SLOT_POSITIONS })));
    const initialType = result.jewelry_types?.[0]?.code || "ring";
    setActiveTypeCode((current) => current || initialType);
  }

  useEffect(() => {
    let active = true;
    loadConfig().catch((err) => {
      if (err.status === 401 || err.status === 403) {
        window.location.href = "/admin/login";
        return;
      }
      if (active) setError(err.message);
    });
    return () => {
      active = false;
    };
  }, []);

  const activeType = config?.jewelry_types?.find((item) => item.code === activeTypeCode) || null;
  const activeOptions = (config?.options || []).filter((item) => item.jewelry_type_id === activeType?.id);
  const stoneOption = activeOptions.find((item) => item.code === "stone") || null;
  const shapeOption = activeOptions.find((item) => item.code === "shape") || null;
  const shapeValues = (config?.values || []).filter((item) => item.design_option_id === shapeOption?.id);
  const stoneValues = (config?.values || []).filter((item) => item.design_option_id === stoneOption?.id);
  const activeLayoutModel = layoutDraft ? getLayoutEditorModel(layoutDraft, activeTypeCode, activePendantShape) : null;
  const activeLayoutPoints = activeTypeCode === "pendant"
    ? { pendant: layoutDraft?.positions?.pendant?.[activePendantShape] }
    : layoutDraft?.positions?.[activeTypeCode] || {};
  const activeBaseAsset = activeLayoutModel?.baseAsset || "";
  const baseAssetSuggestions = activeTypeCode === "pendant"
    ? GENERATED_LAYOUT_BASES.pendant[activePendantShape] || []
    : GENERATED_LAYOUT_BASES[activeTypeCode] || [];
  const adminStoneMediaMap = React.useMemo(
    () => resolveStoneMediaMap((stoneValues || []).map((item) => ({ ...item, asset_url: item.asset_path }))),
    [stoneValues]
  );

  useEffect(() => {
    if (!stoneOption) return;
    if (selectedStoneValueId === "new") {
      setStoneForm(optionValueToForm(stoneOption.id));
      return;
    }
    const selectedValue = stoneValues.find((item) => String(item.id) === String(selectedStoneValueId));
    if (selectedValue) setStoneForm(optionValueRecordToForm(selectedValue));
  }, [selectedStoneValueId, stoneOption, stoneValues]);

  function moveLayoutHandle(slotKey, point) {
    setLayoutDraft((current) => {
      const next = JSON.parse(JSON.stringify(current));
      if (activeTypeCode === "pendant") {
        next.positions.pendant[activePendantShape] = point;
      } else {
        next.positions[activeTypeCode][slotKey] = point;
      }
      return next;
    });
  }

  function updateLayoutCoordinate(slotKey, axis, value) {
    setLayoutDraft((current) => {
      const next = JSON.parse(JSON.stringify(current));
      const safeValue = clampPercent(value);
      if (activeTypeCode === "pendant") {
        next.positions.pendant[activePendantShape][axis] = safeValue;
      } else {
        next.positions[activeTypeCode][slotKey][axis] = safeValue;
      }
      return next;
    });
  }

  function updateBaseAsset(nextAssetPath) {
    setLayoutDraft((current) => updateLayoutBaseAsset(current, activeTypeCode, activePendantShape, nextAssetPath));
  }

  async function saveLayouts() {
    setIsSavingLayout(true);
    setError("");
    setNotice("");
    try {
      const saved = await adminCatalogApi.updateConstructorLayouts(layoutDraft);
      setLayoutDraft(saved);
      setNotice("Layout saved");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSavingLayout(false);
    }
  }

  async function saveStoneValue() {
    if (!stoneOption) return;
    setIsSavingStone(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        ...stoneForm,
        design_option_id: Number(stoneForm.design_option_id || stoneOption.id),
        price_delta: Number(stoneForm.price_delta || 0),
        z_index: Number(stoneForm.z_index || 3)
      };
      const saved = selectedStoneValueId === "new"
        ? await adminCatalogApi.createOptionValue(payload)
        : await adminCatalogApi.updateOptionValue(selectedStoneValueId, payload);
      await loadConfig();
      setSelectedStoneValueId(String(saved.id));
      setNotice(selectedStoneValueId === "new" ? "Stone added" : "Stone updated");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSavingStone(false);
    }
  }

  async function archiveStoneValue() {
    if (selectedStoneValueId === "new") return;
    setIsSavingStone(true);
    setError("");
    try {
      await adminCatalogApi.deactivateOptionValue(selectedStoneValueId);
      await loadConfig();
      setSelectedStoneValueId("new");
      setNotice("Stone archived");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSavingStone(false);
    }
  }

  return (
    <AdminShell title="Constructor" subtitle="Full constructor editor: products, stone library and drag-and-drop slot positioning.">
      {error ? <p className="admin-error">{error}</p> : null}
      {notice ? <p className="admin-success">{notice}</p> : null}
      {!config || !layoutDraft ? <div className="empty-state-react"><h2>Loading constructor config</h2></div> : (
        <div className="admin-editor-grid">
          <aside className="admin-panel admin-sidebar">
            <div className="admin-panel-head">
              <h2>Types</h2>
            </div>
            <div className="admin-list-stack">
              {config.jewelry_types.map((type) => (
                <button
                  type="button"
                  key={type.id}
                  className={`admin-select-row${activeTypeCode === type.code ? " is-active" : ""}`}
                  onClick={() => {
                    setActiveTypeCode(type.code);
                    setSelectedStoneValueId("new");
                  }}
                >
                  <div>
                    <strong>{type.name_en}</strong>
                    <span>{Number(type.base_price).toLocaleString()} UAH</span>
                  </div>
                </button>
              ))}
            </div>
            {activeTypeCode === "pendant" ? (
              <div className="admin-subsection">
                <h3>Pendant shape</h3>
                <div className="admin-chip-row">
                  {shapeValues.map((shape) => (
                    <button
                      type="button"
                      key={shape.id}
                      className={`small-button${activePendantShape === shape.code ? " is-active" : ""}`}
                      onClick={() => setActivePendantShape(shape.code)}
                    >
                      {shape.label_en}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>

          <section className="admin-panel">
            <div className="admin-panel-head">
              <h2>Slot layout</h2>
              <button type="button" className="small-button" disabled={isSavingLayout} onClick={saveLayouts}>
                {isSavingLayout ? "Saving..." : "Save layout"}
              </button>
            </div>
            <p className="admin-help-text">Drag handles directly on the jewelry preview to position stone seats exactly where they should land.</p>
            <div className="admin-subsection">
              <h3>Base preview asset</h3>
              <label>
                <span>Asset path</span>
                <input value={activeBaseAsset} onChange={(event) => updateBaseAsset(event.target.value)} />
              </label>
              <div className="admin-asset-pills">
                {baseAssetSuggestions.map((assetPath) => (
                  <button
                    type="button"
                    key={assetPath}
                    className={`small-button${activeBaseAsset === assetPath ? " is-active" : ""}`}
                    onClick={() => updateBaseAsset(assetPath)}
                  >
                    {assetPath.split("/").pop()}
                  </button>
                ))}
              </div>
            </div>
            <AdminLayoutBoard
              typeCode={activeTypeCode}
              pendantShape={activePendantShape}
              layouts={layoutDraft}
              onMove={moveLayoutHandle}
            />
            <div className="admin-layout-values">
              {Object.entries(activeLayoutPoints).map(([key, point]) => (
                <div className="admin-layout-row" key={key}>
                  <strong>{key}</strong>
                  <div className="admin-layout-inputs">
                    <label>
                      <span>X</span>
                      <input value={point.left} onChange={(event) => updateLayoutCoordinate(key, "left", event.target.value)} />
                    </label>
                    <label>
                      <span>Y</span>
                      <input value={point.top} onChange={(event) => updateLayoutCoordinate(key, "top", event.target.value)} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel wide">
            <div className="admin-panel-head">
              <h2>Stone library</h2>
              <button type="button" className="small-button" onClick={() => setSelectedStoneValueId("new")}>New stone</button>
            </div>
            <div className="admin-constructor-grid">
              <div className="admin-stone-list">
                {(stoneValues || []).map((value) => (
                  <button
                    type="button"
                    key={value.id}
                    className={`admin-stone-row${String(selectedStoneValueId) === String(value.id) ? " is-active" : ""}`}
                    onClick={() => setSelectedStoneValueId(String(value.id))}
                  >
                    <span className="admin-stone-thumb" style={value.code !== "none" ? stoneBackgroundStyle(value.code, "picker", adminStoneMediaMap) : undefined} />
                    <div>
                      <strong>{value.label_en}</strong>
                      <span>{value.code} · {Number(value.price_delta).toLocaleString()} UAH</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="admin-stone-editor">
                <div className="admin-form-grid compact">
                  <label>
                    <span>Code</span>
                    <input value={stoneForm.code} onChange={(event) => setStoneForm((current) => ({ ...current, code: event.target.value }))} />
                  </label>
                  <label>
                    <span>Price delta</span>
                    <input type="number" value={stoneForm.price_delta} onChange={(event) => setStoneForm((current) => ({ ...current, price_delta: event.target.value }))} />
                  </label>
                  <label>
                    <span>Label UK</span>
                    <input value={stoneForm.label_uk} onChange={(event) => setStoneForm((current) => ({ ...current, label_uk: event.target.value }))} />
                  </label>
                  <label>
                    <span>Label EN</span>
                    <input value={stoneForm.label_en} onChange={(event) => setStoneForm((current) => ({ ...current, label_en: event.target.value }))} />
                  </label>
                  <label>
                    <span>Asset path</span>
                    <input value={stoneForm.asset_path} onChange={(event) => setStoneForm((current) => ({ ...current, asset_path: event.target.value }))} />
                  </label>
                  <label>
                    <span>Layer key</span>
                    <input value={stoneForm.layer_key} onChange={(event) => setStoneForm((current) => ({ ...current, layer_key: event.target.value }))} />
                  </label>
                  <label>
                    <span>Z-index</span>
                    <input type="number" value={stoneForm.z_index} onChange={(event) => setStoneForm((current) => ({ ...current, z_index: event.target.value }))} />
                  </label>
                  <label className="admin-toggle">
                    <input type="checkbox" checked={stoneForm.is_active} onChange={(event) => setStoneForm((current) => ({ ...current, is_active: event.target.checked }))} />
                    <span>Active</span>
                  </label>
                </div>
                <div className="admin-subsection">
                  <h3>Generated assets</h3>
                  <div className="admin-asset-grid">
                    {GENERATED_STONE_ASSETS.map((asset) => (
                      <button
                        type="button"
                        key={asset.path}
                        className={`admin-asset-card${stoneForm.asset_path === asset.path ? " is-active" : ""}`}
                        onClick={() => setStoneForm((current) => ({
                          ...current,
                          code: current.code || asset.code,
                          label_en: current.label_en || asset.label,
                          asset_path: asset.path
                        }))}
                      >
                        <span className="admin-stone-thumb" style={asset.code !== "none" ? stoneBackgroundStyle(asset.code, "picker", resolveStoneMediaMap([{ code: asset.code, asset_url: asset.path }])) : undefined} />
                        <strong>{asset.label}</strong>
                        <span>{asset.path.split("/").pop()}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="admin-stone-preview">
                  <span
                    className="admin-stone-thumb large"
                    style={stoneForm.asset_path ? stoneBackgroundStyle(stoneForm.code || "pearl", "picker", resolveStoneMediaMap([{ code: stoneForm.code || "pearl", asset_url: stoneForm.asset_path }])) : undefined}
                  />
                  <div>
                    <strong>{stoneForm.label_en || "Stone preview"}</strong>
                    <span>{stoneForm.asset_path || "Pick an asset from the generated set or paste a custom path."}</span>
                  </div>
                </div>
                <div className="admin-inline-actions">
                  {selectedStoneValueId !== "new" ? (
                    <button type="button" className="small-button button-danger" disabled={isSavingStone} onClick={archiveStoneValue}>
                      Archive
                    </button>
                  ) : null}
                  <button type="button" className="small-button" disabled={isSavingStone} onClick={saveStoneValue}>
                    {isSavingStone ? "Saving..." : "Save stone"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function studioLocalizedName(item, locale) {
  return locale === "en" ? item?.name_en || item?.label_en || item?.name || item?.code : item?.name_uk || item?.label_uk || item?.name || item?.code;
}

function StudioConstructorSlots({ locale, slots, stones, selections, onSelectSlot }) {
  const [activeSlotId, setActiveSlotId] = useState(null);
  const activeSlot = slots.find((slot) => String(slot.id) === String(activeSlotId)) || null;
  const activeStoneCode = activeSlot ? selections?.[activeSlot.code] || "none" : "none";
  const selectedCount = slots.filter((slot) => selections?.[slot.code] && selections?.[slot.code] !== "none").length;

  return (
    <div className="stone-slots-wrap">
      <div className="stone-slots-header">
        <span className="stone-count-badge">{selectedCount}/{slots.length} {locale === "en" ? "slots" : "слотів"}</span>
      </div>
      <div className="slots-row">
        {slots.map((slot) => {
          const selectedStone = stones.find((stone) => stone.code === selections?.[slot.code]) || null;
          const isActive = String(activeSlotId) === String(slot.id);
          return (
            <div className="slot-container" key={slot.id}>
              <button
                type="button"
                className={`stone-slot stone-slot-lg${selectedStone ? " slot-filled" : " slot-empty"}${isActive ? " slot-active" : ""}`}
                onClick={() => setActiveSlotId(isActive ? null : slot.id)}
                  title={locale === "en" ? slot.label_en : slot.label_uk}
                >
                  {selectedStone && selectedStone.code !== "none"
                    ? <span className="constructor-gem constructor-gem-lg has-image" style={previewStoneStyle({ x: 50, y: 50, diameter: 100, scale_x: 1, scale_y: 1 }, selectedStone, "slot")} />
                    : <span className="slot-add-icon">+</span>}
                </button>
              <span className="slot-label">{locale === "en" ? slot.label_en : slot.label_uk}</span>
              {selectedStone && selectedStone.code !== "none" ? <span className="slot-stone-name">{studioLocalizedName(selectedStone, locale)}</span> : null}
            </div>
          );
        })}
      </div>
      {activeSlot ? (
        <div className="stone-picker-panel">
          <p className="stone-picker-title">
            {locale === "en" ? "Choose stone for" : "Оберіть камінь для"} <strong>{locale === "en" ? activeSlot.label_en : activeSlot.label_uk}</strong>
          </p>
          <div className="stone-picker-grid">
            {stones.map((stone) => {
              const isCurrent = stone.code === activeStoneCode;
              return (
                <button
                  type="button"
                  key={stone.id}
                  className={`stone-pick-btn${isCurrent ? " current" : ""}`}
                  onClick={() => {
                    onSelectSlot(activeSlot.code, stone.code);
                    setActiveSlotId(null);
                  }}
                  >
                    <span className={`stone-pick-media${stone.asset_url ? " has-image" : ""}`} style={stone.asset_url ? previewStoneStyle({ x: 50, y: 50, diameter: 100, scale_x: 1, scale_y: 1 }, stone, "picker") : undefined} />
                    <span className="stone-pick-meta">
                      <span className="stone-pick-name">{studioLocalizedName(stone, locale)}</span>
                      <span className="stone-pick-price">{stone.price_delta > 0 ? `+${stone.price_delta}` : stone.price_delta || 0} грн</span>
                    </span>
                    {isCurrent ? <span className="stone-pick-check"><Check aria-hidden="true" size={12} /></span> : null}
                  </button>
                );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function findTypeOptionLabel(options = [], code) {
  if (!code) return "";
  const match = (options || []).find((item) => String(item.code) === String(code));
  return match?.label || match?.name_uk || match?.name_en || "";
}

function stoneSelectionSummary(selections = {}, stonesByCode = {}, locale = "uk-UA") {
  return Object.entries(selections || {})
    .map(([slotCode, stoneCode]) => {
      const stone = stonesByCode?.[stoneCode];
      if (!stone) return null;
      const label = studioLocalizedName(stone, locale === "uk-UA" ? "uk" : "en");
      return { slotCode, label };
    })
    .filter((entry) => entry && entry.label);
}

function resolveOrderPreviewData(item, constructorConfig) {
  const config = item?.configuration || {};
  const variants = constructorConfig?.variants || [];
  let variant = variants.find((entry) => String(entry.id) === String(config.variant_id)) || null;

  if (!variant && item?.jewelry_type_id) {
    const typeVariants = variants.filter((entry) => String(entry.type_id) === String(item.jewelry_type_id));
    const shapeCode = String(config.shape || "").trim().toLowerCase();
    if (shapeCode) {
      variant = typeVariants.find((entry) => {
        const haystack = [entry.code, entry.subtype, entry.group, entry.name_uk, entry.name_en]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(shapeCode);
      }) || null;
    }
    if (!variant) variant = typeVariants[0] || null;
  }

  const slots = variant ? constructorConfig?.slotsByVariant?.[variant.id] || [] : [];
  let selections = { ...(config.stone_slots || {}) };
  if (!Object.keys(selections).length && config.stone && slots.length) {
    const primarySlot = slots.find((slot) => /center|main|stone-1|slot-1|pendant|drop|single/i.test(String(slot.code || ""))) || slots[0];
    if (primarySlot) selections[primarySlot.code] = config.stone;
  }

  return { variant, slots, selections };
}

function CartItemPreview({ item, constructorConfig }) {
  if (item.item_type !== "custom_design") {
    const slug = String(item?.product_slug || "").trim();
    const image =
      (slug ? `/assets/products/${slug}.png` : null) ||
      item.thumbnail_url ||
      REFERENCE_IMAGES.productBySlug[item.product_slug] ||
      FALLBACK_PRODUCT_IMAGE;
    return (
      <div className="cart-item-preview-shell cart-item-preview-ready">
        <img className="cart-ready-image" src={image} alt={item.title || ""} />
      </div>
    );
  }

  const { variant, slots, selections } = resolveOrderPreviewData(item, constructorConfig);
  const stonesByCode = buildStoneCodeMap(constructorConfig?.stones || []);

  return (
    <div className="cart-item-preview-shell">
      <JewelryPreview
        variant={variant}
        slots={slots}
        stonesByCode={stonesByCode}
        selections={selections}
        engraving={item.configuration?.engraving_text || ""}
        materialCode={item.configuration?.material || ""}
      />
    </div>
  );
}

function OrderDetailItemCard({ item, order, locale, t, constructorConfig, typeById, variantsById, stonesByCode }) {
  const type = typeById[String(item.jewelry_type_id)] || null;
  const previewData = resolveOrderPreviewData(item, constructorConfig);
  const variant = previewData.variant || variantsById[String(item.configuration?.variant_id)] || null;
  const selectedStones = stoneSelectionSummary(previewData.selections, stonesByCode, locale);
  const chainDisplay = getPendantChainDisplay(item, locale, typeById);

  return (
    <article className={`order-detail-item-card${item.item_type === "custom_design" ? " is-custom" : ""}`}>
      <div className="order-detail-item-main">
        <div className="order-detail-item-preview-wrap">
          <CartItemPreview item={item} constructorConfig={constructorConfig} />
        </div>
        <div className="order-detail-item-copy">
          <div className="order-detail-item-topline">
            <span className="badge subtle">{item.item_type === "custom_design" ? t("configuredDesign") : t("finishedPiece")}</span>
            {variant ? <span className="order-detail-variant-name">{locale === "uk-UA" ? variant.name_uk || variant.name_en : variant.name_en || variant.name_uk}</span> : null}
          </div>
          <h3>{item.title}</h3>
          <p>{item.item_type === "custom_design" ? t("personalDesign") : t("finishedPiece")}</p>

          {item.item_type === "custom_design" ? (
            <>
              <div className="order-detail-item-meta-grid">
                <div className="order-detail-item-meta">
                  <span>{locale === "uk-UA" ? "Матеріал" : "Material"}</span>
                  <strong>{findTypeOptionLabel(type?.materials, item.configuration?.material) || "-"}</strong>
                </div>
                {type?.size_options?.length ? (
                  <div className="order-detail-item-meta">
                    <span>{locale === "uk-UA" ? "Розмір" : "Size"}</span>
                    <strong>{findTypeOptionLabel(type?.size_options, item.configuration?.size) || "-"}</strong>
                  </div>
                ) : null}
                {chainDisplay ? (
                  <div className="order-detail-item-meta">
                    <span>{locale === "uk-UA" ? "Комплектація" : "Configuration"}</span>
                    <strong>{chainDisplay.text.replace(/^Комплектація:\s|^Configuration:\s/, "")}</strong>
                  </div>
                ) : null}
                {chainDisplay?.surcharge ? (
                  <div className="order-detail-item-meta">
                    <span>{locale === "uk-UA" ? "Доплата за ланцюжок" : "Chain surcharge"}</span>
                    <strong>{formatCurrency(Number(chainDisplay.chain?.price || 0), order.currency, locale)}</strong>
                  </div>
                ) : null}
                {item.configuration?.engraving_text ? (
                  <div className="order-detail-item-meta">
                    <span>{locale === "uk-UA" ? "Гравіювання" : "Engraving"}</span>
                    <strong>{item.configuration.engraving_text}</strong>
                  </div>
                ) : null}
              </div>
              {selectedStones.length ? (
                <div className="order-detail-stones-row">
                  <span>{locale === "uk-UA" ? "Камені" : "Stones"}</span>
                  <div className="order-detail-stones-list">
                    {selectedStones.map((stone) => (
                      <span className="order-detail-stone-chip" key={`${item.id}-${stone.slotCode}`}>
                        {stone.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              {item.configuration?.size || chainDisplay ? (
                <div className="order-detail-item-meta-grid">
                  {item.configuration?.size ? (
                    <div className="order-detail-item-meta">
                      <span>{getReadyProductSizeTitle(item.product_type, locale)}</span>
                      <strong>{getReadyProductSizeLabel(item.product_type, item.configuration.size, locale)}</strong>
                    </div>
                  ) : null}
                  {chainDisplay ? (
                    <div className="order-detail-item-meta">
                      <span>{locale === "uk-UA" ? "Комплектація" : "Configuration"}</span>
                      <strong>{chainDisplay.text.replace(/^Комплектація:\s|^Configuration:\s/, "")}</strong>
                    </div>
                  ) : null}
                  {chainDisplay?.surcharge ? (
                    <div className="order-detail-item-meta">
                      <span>{locale === "uk-UA" ? "Доплата за ланцюжок" : "Chain surcharge"}</span>
                      <strong>{formatCurrency(Number(chainDisplay.chain?.price || 0), order.currency, locale)}</strong>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {item.product_slug ? (
                <a className="text-cta" href={`/products/${item.product_slug}`}>
                  {t("viewPiece")}
                  <ChevronRight aria-hidden="true" />
                </a>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="order-detail-item-side">
        <div className="order-detail-item-qty">
          <span>{t("qty")}</span>
          <strong>x{item.quantity}</strong>
        </div>
        <strong className="order-detail-item-price">{formatCurrency(item.line_total, order.currency, locale)}</strong>
      </div>
    </article>
  );
}

function ConstructorStudioPage() {
  const [config, setConfig] = useState(null);
  const [jewelryTypeId, setJewelryTypeId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [configuration, setConfiguration] = useState({});
  const [calculation, setCalculation] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const { locale, t } = useI18n();
  const copy = referenceCopy(locale);

  useEffect(() => {
    let active = true;
    constructorApi.getConfig()
      .then((data) => {
        if (!active) return;
        setConfig(data);
        setJewelryTypeId(String(data.types?.[0]?.id || ""));
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const types = config?.types || [];
  const variants = config?.variants || [];
  const stones = config?.stones || [];
  const matrix = config?.variantStoneMatrix || [];
  const currentType = types.find((item) => String(item.id) === String(jewelryTypeId)) || null;
  const typeVariants = variants.filter((item) => String(item.type_id) === String(jewelryTypeId));
  const currentVariant = typeVariants.find((item) => String(item.id) === String(variantId)) || typeVariants[0] || null;
  const currentSlots = currentVariant ? (config?.slotsByVariant?.[currentVariant.id] || []) : [];
  const matrixForVariant = currentVariant ? matrix.filter((item) => String(item.variant_id) === String(currentVariant.id) && item.is_enabled !== false) : [];
  const availableStones = matrixForVariant
    .map((entry) => {
      const stone = stones.find((item) => String(item.id) === String(entry.stone_id));
      return stone ? { ...stone, price_delta: entry.price_delta, is_default: entry.is_default } : null;
    })
    .filter(Boolean);
  const stonesByCode = buildStoneCodeMap(availableStones);
  const isPendantType = normalizePendantType(currentType?.code);
  const constructorChainOptions = getPendantChainOptions(locale);
  const selectedConstructorChain = resolveCustomDesignPendantChain(currentType?.code, configuration);

  useEffect(() => {
    if (!currentType) return;
    setConfiguration((current) => {
      const next = { ...current };
      if (!current.variant_id && currentVariant) next.variant_id = currentVariant.id;
      if (!current.material && currentType.materials?.[0]) next.material = currentType.materials.find((item) => item.is_default)?.code || currentType.materials[0].code;
      if (!current.size && currentType.size_options?.length) next.size = currentType.size_options.find((item) => item.is_default)?.code || currentType.size_options[0].code;
      if (!current.stone_slots) next.stone_slots = {};
      return next;
    });
    if (!variantId && currentVariant) setVariantId(String(currentVariant.id));
  }, [currentType, currentVariant, variantId]);

  useEffect(() => {
    if (!currentType || !currentVariant) return undefined;
    let active = true;
    setIsCalculating(true);
    const timer = window.setTimeout(() => {
      constructorApi.calculatePrice({
        jewelry_type_id: Number(currentType.id),
        configuration: { ...configuration, variant_id: Number(currentVariant.id) }
      })
        .then((result) => {
          if (active) setCalculation(result);
        })
        .catch((error) => {
          if (active) setToast(error.message);
        })
        .finally(() => {
          if (active) setIsCalculating(false);
        });
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [currentType, currentVariant, configuration]);

  function updateConfigurationField(key, value) {
    setConfiguration((current) => ({ ...current, [key]: value }));
  }

  function updateSlotSelection(slotCode, stoneCode) {
    setConfiguration((current) => ({
      ...current,
      stone_slots: {
        ...(current.stone_slots || {}),
        [slotCode]: stoneCode
      }
    }));
  }

  async function handleAddDesign() {
    if (!currentType || !currentVariant || !calculation?.is_valid) return;
    setIsAdding(true);
    const payload = {
      item_type: "custom_design",
      jewelry_type_id: Number(currentType.id),
      configuration: { ...configuration, variant_id: Number(currentVariant.id) }
    };
    try {
      const cart = await cartApi.addItem(payload);
      syncCartCount(cart);
      window.location.href = "/cart";
    } catch (error) {
      if (error.status === 401 || error.message.toLowerCase().includes("auth")) {
        addGuestCartItem({
          item_type: "custom_design",
          jewelry_type_id: Number(currentType.id),
          jewelry_type_code: currentType.code,
          title: calculation?.jewelry_type || currentType.name || t("personalDesign"),
          configuration: calculation?.normalized_configuration || { ...configuration, variant_id: Number(currentVariant.id) },
          unit_price: Number(calculation?.price || 0),
          quantity: 1
        });
        window.location.href = "/cart";
        return;
      }
      setToast(error.message);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <>
      <Header />
      <main className="page-main">
        <div className="page-header">
          <div className="section-inner">
            <p className="eyebrow">{copy.constructorEyebrow}</p>
            <h1 className="page-title">{copy.constructorTitle}</h1>
          </div>
        </div>

        {loadError ? (
          <section className="section"><div className="container empty-state-react"><h2>{t("constructorUnavailable")}</h2><p>{loadError}</p></div></section>
        ) : null}

        {!loadError && config ? (
          <div className="section-inner constructor-wrap">
            <div className="constructor-layout">
              <div className="constructor-options">
                <div className="constructor-section">
                  <p className="constructor-label">{t("jewelryType")}</p>
                  <div className="type-grid">
                    {types.map((item) => {
                      const isActive = String(item.id) === String(jewelryTypeId);
                      return (
                        <button key={item.id} className={`type-btn${isActive ? " active" : ""}`} type="button" onClick={() => {
                          setJewelryTypeId(String(item.id));
                          setVariantId("");
                          setConfiguration({ stone_slots: {} });
                        }}>
                          <TypeIcon type={item.code} active={isActive} />
                          <span>{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {typeVariants.length ? (
                  <div className="constructor-section">
                    <div className="constructor-section-head">
                      <p className="constructor-label">{locale === "en" ? "Variant" : "Варіант"}</p>
                    </div>
                    <div className="material-list">
                      {typeVariants.map((variant) => (
                        <button
                          key={variant.id}
                          className={`material-btn material-btn-shape${String(currentVariant?.id) === String(variant.id) ? " active" : ""}`}
                          type="button"
                          onClick={() => {
                            setVariantId(String(variant.id));
                            setConfiguration((current) => ({ ...current, variant_id: Number(variant.id), stone_slots: {} }));
                          }}
                        >
                          <span className="material-name">{variant.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="constructor-section">
                    <div className="admin-cardish studio-empty-block">
                      <h3>{locale === "en" ? "No variants yet" : "Поки немає варіантів"}</h3>
                      <p className="studio-empty-copy">{locale === "en" ? "This jewelry type is empty right now. Add a variant in the admin studio and it will appear here." : "У цього типу прикрас поки немає варіантів. Додай варіант в адмін-студії, і він з’явиться тут."}</p>
                    </div>
                  </div>
                )}

                {currentType?.materials?.length ? (
                  <div className="constructor-section">
                    <div className="constructor-section-head"><p className="constructor-label">{locale === "en" ? "Material" : "Матеріал"}</p><span className="required-badge">{copy.required}</span></div>
                    <div className="material-list">
                      {currentType.materials.map((item) => (
                        <button key={item.code} className={`material-btn${configuration.material === item.code ? " active" : ""}`} type="button" onClick={() => updateConfigurationField("material", item.code)}>
                      <span className="material-swatch" style={{ background: item.tone || "#d7d1c8" }} />
                      <span className="material-name">{item.label}</span>
                      {item.price_delta ? <span className="material-price-delta">{item.price_delta > 0 ? `+${item.price_delta}` : item.price_delta}</span> : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {currentSlots.length ? (
                  <div className="constructor-section">
                    <div className="constructor-section-head"><p className="constructor-label">{locale === "en" ? "Stones" : "Камінь"}</p></div>
                    <StudioConstructorSlots locale={locale} slots={currentSlots} stones={availableStones} selections={configuration.stone_slots || {}} onSelectSlot={updateSlotSelection} />
                  </div>
                ) : null}

                {currentType?.size_options?.length ? (
                  <div className="constructor-section">
                    <div className="constructor-section-head"><p className="constructor-label">{locale === "en" ? "Size" : "Розмір"}</p><span className="required-badge">{copy.required}</span></div>
                    <div className="size-grid">
                      {currentType.size_options.map((item) => (
                        <button key={item.code} className={`size-btn${configuration.size === item.code ? " active" : ""}`} type="button" onClick={() => updateConfigurationField("size", item.code)}>
                          <span className="size-val">{item.label}</span>
                          {item.price_delta ? <span className={`size-price-delta${item.price_delta > 0 ? " pos" : " neg"}`}>{item.price_delta > 0 ? `+${item.price_delta}` : item.price_delta}</span> : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {currentType?.engraving?.enabled ? (
                  <div className="constructor-section">
                    <div className="constructor-section-head"><p className="constructor-label">{locale === "en" ? "Engraving" : "Гравіювання"}</p></div>
                    <div className="field">
                      <input
                        type="text"
                        className="field-input"
                        value={configuration.engraving_text || ""}
                        maxLength={Number(currentType.engraving.max_length || 24)}
                        placeholder={locale === "en" ? currentType.engraving.placeholder_en : currentType.engraving.placeholder_uk}
                        onChange={(event) => updateConfigurationField("engraving_text", event.target.value)}
                      />
                      <span className="field-counter">{String(configuration.engraving_text || "").length}/{currentType.engraving.max_length || 24}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <aside className="constructor-preview-wrap">
                <div className="constructor-preview-sticky">
                  <div className="preview-stage">
                    <p className="constructor-label" style={{ marginBottom: "1.5rem", textAlign: "center" }}>{copy.constructorPreview}</p>
                    <div className="preview-canvas">
                      {currentVariant ? (
                        <JewelryPreview
                          variant={currentVariant}
                          slots={currentSlots}
                          stonesByCode={stonesByCode}
                          selections={configuration.stone_slots || {}}
                          engraving={configuration.engraving_text || ""}
                          materialCode={configuration.material || ""}
                        />
                      ) : (
                        <div className="admin-cardish studio-empty-block">
                          <h3>{locale === "en" ? "Empty preview" : "Порожній перегляд"}</h3>
                          <p className="studio-empty-copy">{locale === "en" ? "There is no variant to preview for this type yet." : "Для цього типу ще немає варіанту для перегляду."}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="summary-card">
                    <div className="summary-row">
                      <span className="summary-label">{t("currentPrice")}</span>
                      <span className="summary-price">{formatCurrency(calculation?.price ?? currentType?.base_price ?? 0, calculation?.currency || "UAH", LOCALE_FORMATS[locale])}</span>
                    </div>
                    <div className="summary-breakdown"><span>{isCalculating ? t("calculating") : t("validated")}</span><span>{currentVariant?.name || currentType?.name || t("piece")}</span></div>
                    <div className="summary-breakdown"><span>{locale === "en" ? "Material" : "Матеріал"}</span><span>{currentType?.materials?.find((item) => item.code === normalizeLegacyConstructorMaterialCode(configuration.material))?.label || "-"}</span></div>
                    {currentType?.size_options?.length ? <div className="summary-breakdown"><span>{locale === "en" ? "Size" : "Розмір"}</span><span>{currentType?.size_options?.find((item) => item.code === configuration.size)?.label || "-"}</span></div> : null}
                    {isPendantType ? (
                      <>
                        <div className="summary-divider" />
                        <div className="product-sizes" style={{ marginTop: "0.5rem" }}>
                          <p className="product-attr-label" style={{ marginBottom: "0.75rem" }}>{locale === "uk" ? "Комплектація" : "Configuration"}</p>
                          <p className="product-desc-text" style={{ marginBottom: "1rem" }}>{getPendantChainUpsellNote(locale)}</p>
                          <div className="size-grid">
                            {constructorChainOptions.map((option) => (
                              <button
                                key={option.code}
                                className={`size-btn${extractPendantChainOption(configuration) === option.code ? " active" : ""}`}
                                type="button"
                                onClick={() => updateConfigurationField("chainOption", option.code)}
                              >
                                <span className="size-val">{option.label}</span>
                              </button>
                            ))}
                          </div>
                          <div className="summary-breakdown" style={{ marginTop: "1rem" }}>
                            <span>{getPendantChainColorNote(selectedConstructorChain?.metal, locale)}</span>
                            <span>{selectedConstructorChain?.price ? formatCurrency(selectedConstructorChain.price, "UAH", LOCALE_FORMATS[locale]) : locale === "uk" ? "0 грн" : "0 UAH"}</span>
                          </div>
                        </div>
                      </>
                    ) : null}
                    {!calculation?.is_valid ? <div className="summary-warning">{(calculation?.missing_required || []).join(", ")}</div> : null}
                    <button className="button constructor-add-btn" type="button" disabled={!calculation?.is_valid || isAdding} onClick={handleAddDesign}>
                      {isAdding ? t("adding") : t("addToCart")}
                    </button>
                    <div className="constructor-trust"><span>{copy.constructorTrustLeft}</span><span>{copy.constructorTrustRight}</span></div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
      {toast ? <div className="toast-message">{toast}</div> : null}
    </>
  );
}

function StudioSlotCanvasEditor({ variant, slots, stones, previewSelections, selectedSlotId, onSelectSlot, onMoveSlot, onResizeSlot, onInteractionEnd }) {
  const boardRef = React.useRef(null);
  const [dragState, setDragState] = useState(null);

  useEffect(() => {
    if (!dragState) return undefined;
    function handleMove(event) {
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      if (dragState.mode === "move") {
        const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
        onMoveSlot(dragState.slotId, { x, y });
        return;
      }
        if (dragState.mode === "resize") {
          const deltaX = (event.clientX - dragState.startClientX) / rect.width;
          const deltaY = (event.clientY - dragState.startClientY) / rect.height;
          const nextScaleX = Math.max(0.35, Math.min(3, dragState.startScaleX + deltaX * 3));
          const nextScaleY = Math.max(0.35, Math.min(3, dragState.startScaleY + deltaY * 3));
          onResizeSlot(dragState.slotId, {
            scale_x: Number(nextScaleX.toFixed(2)),
            scale_y: Number(nextScaleY.toFixed(2))
          });
        }
    }
    function handleUp() {
      if (dragState?.slotId) {
        onInteractionEnd?.(dragState.slotId);
      }
      setDragState(null);
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragState, onMoveSlot, onResizeSlot, onInteractionEnd]);

  return (
    <div className="studio-editor-square" ref={boardRef}>
      {variant?.base_asset_url ? <img className="studio-editor-base" src={variant.base_asset_url} alt="" aria-hidden="true" /> : null}
      {slots.map((slot) => {
        const stone = stones[previewSelections?.[slot.code]];
        return (
          <button
            type="button"
            key={slot.id}
            className={`studio-editor-slot${String(selectedSlotId) === String(slot.id) ? " is-active" : ""}${slot.layer_mode === "below" ? " is-below" : " is-above"}`}
            style={previewStoneStyle(slot, stone || null)}
            onClick={() => onSelectSlot(slot.id)}
            onMouseDown={() => {
              onSelectSlot(slot.id);
              setDragState({ mode: "move", slotId: slot.id });
            }}
            title={slot.code}
          >
            <span>{slot.code}</span>
            <button
              type="button"
              className="studio-slot-scale-handle"
              aria-label={`Resize ${slot.code}`}
              onMouseDown={(event) => {
                event.stopPropagation();
                onSelectSlot(slot.id);
                setDragState({
                  mode: "resize",
                  slotId: slot.id,
                  startClientX: event.clientX,
                  startClientY: event.clientY,
                    startScaleX: Number(slot.scale_x || 1),
                    startScaleY: Number(slot.scale_y || 1)
                  });
                }}
              >
              ↘
            </button>
          </button>
        );
      })}
    </div>
  );
}

function createStudioSlotDraft(variantId, order = 1) {
  return {
    variant_id: Number(variantId),
    code: `slot-${order}`,
    label_uk: `Камінь ${order}`,
    label_en: `Stone ${order}`,
    sort_order: order,
    x: 50,
    y: 50,
    scale_x: 1,
    scale_y: 1,
    diameter: 12,
    layer_mode: "above",
    is_active: true
  };
}

function createStudioTypeDraft(order = 1) {
  return {
    code: "",
    name_uk: "",
    name_en: "",
    base_price: 0,
    is_active: true,
    sort_order: order,
    materials: [createStudioMaterialDraft(1)],
    size_options: [],
    engraving: {
      enabled: false,
      max_length: 24,
      price_delta: 0,
      placeholder_uk: "",
      placeholder_en: ""
    }
  };
}

function createStudioVariantDraft(typeId, order = 1) {
  return {
    type_id: Number(typeId) || 0,
    code: "",
    name_uk: "",
    name_en: "",
    group: "",
    subtype: "",
    price_delta: 0,
    base_asset_id: null,
    is_active: true,
    sort_order: order
  };
}

function createStudioMaterialDraft(order = 1) {
  return {
    code: `material-${order}`,
    name_uk: `Матеріал ${order}`,
    name_en: `Material ${order}`,
    price_delta: 0,
    tone: "",
    is_active: true,
    sort_order: order
  };
}

function createStudioSizeDraft(order = 1) {
  return {
    code: `size-${order}`,
    label_uk: `Розмір ${order}`,
    label_en: `Size ${order}`,
    price_delta: 0,
    is_default: order === 1,
    is_active: true,
    sort_order: order
  };
}

function StudioAdminConstructorPage() {
  const [studio, setStudio] = useState(null);
  const [section, setSection] = useState("home");
  const [jewelryStep, setJewelryStep] = useState("types");
  const [editorSubview, setEditorSubview] = useState("slots");
  const [stoneStep, setStoneStep] = useState("list");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [selectedStoneId, setSelectedStoneId] = useState("");
  const [selectedAssetKind, setSelectedAssetKind] = useState("jewelry-base");
  const [previewSelections, setPreviewSelections] = useState({});
  const [typeForm, setTypeForm] = useState(null);
  const [variantForm, setVariantForm] = useState(null);
  const [slotForm, setSlotForm] = useState(null);
  const [stoneForm2, setStoneForm2] = useState(null);
  const [assetUploadState, setAssetUploadState] = useState({ label: "", kind: "jewelry-base", tags: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  function getSafeStudioSelection(data, preferred = {}) {
    const allTypes = data.types || [];
    const allVariants = data.variants || [];
    const allSlots = data.slots || [];
    const allStones = data.stones || [];

    const preferredType = String(preferred.selectedTypeId ?? selectedTypeId ?? "");
    const nextType = allTypes.find((item) => String(item.id) === preferredType) || allTypes[0] || null;
    const nextTypeId = nextType ? String(nextType.id) : "";

    const nextVariants = allVariants.filter((item) => String(item.type_id) === nextTypeId);
    const preferredVariant = String(preferred.selectedVariantId ?? selectedVariantId ?? "");
    const nextVariant = nextVariants.find((item) => String(item.id) === preferredVariant) || nextVariants[0] || null;
    const nextVariantId = nextVariant ? String(nextVariant.id) : "";

    const nextSlots = nextVariant ? allSlots.filter((item) => String(item.variant_id) === nextVariantId && item.is_active !== false) : [];
    const preferredSlot = String(preferred.selectedSlotId ?? selectedSlotId ?? "");
    const nextSlot = nextSlots.find((item) => String(item.id) === preferredSlot) || nextSlots[0] || null;

    const preferredStone = String(preferred.selectedStoneId ?? selectedStoneId ?? "");
    const nextStone = allStones.find((item) => String(item.id) === preferredStone) || allStones[0] || null;

    return {
      nextTypeId,
      nextVariantId,
      nextSlotId: nextSlot ? String(nextSlot.id) : "",
      nextStoneId: nextStone ? String(nextStone.id) : ""
    };
  }

  async function loadStudio(preferred = {}) {
    const data = await adminCatalogApi.getConstructorConfig();
    const selection = getSafeStudioSelection(data, preferred);
    setStudio(data);
    setSelectedTypeId(selection.nextTypeId);
    setSelectedVariantId(selection.nextVariantId);
    setSelectedSlotId(selection.nextSlotId);
    setSelectedStoneId(selection.nextStoneId);
  }

  useEffect(() => {
    let active = true;
    loadStudio().catch((err) => {
      if (err.status === 401 || err.status === 403) {
        window.location.href = "/admin/login";
        return;
      }
      if (active) setError(err.message);
    });
    return () => {
      active = false;
    };
  }, []);

  const types = studio?.types || [];
  const assets = studio?.assets || [];
  const allSlots = studio?.slots || [];
  const allStones = studio?.stones || [];
  const allMatrix = studio?.variant_stones || [];
  const currentTypeAdmin = types.find((item) => String(item.id) === String(selectedTypeId)) || null;
  const variants = (studio?.variants || []).filter((item) => String(item.type_id) === String(selectedTypeId));
  const currentVariantAdmin = variants.find((item) => String(item.id) === String(selectedVariantId)) || null;
  const currentSlotsAdmin = currentVariantAdmin ? allSlots.filter((item) => String(item.variant_id) === String(currentVariantAdmin.id) && item.is_active !== false) : [];
  const currentSlotAdmin = currentSlotsAdmin.find((item) => String(item.id) === String(selectedSlotId)) || currentSlotsAdmin[0] || null;
  const editableSlotsAdmin = currentSlotsAdmin.map((slot) => (
    slotForm?.id && String(slot.id) === String(slotForm.id) ? { ...slot, ...slotForm } : slot
  ));
  const slotDraftDirty = Boolean(slotForm && (!slotForm.id || (currentSlotAdmin && [
    "code",
    "label_uk",
    "label_en",
    "sort_order",
    "x",
    "y",
    "scale_x",
    "scale_y",
    "diameter",
    "layer_mode"
  ].some((key) => String(slotForm[key] ?? "") !== String(currentSlotAdmin[key] ?? "")))));
  const currentVariantMatrix = currentVariantAdmin ? allMatrix.filter((item) => String(item.variant_id) === String(currentVariantAdmin.id)) : [];
  const assetsById = Object.fromEntries(assets.map((asset) => [asset.id, asset]));
  const stonesDecorated = allStones.map((stone) => ({
    ...stone,
    asset_url: stone.asset_id ? assetsById[stone.asset_id]?.path || null : null
  }));
  const currentStoneAdmin = stonesDecorated.find((item) => String(item.id) === String(selectedStoneId)) || null;
  const stonesByCodeAdmin = Object.fromEntries(stonesDecorated.map((stone) => [stone.code, stone]));
  const availableVariantStones = stonesDecorated.filter((stone) => currentVariantMatrix.some((item) => String(item.stone_id) === String(stone.id) && item.is_enabled !== false));
  const selectedPreviewStoneCode = (slotForm?.code ? previewSelections[slotForm.code] : currentSlotAdmin?.code ? previewSelections[currentSlotAdmin.code] : null) || "none";

  function selectSlotDraft(slotId) {
    const nextSlot = currentSlotsAdmin.find((item) => String(item.id) === String(slotId)) || null;
    setSelectedSlotId(String(slotId));
    if (nextSlot) {
      setSlotForm(JSON.parse(JSON.stringify(nextSlot)));
    }
  }

  useEffect(() => {
    if (currentTypeAdmin && selectedTypeId && selectedTypeId !== "new") {
      setTypeForm(JSON.parse(JSON.stringify(currentTypeAdmin)));
    }
  }, [selectedTypeId, studio]);

  useEffect(() => {
    if (currentVariantAdmin && selectedVariantId && selectedVariantId !== "new") {
      setVariantForm(JSON.parse(JSON.stringify(currentVariantAdmin)));
    }
  }, [selectedTypeId, selectedVariantId, studio]);

  useEffect(() => {
    if (currentSlotAdmin) {
      setSelectedSlotId(String(currentSlotAdmin.id));
      setSlotForm(JSON.parse(JSON.stringify(currentSlotAdmin)));
    } else if (currentVariantAdmin) {
      setSlotForm(createStudioSlotDraft(currentVariantAdmin.id, currentSlotsAdmin.length + 1));
    }
  }, [selectedVariantId, studio]);

  useEffect(() => {
    if (currentStoneAdmin && selectedStoneId && selectedStoneId !== "new") {
      setStoneForm2(JSON.parse(JSON.stringify(currentStoneAdmin)));
    }
  }, [selectedStoneId, studio]);

  useEffect(() => {
    if (!currentVariantAdmin) return;
    const defaults = {};
    const defaultEntry = currentVariantMatrix.find((item) => item.is_default);
    currentSlotsAdmin.forEach((slot) => {
      if (!defaultEntry) return;
      const stone = stonesDecorated.find((item) => String(item.id) === String(defaultEntry.stone_id));
      if (stone) defaults[slot.code] = stone.code;
    });
    setPreviewSelections(defaults);
  }, [selectedVariantId, studio]);

  useEffect(() => {
    setPendingDelete(null);
  }, [selectedTypeId, selectedVariantId, selectedStoneId, jewelryStep, stoneStep, section]);

  function variantBaseAssetUrl(variant) {
    return variant?.base_asset_id ? assetsById[variant.base_asset_id]?.path || null : null;
  }

  function variantAdminPreviewCandidates(variant, preferredMaterials = ["gold", "silver", "rose_gold"]) {
    if (!variant) return [];
    const previewVariant = { ...variant, base_asset_url: variantBaseAssetUrl(variant) };
    return [
      ...new Set(
        preferredMaterials.flatMap((materialCode) => buildMaterialAwareBaseAssetCandidates(previewVariant, materialCode))
      )
    ];
  }

  function variantAdminPreviewAssetUrl(variant, preferredMaterials = ["gold", "silver", "rose_gold"]) {
    return variantAdminPreviewCandidates(variant, preferredMaterials)[0] || variantBaseAssetUrl(variant);
  }

  const currentVariantPreview = currentVariantAdmin ? { ...currentVariantAdmin, base_asset_url: variantBaseAssetUrl(currentVariantAdmin) } : null;

  async function saveType() {
    if (!typeForm) return;
    setIsSaving(true);
    setError("");
    try {
      const saved = typeForm.id
        ? await adminCatalogApi.updateType(typeForm.id, typeForm)
        : await adminCatalogApi.createType(typeForm);
      await loadStudio({ selectedTypeId: saved.id });
      setSelectedTypeId(String(saved.id));
      setJewelryStep("variants");
      setNotice("Тип збережено");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function saveVariant() {
    if (!variantForm) return;
    setIsSaving(true);
    setError("");
    try {
      const payload = { ...variantForm, type_id: Number(selectedTypeId) };
      const saved = variantForm.id
        ? await adminCatalogApi.updateVariant(variantForm.id, payload)
        : await adminCatalogApi.createVariant(payload);
      await loadStudio({ selectedTypeId: selectedTypeId, selectedVariantId: saved.id });
      setSelectedVariantId(String(saved.id));
      setJewelryStep("editor");
      setNotice("Варіант збережено");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function saveSlot() {
    if (!slotForm || !currentVariantAdmin) return;
    setIsSaving(true);
    setError("");
    try {
      const payload = { ...slotForm, variant_id: Number(currentVariantAdmin.id) };
      const saved = slotForm.id
        ? await adminCatalogApi.updateSlot(slotForm.id, payload)
        : await adminCatalogApi.createSlot(payload);
      await loadStudio({ selectedTypeId, selectedVariantId, selectedSlotId: saved.id });
      setSelectedSlotId(String(saved.id));
      setNotice("Слот збережено");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function commitSlotIfDirty(slotId) {
    if (!slotForm?.id) return;
    if (String(slotForm.id) !== String(slotId)) return;
    if (!slotDraftDirty) return;
    await saveSlot();
  }

  async function deleteSlotAdmin() {
    if (!currentSlotAdmin?.id) return;
    setIsSaving(true);
    setError("");
    try {
      await adminCatalogApi.deactivateSlot(currentSlotAdmin.id);
      await loadStudio({ selectedTypeId, selectedVariantId, selectedSlotId: "" });
      setNotice("Слот видалено");
      setSelectedSlotId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function duplicateCurrentSlot() {
    if (!currentSlotAdmin || !currentVariantAdmin) return;
    setIsSaving(true);
    setError("");
    try {
      await adminCatalogApi.createSlot({
        ...currentSlotAdmin,
        id: undefined,
        variant_id: Number(currentVariantAdmin.id),
        code: currentSlotAdmin.code + "-copy",
        label_uk: (currentSlotAdmin.label_uk || currentSlotAdmin.code) + " копія",
        label_en: (currentSlotAdmin.label_en || currentSlotAdmin.code) + " copy",
        sort_order: currentSlotsAdmin.length + 1,
        x: Math.min(95, Number(currentSlotAdmin.x || 50) + 4),
        y: Math.min(95, Number(currentSlotAdmin.y || 50) + 4)
      });
      await loadStudio();
      setNotice("Слот дубльовано");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function saveStone() {
    if (!stoneForm2) return;
    setIsSaving(true);
    setError("");
    try {
      const saved = stoneForm2.id
        ? await adminCatalogApi.updateStone(stoneForm2.id, stoneForm2)
        : await adminCatalogApi.createStone(stoneForm2);
      await loadStudio({ selectedStoneId: saved.id, selectedTypeId, selectedVariantId });
      setSelectedStoneId(String(saved.id));
      setNotice("Камінь збережено");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteStoneAdmin() {
    if (!stoneForm2?.id) return;
    setIsSaving(true);
    setError("");
    try {
      await adminCatalogApi.deactivateStone(stoneForm2.id);
      await loadStudio({ selectedStoneId: "", selectedTypeId, selectedVariantId });
      setNotice("Камінь видалено");
      setSelectedStoneId("");
      setStoneStep("list");
      setPendingDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAssetUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await adminCatalogApi.uploadAsset({
        file_name: file.name,
        kind: assetUploadState.kind,
        label: assetUploadState.label || file.name.replace(/.[^.]+$/, ""),
        tags: assetUploadState.tags.split(",").map((item) => item.trim()).filter(Boolean),
        data_url: dataUrl
      });
      await loadStudio();
      setNotice("Асет завантажено");
      event.target.value = "";
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteAssetAdmin(asset) {
    if (!asset?.id) return;
    setIsSaving(true);
    setError("");
    try {
      await adminCatalogApi.deleteAsset(asset.id);
      await loadStudio({ selectedTypeId, selectedVariantId, selectedStoneId });
      setPendingDelete(null);
      setNotice("Асет видалено");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function setVariantStone(entry, patch) {
    if (!currentVariantAdmin) return;
    try {
      await adminCatalogApi.upsertVariantStone({ ...entry, ...patch, variant_id: currentVariantAdmin.id, stone_id: entry.stone_id });
      await loadStudio();
    } catch (err) {
      setError(err.message);
    }
  }

  function startNewSlot() {
    if (!currentVariantAdmin) return;
    setSelectedSlotId("");
    setSlotForm(createStudioSlotDraft(currentVariantAdmin.id, currentSlotsAdmin.length + 1));
  }

  function startNewType() {
    setSelectedTypeId("new");
    setSelectedVariantId("");
    setTypeForm(createStudioTypeDraft(types.length + 1));
    setVariantForm(null);
    setJewelryStep("editor");
    setEditorSubview("basic");
  }

  function startNewVariant() {
    if (!selectedTypeId) return;
    setSelectedVariantId("new");
    setVariantForm(createStudioVariantDraft(selectedTypeId, variants.length + 1));
    setJewelryStep("editor");
    setEditorSubview("basic");
  }

  function startNewStone() {
    setSelectedStoneId("new");
    setStoneForm2({
      code: "",
      name_uk: "",
      name_en: "",
      asset_id: null,
      default_scale_x: 1,
      default_scale_y: 1,
      default_layer_mode: "above",
      is_active: true,
      sort_order: allStones.length + 1
    });
    setStoneStep("editor");
  }

  async function deleteVariantAdmin() {
    if (!currentVariantAdmin?.id) return;
    setIsSaving(true);
    setError("");
    try {
      await adminCatalogApi.deactivateVariant(currentVariantAdmin.id);
      await loadStudio({ selectedTypeId, selectedVariantId: "", selectedSlotId: "" });
      setJewelryStep("variants");
      setEditorSubview("basic");
      setNotice("Варіант видалено");
      setPendingDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteTypeAdmin() {
    if (!currentTypeAdmin?.id) return;
    setIsSaving(true);
    setError("");
    try {
      await adminCatalogApi.deactivateType(currentTypeAdmin.id);
      await loadStudio({ selectedTypeId: "", selectedVariantId: "", selectedSlotId: "" });
      setJewelryStep("types");
      setEditorSubview("basic");
      setNotice("Тип видалено");
      setPendingDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  function requestDelete(kind, id) {
    setPendingDelete({ kind, id: String(id) });
  }

  function cancelDelete() {
    setPendingDelete(null);
  }

  function isDeletePending(kind, id) {
    return pendingDelete?.kind === kind && String(pendingDelete?.id) === String(id);
  }

  function updateSelectedSlotPreview(stoneCode) {
    const targetCode = slotForm?.code || currentSlotAdmin?.code;
    if (!targetCode) return;
    setPreviewSelections((current) => ({ ...current, [targetCode]: stoneCode }));
  }

  function openSection(nextSection) {
    setSection(nextSection);
    if (nextSection === "jewelry") {
      setJewelryStep("types");
      setEditorSubview("slots");
    }
    if (nextSection === "stones") {
      setStoneStep("list");
    }
  }

  function openType(typeId) {
    setSelectedTypeId(String(typeId));
    const nextVariantId = (studio?.variants || []).find((item) => String(item.type_id) === String(typeId))?.id || "";
    setSelectedVariantId(String(nextVariantId));
    setJewelryStep("variants");
  }

  function openVariant(variantId) {
    setSelectedVariantId(String(variantId));
    setJewelryStep("editor");
    setEditorSubview("slots");
  }

  function openStoneEditor(stoneId) {
    setSelectedStoneId(String(stoneId));
    setStoneStep("editor");
  }

  const workspaceSections = [
    { key: "jewelry", label: "Прикраси", description: "Форми, варіанти, слоти й попередній перегляд." },
    { key: "stones", label: "Камені", description: "Повна бібліотека всіх доступних каменів." },
    { key: "assets", label: "Асети", description: "База зображень прикрас, каменів і вітрини." },
    { key: "pricing", label: "Ціни", description: "Доступність каменів і ціни за варіантами." }
  ];

  const jewelryTypes = [
    ["ring", "Каблучки"],
    ["bracelet", "Браслети"],
    ["pendant", "Підвіски"],
    ["earrings", "Сережки"]
  ];
  const selectedTypeCard = jewelryTypes.find(([code]) => code === currentTypeAdmin?.code);
  const currentStoneUsage = stoneForm2?.id ? allMatrix.filter((item) => String(item.stone_id) === String(stoneForm2.id) && item.is_enabled !== false) : [];

  function updateTypeField(key, value) {
    setTypeForm((current) => ({ ...(current || {}), [key]: value }));
  }

  function updateTypeMaterial(index, key, value) {
    setTypeForm((current) => ({
      ...(current || {}),
      materials: (current?.materials || []).map((item, itemIndex) => (
        itemIndex === index ? { ...item, [key]: value } : item
      ))
    }));
  }

  function addTypeMaterial() {
    setTypeForm((current) => ({
      ...(current || {}),
      materials: [...(current?.materials || []), createStudioMaterialDraft((current?.materials || []).length + 1)]
    }));
  }

  function removeTypeMaterial(index) {
    setTypeForm((current) => ({
      ...(current || {}),
      materials: (current?.materials || []).filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function updateTypeSize(index, key, value) {
    setTypeForm((current) => {
      const nextSizes = (current?.size_options || []).map((item, itemIndex) => (
        itemIndex === index ? { ...item, [key]: value } : item
      ));
      return {
        ...(current || {}),
        size_options: key === "is_default" && value
          ? nextSizes.map((item, itemIndex) => ({ ...item, is_default: itemIndex === index }))
          : nextSizes
      };
    });
  }

  function addTypeSize() {
    setTypeForm((current) => ({
      ...(current || {}),
      size_options: [...(current?.size_options || []), createStudioSizeDraft((current?.size_options || []).length + 1)]
    }));
  }

  function removeTypeSize(index) {
    setTypeForm((current) => ({
      ...(current || {}),
      size_options: (current?.size_options || []).filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function updateEngravingField(key, value) {
    setTypeForm((current) => ({
      ...(current || {}),
      engraving: {
        ...(current?.engraving || {}),
        [key]: value
      }
    }));
  }

  const breadcrumb = ["Конструктор"];
  if (section === "jewelry") {
    breadcrumb.push("Прикраси");
    if (jewelryStep !== "types" && currentTypeAdmin) breadcrumb.push(selectedTypeCard?.[1] || currentTypeAdmin.name_uk || currentTypeAdmin.name_en);
    if (jewelryStep === "editor" && currentVariantAdmin) breadcrumb.push(adminLocalizedEntry(currentVariantAdmin.name_uk, currentVariantAdmin.name_en, currentVariantAdmin.code));
  } else if (section === "stones") {
    breadcrumb.push("Камені");
    if (stoneStep === "editor" && stoneForm2) breadcrumb.push(adminLocalizedEntry(stoneForm2.name_uk, stoneForm2.name_en, stoneForm2.code || "Новий камінь"));
  } else if (section === "assets") {
    breadcrumb.push("Асети");
  } else if (section === "pricing") {
    breadcrumb.push("Ціни");
  }

  function renderPricingMatrix(currentVariant, stonesList, matrix, onUpdate, onOpenStones, onOpenPricing) {
    if (!currentVariant) return null;
    return (
      <>
        <div className="admin-panel-head">
          <div>
            <h2>Дозволені камені</h2>
            <p className="admin-panel-copy">Які камені доступні для цього варіанта і скільки коштує кожен.</p>
          </div>
          <div className="admin-chip-row">
            <button type="button" className="small-button button-secondary-strong" onClick={onOpenStones}>Відкрити бібліотеку каменів</button>
            <button type="button" className="small-button button-secondary-strong" onClick={onOpenPricing}>Перейти до розділу цін</button>
          </div>
        </div>
        <div className="admin-list-stack">
          {stonesList.map((stone) => {
            const entry = matrix.find((item) => String(item.stone_id) === String(stone.id)) || {
              variant_id: currentVariant.id,
              stone_id: stone.id,
              price_delta: 0,
              is_default: false,
              is_enabled: false,
              sort_order: stone.sort_order || stone.id
            };
            return (
              <div className="admin-layout-row" key={"matrix-" + stone.id}>
                <div className="admin-stone-row is-active" style={{ gridTemplateColumns: "56px 1fr", border: 0, padding: 0, background: "transparent" }}>
                  <span className="admin-stone-thumb" style={stone.asset_url ? { backgroundImage: 'url(' + stone.asset_url + ')', backgroundSize: "90%", backgroundPosition: "center center", backgroundRepeat: "no-repeat" } : undefined} />
                  <div><strong>{adminLocalizedEntry(stone.name_uk, stone.name_en, stone.code)}</strong><span>{stone.code}</span></div>
                </div>
                <div className="admin-layout-inputs">
                  <label><span>Увімкнено</span><input type="checkbox" checked={entry.is_enabled} onChange={(e) => onUpdate(entry, { is_enabled: e.target.checked })} /></label>
                  <label><span>За замовчуванням</span><input type="checkbox" checked={entry.is_default} onChange={(e) => onUpdate(entry, { is_default: e.target.checked, is_enabled: true })} /></label>
                  <label><span>Ціна</span><input type="number" value={entry.price_delta} onChange={(e) => onUpdate(entry, { price_delta: Number(e.target.value), is_enabled: true })} /></label>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  function renderHome() {
    return (
      <section className="studio-home-grid">
        {workspaceSections.map((item) => (
          <button key={item.key} type="button" className="studio-home-card" onClick={() => openSection(item.key)}>
            <span className="studio-kicker">Робочий простір</span>
            <strong>{item.label}</strong>
            <p>{item.description}</p>
          </button>
        ))}
      </section>
    );
  }

  function renderJewelryTypeStep() {
    return (
      <>
        <div className="admin-panel-head">
          <div>
            <h2>Типи прикрас</h2>
            <p className="admin-panel-copy">Оберіть тип, щоб керувати його варіантами, параметрами й порожніми станами каталогу.</p>
          </div>
          <div className="admin-chip-row">
            <button type="button" className="small-button is-active" onClick={startNewType}>Створити тип</button>
          </div>
        </div>
        {types.length ? (
          <section className="studio-home-grid">
            {types.map((type) => (
              <button key={type.id} type="button" className="studio-home-card" onClick={() => openType(type.id)}>
                <span className="studio-kicker">Тип прикраси</span>
                <strong>{jewelryTypes.find(([code]) => code === type.code)?.[1] || type.name_uk || type.name_en}</strong>
                <p>{(studio?.variants || []).filter((item) => String(item.type_id) === String(type.id)).length} варіантів</p>
              </button>
            ))}
          </section>
        ) : (
          <div className="admin-cardish studio-empty-block">
            <h3>Каталог поки порожній</h3>
            <p className="studio-empty-copy">Створіть перший тип прикраси, і ми одразу відкриємо для нього редактор варіантів та параметрів.</p>
          </div>
        )}
      </>
    );
  }

  function renderJewelryVariantStep() {
    return (
      <>
        <div className="admin-panel-head">
          <div>
            <h2>{selectedTypeCard?.[1] || currentTypeAdmin?.name_uk || "Тип прикраси"}</h2>
            <p className="admin-panel-copy">Додавайте нові варіанти всередині типу й налаштовуйте параметри типу окремо від візуальних варіантів.</p>
          </div>
          <div className="admin-chip-row">
            <button type="button" className="small-button button-secondary-strong" onClick={() => setJewelryStep("types")}>Назад до типів</button>
            <button type="button" className="small-button button-secondary-strong" disabled={!currentTypeAdmin} onClick={() => {
              setJewelryStep("editor");
              setEditorSubview("basic");
            }}>Параметри типу</button>
            <button type="button" className="small-button is-active" disabled={!currentTypeAdmin} onClick={startNewVariant}>Створити варіант</button>
            {isDeletePending("type", currentTypeAdmin?.id) ? (
              <>
                <button type="button" className="small-button button-danger is-confirm" disabled={isSaving} onClick={deleteTypeAdmin}>Підтвердити видалення</button>
                <button type="button" className="small-button button-secondary-strong" disabled={isSaving} onClick={cancelDelete}>Скасувати</button>
              </>
            ) : (
              <button type="button" className="small-button button-danger" disabled={!currentTypeAdmin || isSaving} onClick={() => requestDelete("type", currentTypeAdmin?.id)}>Видалити тип</button>
            )}
          </div>
        </div>
        {variants.length ? (
          <section className="studio-variant-grid">
            {variants.map((variant) => {
              const slotCount = allSlots.filter((slot) => String(slot.variant_id) === String(variant.id) && slot.is_active !== false).length;
              const assetPath = variantAdminPreviewAssetUrl(variant);
              const assetCandidates = variantAdminPreviewCandidates(variant);
              const previewVariant = { ...variant, base_asset_url: variantBaseAssetUrl(variant) };
              return (
                <button key={variant.id} type="button" className="studio-variant-card" onClick={() => openVariant(variant.id)}>
                  <div className="studio-variant-art">
                    {assetPath ? (
                      <JewelryPreview
                        variant={previewVariant}
                        slots={[]}
                        stonesByCode={{}}
                        selections={{}}
                        engraving=""
                        baseAssetCandidates={assetCandidates}
                      />
                    ) : (
                      <span>Немає асета</span>
                    )}
                  </div>
                  <div className="studio-variant-copy">
                    <span className="studio-kicker">{selectedTypeCard?.[1] || currentTypeAdmin?.name_uk}</span>
                    <strong>{adminLocalizedEntry(variant.name_uk, variant.name_en, variant.code)}</strong>
                    <p>{slotCount} слотів</p>
                  </div>
                </button>
              );
            })}
          </section>
        ) : (
          <div className="admin-cardish studio-empty-block">
            <h3>У цього типу поки немає варіантів</h3>
            <p className="studio-empty-copy">Створіть новий варіант усередині типу, як у підвісок із серцем, місяцем або краплею.</p>
            <div className="admin-chip-row">
              <button type="button" className="small-button is-active" onClick={startNewVariant}>Створити перший варіант</button>
              <button type="button" className="small-button button-secondary-strong" onClick={() => {
                setJewelryStep("editor");
                setEditorSubview("basic");
              }}>Відкрити параметри типу</button>
            </div>
          </div>
        )}
      </>
    );
  }

  function renderJewelryEditor() {
    if (!typeForm) return null;
    return (
      <>
        <div className="studio-subnav">
          {[ 
            ["slots", "Слоти"],
            ["basic", "Основне"],
            ["matrix", "Дозволені камені"],
            ["preview", "Попередній перегляд"]
          ].map(([key, label]) => (
            <button key={key} type="button" className={"small-button" + (editorSubview === key ? " is-active" : "")} onClick={() => setEditorSubview(key)}>{label}</button>
          ))}
        </div>

        {editorSubview === "slots" ? (
          currentVariantAdmin && slotForm ? (
          <>
            <div className="admin-panel-head">
              <div>
                <h2>Редактор прикраси</h2>
                <p className="admin-panel-copy">Налаштування посадкових місць каменів для варіанта {adminLocalizedEntry(currentVariantAdmin.name_uk, currentVariantAdmin.name_en, currentVariantAdmin.code)}.</p>
              </div>
              <div className="admin-chip-row">
                <button type="button" className="small-button button-secondary-strong" onClick={() => openSection("stones")}>Усі камені</button>
                <button type="button" className="small-button button-secondary-strong" onClick={startNewSlot}>Новий слот</button>
                <button type="button" className="small-button button-secondary-strong" disabled={!currentSlotAdmin?.id || isSaving} onClick={duplicateCurrentSlot}>Дублювати слот</button>
                <button type="button" className="small-button button-secondary-strong" disabled={!currentSlotAdmin?.id || isSaving} onClick={deleteSlotAdmin}>Видалити слот</button>
                <button type="button" className={`small-button button-save-slot${slotDraftDirty ? " is-dirty" : ""}`} disabled={isSaving || !slotDraftDirty} onClick={saveSlot}>{isSaving ? "Збереження..." : "Зберегти слот"}</button>
              </div>
            </div>
            <div className="studio-editor-layout">
              <aside className="studio-outline-panel">
                <div className="studio-mini-card">
                  <span className="studio-kicker">Варіант</span>
                  <strong>{adminLocalizedEntry(currentVariantAdmin.name_uk, currentVariantAdmin.name_en, currentVariantAdmin.code)}</strong>
                  <p>{currentSlotsAdmin.length} слотів, асет {assetsById[currentVariantAdmin.base_asset_id]?.label || "не вибрано"}.</p>
                </div>
                <div className="studio-outline-list">
                  {currentSlotsAdmin.map((slot, index) => (
                      <button key={slot.id} type="button" className={"studio-outline-item" + (String(currentSlotAdmin?.id) === String(slot.id) ? " is-active" : "")} onClick={() => selectSlotDraft(slot.id)}>
                      <span className="studio-outline-badge">{index + 1}</span>
                      <div>
                        <strong>{adminLocalizedEntry(slot.label_uk, slot.label_en, slot.code)}</strong>
                        <span>{Math.round(slot.x)} x {Math.round(slot.y)} · {slot.layer_mode}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="studio-stone-palette">
                  <div className="studio-inline-head">
                    <h3>Палітра каменів</h3>
                    <button type="button" className="small-button button-secondary-strong" onClick={() => openSection("stones")}>Відкрити бібліотеку</button>
                  </div>
                  <div className="studio-stone-grid">
                    <button type="button" className={"studio-stone-choice" + (selectedPreviewStoneCode === "none" ? " is-active" : "")} onClick={() => updateSelectedSlotPreview("none")}>
                      <span className="studio-stone-choice-thumb is-empty" />
                      <strong>Без каменю</strong>
                    </button>
                    {availableVariantStones.map((stone) => (
                      <button key={"palette-" + stone.id} type="button" className={"studio-stone-choice" + (selectedPreviewStoneCode === stone.code ? " is-active" : "")} onClick={() => updateSelectedSlotPreview(stone.code)}>
                        <span className="studio-stone-choice-thumb" style={stone.asset_url ? { backgroundImage: 'url(' + stone.asset_url + ')' } : undefined} />
                        <strong>{adminLocalizedEntry(stone.name_uk, stone.name_en, stone.code)}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="studio-stage-panel">
                <div className="studio-stage-meta">
                  <span>Полотно 1:1</span>
                  <span>Перетягуйте кола прямо по прикрасі</span>
                </div>
                <StudioSlotCanvasEditor
                  variant={currentVariantPreview}
                  slots={editableSlotsAdmin}
                  stones={stonesByCodeAdmin}
                  previewSelections={previewSelections}
                  selectedSlotId={currentSlotAdmin?.id}
                    onSelectSlot={selectSlotDraft}
                  onMoveSlot={(slotId, point) => {
                    if (String(slotForm?.id) === String(slotId)) setSlotForm((current) => ({ ...current, x: point.x, y: point.y }));
                    const movedSlot = currentSlotsAdmin.find((slot) => String(slot.id) === String(slotId));
                    if (movedSlot) {
                      setSelectedSlotId(String(slotId));
                      setSlotForm({ ...movedSlot, x: point.x, y: point.y });
                    }
                  }}
                  onResizeSlot={(slotId, scalePatch) => {
                    if (String(slotForm?.id) === String(slotId)) {
                      setSlotForm((current) => ({ ...current, ...scalePatch }));
                    }
                    const resizedSlot = currentSlotsAdmin.find((slot) => String(slot.id) === String(slotId));
                    if (resizedSlot) {
                      setSelectedSlotId(String(slotId));
                      setSlotForm({ ...resizedSlot, ...scalePatch });
                    }
                  }}
                  onInteractionEnd={commitSlotIfDirty}
                />
                <div className="studio-stage-footer">
                  <span>Обраний слот: {adminLocalizedEntry(currentSlotAdmin?.label_uk, currentSlotAdmin?.label_en, slotForm.code || "Новий слот")}</span>
                  <span>{Number(slotForm.x || 0).toFixed(1)}% / {Number(slotForm.y || 0).toFixed(1)}%</span>
                </div>
              </div>

              <aside className="studio-inspector-panel">
                <div className="studio-mini-card">
                  <span className="studio-kicker">Інспектор</span>
                  <strong>{currentSlotAdmin?.code || "Чернетка нового слота"}</strong>
                  <p>Точні координати, розмір посадкового кола та шар каменю.</p>
                </div>
                <div className="admin-form-grid compact">
                  <label><span>Code</span><input value={slotForm.code || ""} onChange={(e) => setSlotForm((current) => ({ ...current, code: e.target.value }))} /></label>
                  <label><span>Сортування</span><input type="number" value={slotForm.sort_order || 0} onChange={(e) => setSlotForm((current) => ({ ...current, sort_order: Number(e.target.value) }))} /></label>
                  <label><span>Назва UK</span><input value={slotForm.label_uk || ""} onChange={(e) => setSlotForm((current) => ({ ...current, label_uk: e.target.value }))} /></label>
                  <label><span>Назва EN</span><input value={slotForm.label_en || ""} onChange={(e) => setSlotForm((current) => ({ ...current, label_en: e.target.value }))} /></label>
                  <label><span>X</span><input type="number" step="0.1" value={slotForm.x || 0} onChange={(e) => setSlotForm((current) => ({ ...current, x: Number(e.target.value) }))} /></label>
                  <label><span>Y</span><input type="number" step="0.1" value={slotForm.y || 0} onChange={(e) => setSlotForm((current) => ({ ...current, y: Number(e.target.value) }))} /></label>
                  <label><span>Масштаб X</span><input type="number" step="0.1" value={slotForm.scale_x || 1} onChange={(e) => setSlotForm((current) => ({ ...current, scale_x: Number(e.target.value) }))} /></label>
                  <label><span>Масштаб Y</span><input type="number" step="0.1" value={slotForm.scale_y || 1} onChange={(e) => setSlotForm((current) => ({ ...current, scale_y: Number(e.target.value) }))} /></label>
                  <label><span>Діаметр</span><input type="number" step="0.1" value={slotForm.diameter || 12} onChange={(e) => setSlotForm((current) => ({ ...current, diameter: Number(e.target.value) }))} /></label>
                  <label><span>Режим шару</span><select value={slotForm.layer_mode || "above"} onChange={(e) => setSlotForm((current) => ({ ...current, layer_mode: e.target.value }))}><option value="above">Камінь над прикрасою</option><option value="below">Камінь під прикрасою</option></select></label>
                  <label className="full">
                    <span>Камінь для попереднього перегляду</span>
                    <select value={selectedPreviewStoneCode} onChange={(e) => updateSelectedSlotPreview(e.target.value)}>
                      <option value="none">Без каменю</option>
                      {availableVariantStones.map((stone) => <option key={"preview-stone-" + stone.id} value={stone.code}>{adminLocalizedEntry(stone.name_uk, stone.name_en, stone.code)}</option>)}
                    </select>
                  </label>
                </div>
              </aside>
            </div>
          </>
          ) : (
            <div className="admin-cardish studio-empty-block">
              <h3>У варіанта поки немає слотів</h3>
              <p className="studio-empty-copy">Спочатку виберіть або створіть варіант, потім додайте перший слот, і редактор полотна одразу оживе.</p>
              <div className="admin-chip-row">
                <button type="button" className="small-button button-secondary-strong" onClick={() => setJewelryStep("variants")}>До списку варіантів</button>
                <button type="button" className="small-button is-active" disabled={!currentVariantAdmin} onClick={startNewSlot}>Створити перший слот</button>
              </div>
            </div>
          )
        ) : null}

        {editorSubview === "basic" && typeForm ? (
          <>
            <div className="admin-panel-head">
              <div>
                <h2>Основне</h2>
                <p className="admin-panel-copy">Повний CRUD для самого типу прикраси та вибраного варіанта всередині нього.</p>
              </div>
              <div className="admin-chip-row">
                <button type="button" className="small-button button-secondary-strong" onClick={() => setJewelryStep("variants")}>До варіантів</button>
                <button type="button" className="small-button button-secondary-strong" disabled={!currentTypeAdmin} onClick={startNewVariant}>Створити варіант</button>
                {isDeletePending("variant", currentVariantAdmin?.id) ? (
                  <>
                    <button type="button" className="small-button button-danger is-confirm" disabled={isSaving} onClick={deleteVariantAdmin}>Підтвердити видалення</button>
                    <button type="button" className="small-button button-secondary-strong" disabled={isSaving} onClick={cancelDelete}>Скасувати</button>
                  </>
                ) : (
                  <button type="button" className="small-button button-danger" disabled={!currentVariantAdmin || isSaving} onClick={() => requestDelete("variant", currentVariantAdmin?.id)}>Видалити варіант</button>
                )}
                {isDeletePending("type", currentTypeAdmin?.id) ? (
                  <>
                    <button type="button" className="small-button button-danger is-confirm" disabled={isSaving} onClick={deleteTypeAdmin}>Підтвердити видалення типу</button>
                    <button type="button" className="small-button button-secondary-strong" disabled={isSaving} onClick={cancelDelete}>Скасувати</button>
                  </>
                ) : (
                  <button type="button" className="small-button button-danger" disabled={!currentTypeAdmin || isSaving} onClick={() => requestDelete("type", currentTypeAdmin?.id)}>Видалити тип</button>
                )}
                {variantForm ? <button type="button" className="small-button is-active" disabled={isSaving} onClick={saveVariant}>{isSaving ? "Збереження..." : "Зберегти варіант"}</button> : null}
                <button type="button" className="small-button" disabled={isSaving} onClick={saveType}>{isSaving ? "Збереження..." : "Зберегти тип"}</button>
              </div>
            </div>
            <div className="studio-basic-grid">
              <div className="admin-cardish">
                <h3>Варіант</h3>
                {variantForm ? (
                  <div className="admin-form-grid compact">
                    <label><span>Code</span><input value={variantForm?.code || ""} onChange={(e) => setVariantForm((current) => ({ ...(current || {}), code: e.target.value }))} /></label>
                    <label><span>Підтип</span><input value={variantForm?.subtype || ""} onChange={(e) => setVariantForm((current) => ({ ...(current || {}), subtype: e.target.value }))} /></label>
                    <label><span>Група</span><input value={variantForm?.group || ""} onChange={(e) => setVariantForm((current) => ({ ...(current || {}), group: e.target.value }))} /></label>
                    <label><span>Сортування</span><input type="number" value={variantForm?.sort_order || 0} onChange={(e) => setVariantForm((current) => ({ ...(current || {}), sort_order: Number(e.target.value) }))} /></label>
                    <label><span>Доплата за модель</span><input type="number" value={variantForm?.price_delta || 0} onChange={(e) => setVariantForm((current) => ({ ...(current || {}), price_delta: Number(e.target.value) }))} /></label>
                    <label><span>Назва UK</span><input value={variantForm?.name_uk || ""} onChange={(e) => setVariantForm((current) => ({ ...(current || {}), name_uk: e.target.value }))} /></label>
                    <label><span>Назва EN</span><input value={variantForm?.name_en || ""} onChange={(e) => setVariantForm((current) => ({ ...(current || {}), name_en: e.target.value }))} /></label>
                    <label className="full"><span>Базовий асет</span><select value={variantForm?.base_asset_id || ""} onChange={(e) => setVariantForm((current) => ({ ...(current || {}), base_asset_id: Number(e.target.value) || null }))}><option value="">-</option>{assets.filter((asset) => asset.kind === "jewelry-base").map((asset) => <option key={asset.id} value={asset.id}>{asset.label}</option>)}</select></label>
                  </div>
                ) : (
                  <div className="studio-empty-copy">У цього типу поки немає вибраного варіанта. Створіть новий варіант, і він одразу з’явиться тут.</div>
                )}
              </div>
              <div className="admin-cardish">
                <h3>Тип прикраси</h3>
                <div className="admin-form-grid compact">
                  <label><span>Code</span><input value={typeForm.code || ""} onChange={(e) => updateTypeField("code", e.target.value)} /></label>
                  <label><span>Базова ціна</span><input type="number" value={typeForm.base_price || 0} onChange={(e) => updateTypeField("base_price", Number(e.target.value))} /></label>
                  <label><span>Сортування</span><input type="number" value={typeForm.sort_order || 0} onChange={(e) => updateTypeField("sort_order", Number(e.target.value))} /></label>
                  <label><span>Назва UK</span><input value={typeForm.name_uk || ""} onChange={(e) => updateTypeField("name_uk", e.target.value)} /></label>
                  <label><span>Назва EN</span><input value={typeForm.name_en || ""} onChange={(e) => updateTypeField("name_en", e.target.value)} /></label>
                </div>
              </div>
              <div className="admin-cardish">
                <div className="studio-inline-head">
                  <h3>Матеріали</h3>
                  <button type="button" className="small-button button-secondary-strong" onClick={addTypeMaterial}>Додати матеріал</button>
                </div>
                {(typeForm.materials || []).length ? (
                  <div className="studio-type-list">
                    {(typeForm.materials || []).map((material, index) => (
                      <div className="studio-type-row" key={`material-${index}`}>
                        <div className="admin-form-grid compact">
                          <label><span>Code</span><input value={material.code || ""} onChange={(e) => updateTypeMaterial(index, "code", e.target.value)} /></label>
                          <label><span>Сортування</span><input type="number" value={material.sort_order || 0} onChange={(e) => updateTypeMaterial(index, "sort_order", Number(e.target.value))} /></label>
                          <label><span>Назва UK</span><input value={material.name_uk || ""} onChange={(e) => updateTypeMaterial(index, "name_uk", e.target.value)} /></label>
                          <label><span>Назва EN</span><input value={material.name_en || ""} onChange={(e) => updateTypeMaterial(index, "name_en", e.target.value)} /></label>
                          <label><span>Доплата</span><input type="number" value={material.price_delta || 0} onChange={(e) => updateTypeMaterial(index, "price_delta", Number(e.target.value))} /></label>
                          <label><span>Тон</span><input value={material.tone || ""} onChange={(e) => updateTypeMaterial(index, "tone", e.target.value)} /></label>
                        </div>
                        <button type="button" className="small-button button-danger" onClick={() => removeTypeMaterial(index)}>Видалити матеріал</button>
                      </div>
                    ))}
                  </div>
                ) : <p className="studio-empty-copy">У типу немає параметрів матеріалів.</p>}
              </div>
              <div className="admin-cardish">
                <div className="studio-inline-head">
                  <h3>Розміри</h3>
                  <button type="button" className="small-button button-secondary-strong" onClick={addTypeSize}>Додати розмір</button>
                </div>
                {(typeForm.size_options || []).length ? (
                  <div className="studio-type-list">
                    {(typeForm.size_options || []).map((size, index) => (
                      <div className="studio-type-row" key={`size-${index}`}>
                        <div className="admin-form-grid compact">
                          <label><span>Code</span><input value={size.code || ""} onChange={(e) => updateTypeSize(index, "code", e.target.value)} /></label>
                          <label><span>Сортування</span><input type="number" value={size.sort_order || 0} onChange={(e) => updateTypeSize(index, "sort_order", Number(e.target.value))} /></label>
                          <label><span>Назва UK</span><input value={size.label_uk || ""} onChange={(e) => updateTypeSize(index, "label_uk", e.target.value)} /></label>
                          <label><span>Назва EN</span><input value={size.label_en || ""} onChange={(e) => updateTypeSize(index, "label_en", e.target.value)} /></label>
                          <label><span>Доплата</span><input type="number" value={size.price_delta || 0} onChange={(e) => updateTypeSize(index, "price_delta", Number(e.target.value))} /></label>
                          <label><span>За замовчуванням</span><input type="checkbox" checked={Boolean(size.is_default)} onChange={(e) => updateTypeSize(index, "is_default", e.target.checked)} /></label>
                        </div>
                        <button type="button" className="small-button button-danger" onClick={() => removeTypeSize(index)}>Видалити розмір</button>
                      </div>
                    ))}
                  </div>
                ) : <p className="studio-empty-copy">У типу немає параметрів розмірів.</p>}
              </div>
              <div className="admin-cardish">
                <h3>Гравіювання</h3>
                <div className="admin-form-grid compact">
                  <label><span>Увімкнено</span><input type="checkbox" checked={Boolean(typeForm.engraving?.enabled)} onChange={(e) => updateEngravingField("enabled", e.target.checked)} /></label>
                  <label><span>Максимальна довжина</span><input type="number" value={typeForm.engraving?.max_length || 24} onChange={(e) => updateEngravingField("max_length", Number(e.target.value))} /></label>
                  <label><span>Доплата</span><input type="number" value={typeForm.engraving?.price_delta || 0} onChange={(e) => updateEngravingField("price_delta", Number(e.target.value))} /></label>
                  <label><span>Плейсхолдер UK</span><input value={typeForm.engraving?.placeholder_uk || ""} onChange={(e) => updateEngravingField("placeholder_uk", e.target.value)} /></label>
                  <label><span>Плейсхолдер EN</span><input value={typeForm.engraving?.placeholder_en || ""} onChange={(e) => updateEngravingField("placeholder_en", e.target.value)} /></label>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {editorSubview === "matrix" ? renderPricingMatrix(currentVariantAdmin, stonesDecorated, currentVariantMatrix, setVariantStone, () => openSection("stones"), () => setSection("pricing")) : null}

        {editorSubview === "preview" && currentVariantPreview ? (
          <>
            <div className="admin-panel-head"><h2>Попередній перегляд варіанта</h2></div>
            <div className="admin-preview-grid">
              <JewelryPreview
                variant={currentVariantPreview}
                slots={currentSlotsAdmin}
                stonesByCode={stonesByCodeAdmin}
                selections={previewSelections}
                engraving=""
                baseAssetCandidates={variantAdminPreviewCandidates(currentVariantAdmin)}
              />
              <div className="admin-form-grid compact">
                {currentSlotsAdmin.map((slot) => (
                  <label key={"preview-" + slot.id}>
                    <span>{slot.code}</span>
                    <select value={previewSelections[slot.code] || "none"} onChange={(e) => setPreviewSelections((current) => ({ ...current, [slot.code]: e.target.value }))}>
                      <option value="none">Без каменю</option>
                      {availableVariantStones.map((stone) => <option key={stone.id} value={stone.code}>{adminLocalizedEntry(stone.name_uk, stone.name_en, stone.code)}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </>
    );
  }

  function renderStoneLibrary() {
    return (
      <>
          <div className="admin-panel-head">
            <div>
              <h2>Бібліотека каменів</h2>
              <p className="admin-panel-copy">Повний список каменів, які можна використовувати в прикрасах.</p>
            </div>
          <button type="button" className="small-button is-active" onClick={startNewStone}>Новий камінь</button>
        </div>
        {stonesDecorated.length ? (
          <section className="studio-stone-library-grid">
            {stonesDecorated.map((stone) => {
              const usage = allMatrix.filter((item) => String(item.stone_id) === String(stone.id) && item.is_enabled !== false).length;
              return (
                <button key={stone.id} type="button" className="studio-stone-library-card" onClick={() => openStoneEditor(stone.id)}>
                  <span className="studio-stone-library-thumb" style={stone.asset_url ? { backgroundImage: 'url(' + stone.asset_url + ')' } : undefined} />
                  <strong>{adminLocalizedEntry(stone.name_uk, stone.name_en, stone.code)}</strong>
                  <span>{stone.code}</span>
                  <p>{usage} варіантів використовують цей камінь</p>
                </button>
              );
            })}
          </section>
        ) : (
          <div className="admin-cardish studio-empty-block">
            <h3>Бібліотека каменів порожня</h3>
            <p className="studio-empty-copy">Можна почати з порожнього каталогу й додати лише ті камені, які справді потрібні.</p>
          </div>
        )}
      </>
    );
  }

  function renderStoneEditor() {
    if (!stoneForm2) return null;
    return (
      <>
        <div className="admin-panel-head">
          <div>
            <h2>Редактор каменю</h2>
            <p className="admin-panel-copy">Налаштуйте властивості каменю та перевірте, де він використовується.</p>
          </div>
          <div className="admin-chip-row">
            <button type="button" className="small-button" onClick={() => setStoneStep("list")}>Назад до бібліотеки</button>
            {isDeletePending("stone", stoneForm2?.id) ? (
              <>
                <button type="button" className="small-button button-danger is-confirm" disabled={!stoneForm2?.id || isSaving} onClick={deleteStoneAdmin}>Підтвердити видалення</button>
                <button type="button" className="small-button button-secondary-strong" disabled={isSaving} onClick={cancelDelete}>Скасувати</button>
              </>
            ) : (
              <button type="button" className="small-button button-danger" disabled={!stoneForm2?.id || isSaving} onClick={() => requestDelete("stone", stoneForm2?.id)}>Видалити камінь</button>
            )}
            <button type="button" className="small-button is-active" disabled={isSaving} onClick={saveStone}>{isSaving ? "Збереження..." : "Зберегти камінь"}</button>
          </div>
        </div>
        <div className="studio-stone-editor-layout">
          <div className="admin-cardish">
            <div className="admin-form-grid compact">
              <label><span>Code</span><input value={stoneForm2.code || ""} onChange={(e) => setStoneForm2((current) => ({ ...current, code: e.target.value }))} /></label>
              <label><span>Асет</span><select value={stoneForm2.asset_id || ""} onChange={(e) => setStoneForm2((current) => ({ ...current, asset_id: Number(e.target.value) || null }))}><option value="">-</option>{assets.filter((asset) => asset.kind === "stone").map((asset) => <option key={asset.id} value={asset.id}>{asset.label}</option>)}</select></label>
              <label><span>Назва UK</span><input value={stoneForm2.name_uk || ""} onChange={(e) => setStoneForm2((current) => ({ ...current, name_uk: e.target.value }))} /></label>
              <label><span>Назва EN</span><input value={stoneForm2.name_en || ""} onChange={(e) => setStoneForm2((current) => ({ ...current, name_en: e.target.value }))} /></label>
              <label><span>Масштаб X</span><input type="number" step="0.1" value={stoneForm2.default_scale_x || 1} onChange={(e) => setStoneForm2((current) => ({ ...current, default_scale_x: Number(e.target.value) }))} /></label>
              <label><span>Масштаб Y</span><input type="number" step="0.1" value={stoneForm2.default_scale_y || 1} onChange={(e) => setStoneForm2((current) => ({ ...current, default_scale_y: Number(e.target.value) }))} /></label>
              <label className="full"><span>Шар</span><select value={stoneForm2.default_layer_mode || "above"} onChange={(e) => setStoneForm2((current) => ({ ...current, default_layer_mode: e.target.value }))}><option value="above">над прикрасою</option><option value="below">під прикрасою</option></select></label>
            </div>
          </div>
          <div className="admin-cardish">
            <h3>Попередній перегляд</h3>
            <div className="studio-stone-editor-preview">
              <span className="studio-stone-editor-preview-thumb" style={stoneForm2.asset_id && assetsById[stoneForm2.asset_id]?.path ? { backgroundImage: 'url(' + assetsById[stoneForm2.asset_id].path + ')' } : undefined} />
            </div>
            <h3>Використання у варіантах</h3>
            <div className="studio-usage-list">
              {currentStoneUsage.length ? currentStoneUsage.map((entry) => {
                const variant = (studio?.variants || []).find((item) => String(item.id) === String(entry.variant_id));
                return (
                  <button key={"usage-" + entry.variant_id} type="button" className="studio-usage-item" onClick={() => {
                    setSelectedTypeId(String(variant?.type_id || selectedTypeId));
                    setSelectedVariantId(String(entry.variant_id));
                    setSection("pricing");
                  }}>
                    <strong>{adminLocalizedEntry(variant?.name_uk, variant?.name_en, "Варіант " + entry.variant_id)}</strong>
                    <span>{entry.price_delta} грн</span>
                  </button>
                );
              }) : <p className="studio-empty-copy">Цей камінь ще не увімкнений у жодному варіанті.</p>}
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderAssetsSection() {
    const visibleAssets = assets.filter((asset) => asset.kind === selectedAssetKind);
    return (
      <>
        <div className="admin-panel-head">
          <div>
            <h2>Асети</h2>
            <p className="admin-panel-copy">Завантажуйте й перевикористовуйте зображення прикрас, каменів і вітринних асетів.</p>
          </div>
        </div>
        <div className="admin-cardish">
          <div className="admin-form-grid compact">
            <label><span>Назва</span><input value={assetUploadState.label} onChange={(e) => setAssetUploadState((current) => ({ ...current, label: e.target.value }))} /></label>
            <label><span>Тип</span><select value={assetUploadState.kind} onChange={(e) => setAssetUploadState((current) => ({ ...current, kind: e.target.value }))}><option value="jewelry-base">{adminAssetKindLabel("jewelry-base")}</option><option value="stone">{adminAssetKindLabel("stone")}</option><option value="product">{adminAssetKindLabel("product")}</option><option value="other">{adminAssetKindLabel("other")}</option></select></label>
            <label className="full"><span>Теги</span><input value={assetUploadState.tags} onChange={(e) => setAssetUploadState((current) => ({ ...current, tags: e.target.value }))} /></label>
            <label className="admin-upload-field full"><span>Завантажити зображення</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAssetUpload} /></label>
          </div>
        </div>
        <div className="studio-subnav">
          {["jewelry-base", "stone", "product", "other"].map((kind) => (
            <button key={kind} type="button" className={"small-button" + (selectedAssetKind === kind ? " is-active" : "")} onClick={() => setSelectedAssetKind(kind)}>{adminAssetKindLabel(kind)}</button>
          ))}
        </div>
        <div className="admin-asset-grid">
          {visibleAssets.map((asset) => (
            <div className="admin-asset-card" key={asset.id}>
              <img src={asset.path} alt={asset.label} />
              <strong>{asset.label}</strong>
              <span>{asset.path}</span>
              <span>{asset.width && asset.height ? `${asset.width}x${asset.height}` : adminAssetKindLabel(asset.kind)}</span>
              <div className="admin-chip-row">
                {isDeletePending("asset", asset.id) ? (
                  <>
                    <button type="button" className="small-button button-danger is-confirm" disabled={isSaving} onClick={() => deleteAssetAdmin(asset)}>Підтвердити видалення</button>
                    <button type="button" className="small-button button-secondary-strong" disabled={isSaving} onClick={cancelDelete}>Скасувати</button>
                  </>
                ) : (
                  <button type="button" className="small-button button-danger" disabled={isSaving} onClick={() => requestDelete("asset", asset.id)}>Видалити асет</button>
                )}
              </div>
            </div>
          ))}
        </div>
        {!visibleAssets.length ? (
          <div className="admin-cardish studio-empty-block">
            <h3>У цій категорії поки немає асетів</h3>
            <p className="studio-empty-copy">Можна тримати бібліотеку чистою й додавати лише те, що справді використовується.</p>
          </div>
        ) : null}
      </>
    );
  }

  function renderPricingSection() {
    return (
      <>
        <div className="admin-panel-head">
          <div>
            <h2>Ціни й доступність</h2>
            <p className="admin-panel-copy">Спочатку виберіть прикрасу, потім налаштуйте, які камені доступні і скільки вони коштують.</p>
          </div>
        </div>
        <div className="studio-pricing-topbar">
          <div className="admin-chip-row admin-chip-stack">
            <span className="studio-kicker">Тип прикраси</span>
            {types.map((type) => (
              <button key={type.id} type="button" className={"small-button" + (String(selectedTypeId) === String(type.id) ? " is-active" : "")} onClick={() => setSelectedTypeId(String(type.id))}>{type.name_uk || type.name_en}</button>
            ))}
          </div>
          <div className="admin-chip-row admin-chip-stack">
            <span className="studio-kicker">Варіант</span>
            {variants.map((variant) => (
              <button key={variant.id} type="button" className={"small-button" + (String(selectedVariantId) === String(variant.id) ? " is-active" : "")} onClick={() => setSelectedVariantId(String(variant.id))}>{adminLocalizedEntry(variant.name_uk, variant.name_en, variant.code)}</button>
            ))}
          </div>
        </div>
        {currentVariantAdmin ? renderPricingMatrix(currentVariantAdmin, stonesDecorated, currentVariantMatrix, setVariantStone, () => openSection("stones"), () => {
          setSection("jewelry");
          setJewelryStep("editor");
          setEditorSubview("matrix");
        }) : (
          <div className="admin-cardish studio-empty-block">
            <h3>Немає варіанта для налаштування цін</h3>
            <p className="studio-empty-copy">Спочатку створіть варіант усередині типу, а потім увімкніть для нього доступні камені та їхні ціни.</p>
          </div>
        )}
      </>
    );
  }

  return (
    <AdminShell title="Конструкторне студіо" subtitle="Візуальна CMS на JSON для типів, варіантів, слотів, каменів і асетів.">
      {error ? <p className="admin-error">{error}</p> : null}
      {notice ? <p className="admin-success">{notice}</p> : null}
      {!studio ? <div className="empty-state-react"><h2>Завантаження студіо</h2></div> : (
        <div className="studio-shell">
          <section className="studio-workspace-bar admin-panel">
            <div className="admin-panel-head"><h2>Робочий простір</h2></div>
            <div className="studio-top-nav">
              {workspaceSections.map((item) => (
                <button key={item.key} type="button" className={"small-button" + (section === item.key ? " is-active" : "")} onClick={() => openSection(item.key)}>{item.label}</button>
              ))}
            </div>
            <div className="studio-breadcrumbs">
              <button type="button" className="tiny-link-button" onClick={() => setSection("home")}>Головна</button>
              {breadcrumb.slice(1).map((item) => <span key={item}>{item}</span>)}
            </div>
          </section>

          <section className="admin-panel wide studio-main-panel">
            {section === "home" ? renderHome() : null}
            {section === "jewelry" && jewelryStep === "types" ? renderJewelryTypeStep() : null}
            {section === "jewelry" && jewelryStep === "variants" ? renderJewelryVariantStep() : null}
            {section === "jewelry" && jewelryStep === "editor" ? renderJewelryEditor() : null}
            {section === "stones" && stoneStep === "list" ? renderStoneLibrary() : null}
            {section === "stones" && stoneStep === "editor" ? renderStoneEditor() : null}
            {section === "assets" ? renderAssetsSection() : null}
            {section === "pricing" ? renderPricingSection() : null}
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function App() {
  if (window.location.pathname === "/admin/login") {
    return <AdminLoginPage />;
  }

  if (window.location.pathname === "/admin/orders") {
    return <AdminOrdersPage />;
  }

  if (/^\/admin\/orders\/\d+$/.test(window.location.pathname)) {
    return <AdminOrderDetailPage />;
  }

  if (window.location.pathname === "/admin/products") {
    return <AdminProductsPage />;
  }

  if (window.location.pathname === "/admin/constructor") {
    return <StudioAdminConstructorPage />;
  }

  if (/^\/orders\/\d+$/.test(window.location.pathname)) {
    return <OrderDetailPage />;
  }

  if (window.location.pathname === "/account") {
    return <AccountPage />;
  }

  if (window.location.pathname === "/auth") {
    return <AuthPage />;
  }

  if (window.location.pathname === "/orders") {
    return <OrdersPage />;
  }

  if (window.location.pathname === "/checkout") {
    return <CheckoutPage />;
  }

  if (window.location.pathname === "/cart") {
    return <CartPage />;
  }

  if (window.location.pathname === "/constructor") {
    return <ConstructorStudioPage />;
  }

  if (window.location.pathname.startsWith("/products/")) {
    return <ProductPage />;
  }

  if (window.location.pathname === "/catalog") {
    return <CatalogPage />;
  }

  if (window.location.pathname === "/about") {
    return <AboutPage />;
  }

  return <HomePage />;
}

function AuroraBackground() {
  return (
    <div id="aurora-bg" aria-hidden="true">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <div className="orb orb-5" />
      <div className="orb orb-6" />
    </div>
  );
}

function Root() {
  const [locale, setLocale] = useState(getInitialLocale);

  useEffect(() => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      localeFormat: LOCALE_FORMATS[locale],
      t: (key) => translations[locale]?.[key] ?? translations.en[key] ?? key,
      toggleLocale: () => setLocale((current) => (current === "uk" ? "en" : "uk"))
    }),
    [locale]
  );

    return (
      <LocaleContext.Provider value={value}>
        <AuroraBackground />
        <div className="app-shell">
          <App />
        </div>
      </LocaleContext.Provider>
    );
  }

createRoot(document.getElementById("root")).render(<Root />);

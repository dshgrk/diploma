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
  about: {
    heroVideo: "/assets/videos/about-hero-atelier.mp4",
    craftDetailVideo: "/assets/videos/about-craft-detail.mp4",
    heroPoster: "/assets/images/about-hero-poster.png",
    workshopOverview: "/assets/images/about-workshop-overview.png",
    artisanDetail: "/assets/images/about-artisan-detail.png",
    materialsTable: "/assets/images/about-materials-table.png",
    clientConsultation: "/assets/images/about-client-consultation.png",
    packaging: "/assets/images/about-packaging.png"
  },
  homePaths: {
    collection: "/assets/images/home-path-collection.png",
    constructor: "/assets/images/home-path-constructor.png"
  },
  homeCategories: {
    rings: "/assets/images/home-category-rings.png",
    earrings: "/assets/images/home-category-earrings.png",
    bracelets: "/assets/images/home-category-bracelets.png",
    pendants: "/assets/images/home-category-pendants.png"
  },
  featured: [
    "/assets/images/aurora-jewelry-hero.png",
    "/assets/images/product-heart.png",
    "/assets/images/product-moon.png",
    "/assets/generated/ring-trinity-silver.png"
  ],
  bespoke: "/assets/images/aurora-jewelry-hero.png",
  editorial: [
    "/assets/generated/bracelet-orbit-silver.png",
    "/assets/generated/pendant-heart-silver.png",
    "/assets/images/aurora-jewelry-hero.png"
  ],
  productBySlug: {
    "quiet-pearl-ring": "/assets/images/aurora-jewelry-hero.png",
    "moon-bracelet": "/assets/images/product-moon.png",
    "silver-heart-pendant": "/assets/images/product-heart.png",
    "white-diamond-earrings": "/assets/images/aurora-jewelry-hero.png"
  }
};

export const ABOUT_PAGE_CONTENT = {
  uk: {
    hero: {
      eyebrow: "ПРО AURORA ATELIER",
      title: "Невелика ювелірна майстерня з увагою до кожної деталі",
      text:
        "Aurora Atelier — це камерна авторська майстерня, де прикраси народжуються з поєднання форми, матеріалів і особистого змісту. Ми створюємо готові вироби для колекції та даємо можливість зібрати власну прикрасу в онлайн-конструкторі — у спокійній естетиці, з увагою до деталей і відчуттям справжньої майстерності.",
      primaryCta: "До колекції",
      secondaryCta: "Створити прикрасу"
    },
    whoWeAre: {
      title: "Майстерня, а не масовий магазин",
      paragraphs: [
        "Aurora Atelier створена як невелика ювелірна майстерня для тих, хто шукає не випадкову прикрасу, а річ із характером і сенсом. Нам близька стримана естетика: чисті форми, теплі метали, виважені пропорції та камені, що працюють не на ефектність, а на відчуття.",
        "Ми не мислимо прикрасу як швидкий товар. Для нас це поєднання ідеї, матеріалу та людини, яка буде її носити. Саме тому в Aurora Atelier поруч існують готова колекція і конструктор — щоб кожен міг знайти або створити виріб, що відгукується саме йому."
      ],
      quote: "Для нас прикраса — це не просто декоративний акцент, а тиха форма особистої історії."
    },
    create: {
      title: "Що ми створюємо",
      cards: [
        {
          title: "Готова колекція",
          text: "У колекції Aurora Atelier зібрані каблучки, сережки, браслети та підвіски, створені в нашій фірмовій естетиці — м’яка розкіш, чистий силует і делікатна виразність.",
          cta: "Перейти до колекції",
          href: "/catalog"
        },
        {
          title: "Конструктор прикрас",
          text: "Онлайн-конструктор дозволяє обрати тип прикраси, метал, камінь і гравіювання, щоб створити виріб, який відповідає саме вашому смаку та настрою.",
          cta: "Відкрити конструктор",
          href: "/constructor"
        },
        {
          title: "Авторський підхід",
          text: "Ми поєднуємо цифрову зручність із підходом майстерні: увага до деталей, зрозумілий процес вибору та уважна підготовка кожного виробу перед передачею клієнту.",
          cta: "Як ми працюємо",
          href: "#about-process"
        }
      ]
    },
    process: {
      eyebrow: "ЯК МИ ПРАЦЮЄМО",
      title: "Шлях прикраси від вибору до готового виробу",
      steps: [
        {
          number: "01",
          title: "Ідея та вибір",
          text: "Ви можете почати з готової прикраси з колекції або створити власний дизайн у конструкторі."
        },
        {
          number: "02",
          title: "Матеріали та деталі",
          text: "Метал, камінь, форма та додаткові елементи поєднуються в цілісну композицію майбутнього виробу."
        },
        {
          number: "03",
          title: "Миттєвий розрахунок",
          text: "Після вибору параметрів конструктор одразу показує фінальну конфігурацію та вартість прикраси, щоб ви могли перейти до замовлення без додаткових уточнень."
        },
        {
          number: "04",
          title: "Фінальна підготовка",
          text: "Перед передачею клієнту виріб проходить уважну перевірку, акуратне пакування та підготовку до відправлення."
        }
      ]
    },
    gallery: {
      title: "Усередині майстерні",
      items: [
        { key: "workshopOverview", caption: "Простір, де народжуються ідеї" },
        { key: "artisanDetail", caption: "Уважна робота з деталями" },
        { key: "materialsTable", caption: "Матеріали, що визначають характер прикраси" },
        { key: "packaging", caption: "Пакування як частина досвіду" }
      ]
    },
    principles: {
      title: "Принципи Aurora Atelier",
      items: [
        {
          number: "01",
          title: "Особистий сенс",
          text: "Ми віримо, що прикраса має відгукуватися людині не лише візуально, а й емоційно."
        },
        {
          number: "02",
          title: "Стримана естетика",
          text: "Наш підхід — це тиха розкіш без надмірності: чисті лінії, м’який блиск і виважені пропорції."
        },
        {
          number: "03",
          title: "Повага до матеріалу",
          text: "Ми цінуємо природну красу металу, каменю та форми, не перевантажуючи виріб зайвими елементами."
        },
        {
          number: "04",
          title: "Зручність сучасного вибору",
          text: "Ми поєднуємо атмосферу майстерні з цифровим досвідом, щоб вибір прикраси був зрозумілим і приємним."
        }
      ]
    },
    cta: {
      title: "Оберіть готову прикрасу або створіть власну",
      text: "Aurora Atelier поєднує готову колекцію та можливість персонального вибору. Ви можете знайти виріб, який уже відповідає вашому стилю, або перейти в конструктор і зібрати прикрасу з матеріалів та деталей, близьких саме вам.",
      primaryCta: "До колекції",
      secondaryCta: "Створити прикрасу"
    }
  },
  en: {
    hero: {
      eyebrow: "ABOUT AURORA ATELIER",
      title: "A small jewelry atelier shaped by detail and intention",
      text:
        "Aurora Atelier is a small independent jewelry atelier where each piece begins with a balance of form, material, and personal meaning. We create finished pieces for our collection and also offer the freedom to design your own jewelry through an online constructor — all within a calm aesthetic and a thoughtful, craftsmanship-led approach.",
      primaryCta: "Explore the Collection",
      secondaryCta: "Design Your Piece"
    },
    whoWeAre: {
      title: "An atelier, not a mass-market store",
      paragraphs: [
        "Aurora Atelier was created as a small jewelry atelier for people looking for more than a decorative purchase. We are drawn to a restrained aesthetic: clean forms, warm metals, balanced proportions, and gemstones chosen not for excess, but for feeling.",
        "We do not think of jewelry as a fast product. To us, it is a connection between an idea, a material, and the person who will wear it. That is why Aurora Atelier brings together both a ready collection and a personal design constructor — so each client can either find or create a piece that feels truly their own."
      ],
      quote: "To us, jewelry is not only a visual accent, but a quiet form of personal story."
    },
    create: {
      title: "What We Create",
      cards: [
        {
          title: "Ready Collection",
          text: "The Aurora Atelier collection brings together rings, earrings, bracelets, and pendants created in our signature aesthetic — soft luxury, clean silhouettes, and delicate expression.",
          cta: "Explore Collection",
          href: "/catalog"
        },
        {
          title: "Jewelry Constructor",
          text: "Our online constructor lets you choose the jewelry type, metal, gemstone, and engraving to create a piece that reflects your personal taste and mood.",
          cta: "Open Constructor",
          href: "/constructor"
        },
        {
          title: "Atelier Approach",
          text: "We combine digital convenience with an atelier mindset: attention to detail, a clear design process, and thoughtful preparation of every piece before it reaches the client.",
          cta: "How We Work",
          href: "#about-process"
        }
      ]
    },
    process: {
      eyebrow: "HOW WE WORK",
      title: "The path from selection to finished jewelry",
      steps: [
        {
          number: "01",
          title: "Idea and selection",
          text: "You can begin with a finished piece from the collection or create your own design in the constructor."
        },
        {
          number: "02",
          title: "Materials and details",
          text: "Metal, gemstone, shape, and selected details are brought together into one coherent design."
        },
        {
          number: "03",
          title: "Instant calculation",
          text: "After you choose the options, the constructor immediately shows the final configuration and price, so you can move to checkout without additional clarification."
        },
        {
          number: "04",
          title: "Final preparation",
          text: "Before reaching the client, each piece is carefully checked, packaged, and prepared for delivery."
        }
      ]
    },
    gallery: {
      title: "Inside the Atelier",
      items: [
        { key: "workshopOverview", caption: "A space where ideas take shape" },
        { key: "artisanDetail", caption: "Careful work with fine details" },
        { key: "materialsTable", caption: "Materials that define the character of a piece" },
        { key: "packaging", caption: "Packaging as part of the experience" }
      ]
    },
    principles: {
      title: "Aurora Atelier Principles",
      items: [
        {
          number: "01",
          title: "Personal meaning",
          text: "We believe jewelry should resonate not only visually, but emotionally."
        },
        {
          number: "02",
          title: "Refined restraint",
          text: "Our approach is quiet luxury without excess: clean lines, gentle shine, and thoughtful proportions."
        },
        {
          number: "03",
          title: "Respect for materials",
          text: "We value the natural beauty of metal, gemstone, and form, without overloading a piece with unnecessary elements."
        },
        {
          number: "04",
          title: "Modern ease of choice",
          text: "We combine the atmosphere of an atelier with a digital experience that makes choosing jewelry clear and enjoyable."
        }
      ]
    },
    cta: {
      title: "Choose a finished piece or create your own",
      text: "Aurora Atelier brings together a ready collection and the freedom of personal design. You can select a piece that already fits your style or move to the constructor and create jewelry shaped by the materials and details that feel right for you.",
      primaryCta: "Explore Collection",
      secondaryCta: "Design Your Piece"
    }
  }
};

export const REFERENCE_COPY = {
  uk: {
    navHome: "Головна",
    navCollection: "Колекція",
    navConstructor: "Конструктор",
    navAbout: "Про нас",
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
    twoPaths: {
      eyebrow: "ЯК ПОЧАТИ",
      title: "Оберіть формат, який підходить саме вам",
      collection: {
        label: "ГОТОВА КОЛЕКЦІЯ",
        title: "Авторські прикраси, готові до замовлення",
        text:
          "Каблучки, сережки, браслети та підвіски з продуманою формою, каменем і настроєм.",
        cta: "Переглянути колекцію",
        tags: ["Каблучки", "Сережки", "Браслети", "Підвіски"],
        href: "/catalog"
      },
      constructor: {
        label: "ПЕРСОНАЛЬНИЙ ДИЗАЙН",
        title: "Створіть прикрасу у власному стилі",
        text:
          "Оберіть тип виробу, метал, камінь і деталі для прикраси, що відчувається особистою.",
        cta: "Відкрити конструктор",
        tags: ["Метал", "Камінь", "Розмір", "Деталі"],
        href: "/constructor"
      }
    },
    homeCategories: {
      eyebrow: "КАТЕГОРІЇ",
      title: "Знайдіть прикрасу за формою",
      subtitle:
        "Почніть із виробу, який найближчий саме вам: каблучки, сережок, браслета або підвіски.",
      rings: {
        title: "Каблучки",
        text:
          "Витончені акценти для щоденного образу, важливої події або особистого символу.",
        cta: "Дивитися каблучки",
        href: "/catalog?type=Ring",
        type: "Ring"
      },
      earrings: {
        title: "Сережки",
        text:
          "Делікатні форми, що підкреслюють світло обличчя та додають образу завершеності.",
        cta: "Дивитися сережки",
        href: "/catalog?type=Earrings",
        type: "Earrings"
      },
      bracelets: {
        title: "Браслети",
        text:
          "М’які лінії металу й каменю для акценту на зап’ясті — стриманого, але помітного.",
        cta: "Дивитися браслети",
        href: "/catalog?type=Bracelet",
        type: "Bracelet"
      },
      pendants: {
        title: "Підвіски",
        text:
          "Особистий символ ближче до серця — у металі, камені та формі, що мають значення.",
        cta: "Дивитися підвіски",
        href: "/catalog?type=Pendant",
        type: "Pendant"
      }
    },
    featuredEyebrow: "ВИБІР МАЙСТЕРНІ",
    featuredTitle: "Найцінніші прикраси колекції",
    featuredSubtitle: "Добірка виробів із найвищого цінового сегмента Aurora Atelier — складніші форми, виразні камені й більше ручної роботи в кожній деталі.",
    featuredEmptyText: "Колекція скоро з’явиться.",
    featuredCardBadge: "Вибір майстерні",
    catalogButton: "Переглянути всю колекцію",
    bespokeEyebrow: "КОНСТРУКТОР AURORA",
    bespokeTitle: "Створіть прикрасу,\nякої ще не існує",
    bespokeSubtitle: "Оберіть тип прикраси, метал, камінь і гравіювання — конструктор допоможе зібрати персональний дизайн у спокійному, виразному ритмі.",
    bespokeCta: "Відкрити конструктор",
    bespokeNote: "Персональний дизайн із прозорою ціною перед замовленням.",
    bespokePreviewEyebrow: "Персональний дизайн",
    bespokePreviewTitle: "Прикраса, зібрана під ваш характер",
    bespokePreviewLive: "Реальні параметри конструктора",
    bespokePreviewNote: "Тип, метал, камінь і персональний штрих — у спокійній композиції, що відчувається як ваша.",
    bespokePreviewChipEngraving: "Гравіювання",
    bespokeSteps: [
      {
        number: "01",
        title: "Тип прикраси",
        text: "Оберіть форму, з якої починається ваш майбутній виріб."
      },
      {
        number: "02",
        title: "Метал",
        text: "Від срібла до золота — основа задає тон і настрій прикраси."
      },
      {
        number: "03",
        title: "Камінь",
        text: "Камінь додає світло, акцент і характер усій композиції."
      },
      {
        number: "04",
        title: "Гравіювання",
        text: "Особистий штрих, який робить дизайн ще ближчим саме вам."
      }
    ],
    editorialEyebrow: "ПІДХІД МАЙСТЕРНІ",
    editorialTitle: "Прикраси, у яких важлива кожна деталь",
    editorialSubtitle:
      "Aurora Atelier поєднує готову колекцію, персональний конструктор і уважну роботу з кожним виробом — від першої ідеї до прикраси, яку хочеться носити.",
    editorialCards: [
      {
        number: "01",
        title: "Ручна робота",
        text: "Кожен виріб створюється з увагою до форми, пропорцій і посадки, щоб прикраса виглядала природно, делікатно й відчувалася особистою."
      },
      {
        number: "02",
        title: "Персональний підхід",
        text: "Ви обираєте не просто прикрасу, а деталі, які мають значення саме для вас: тип виробу, матеріал, камінь і настрій майбутнього дизайну."
      },
      {
        number: "03",
        title: "Прозорий процес",
        text: "Параметри, комплектація та ціна зрозумілі до оформлення замовлення, тому кожен вибір у колекції чи конструкторі залишається усвідомленим."
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
    required: "* обов'язково",
    footerText: "Авторські прикраси для особистих ритуалів, важливих подарунків і щоденної елегантності.",
    footerCollections: "Колекції",
    readyPieces: "Готові вироби",
    footerAbout: "Про нас",
    contact: "Контакти",
    kharkivAtelier: "Харківське ательє"
  },
  en: {
    navHome: "Home",
    navCollection: "Collection",
    navConstructor: "Constructor",
    navAbout: "About",
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
    twoPaths: {
      eyebrow: "HOW TO BEGIN",
      title: "Choose the format that suits you best",
      collection: {
        label: "FINISHED COLLECTION",
        title: "Handcrafted jewelry ready to order",
        text:
          "Rings, earrings, bracelets, and pendants with a considered form, stone, and mood.",
        cta: "Explore the collection",
        tags: ["Rings", "Earrings", "Bracelets", "Pendants"],
        href: "/catalog"
      },
      constructor: {
        label: "PERSONAL DESIGN",
        title: "Create a jewel in your own style",
        text:
          "Choose the jewelry type, metal, stone, and details for a piece that feels personal.",
        cta: "Open the constructor",
        tags: ["Metal", "Stone", "Size", "Details"],
        href: "/constructor"
      }
    },
    homeCategories: {
      eyebrow: "CATEGORIES",
      title: "Find your piece by form",
      subtitle:
        "Begin with the jewelry type that feels closest to you: a ring, earrings, bracelet, or pendant.",
      rings: {
        title: "Rings",
        text:
          "Refined accents for everyday wear, meaningful moments, or a personal symbol.",
        cta: "Shop rings",
        href: "/catalog?type=Ring",
        type: "Ring"
      },
      earrings: {
        title: "Earrings",
        text:
          "Delicate forms that bring light close to the face and complete the look.",
        cta: "Shop earrings",
        href: "/catalog?type=Earrings",
        type: "Earrings"
      },
      bracelets: {
        title: "Bracelets",
        text:
          "Soft lines of metal and stone for the wrist — subtle, personal, and refined.",
        cta: "Shop bracelets",
        href: "/catalog?type=Bracelet",
        type: "Bracelet"
      },
      pendants: {
        title: "Pendants",
        text:
          "A personal symbol worn close to the heart, shaped through metal, stone, and meaning.",
        cta: "Shop pendants",
        href: "/catalog?type=Pendant",
        type: "Pendant"
      }
    },
    featuredEyebrow: "ATELIER SELECTION",
    featuredTitle: "The most precious pieces in the collection",
    featuredSubtitle: "A curated selection from the highest tier of Aurora Atelier — more intricate forms, expressive stones, and more handcrafted detail in every piece.",
    featuredEmptyText: "The collection will be available soon.",
    featuredCardBadge: "Atelier pick",
    catalogButton: "Explore the full collection",
    bespokeEyebrow: "AURORA CONSTRUCTOR",
    bespokeTitle: "Create a piece\nthat does not exist yet",
    bespokeSubtitle: "Choose the jewelry type, metal, stone, and engraving — the constructor helps shape a personal design with a calm, expressive rhythm.",
    bespokeCta: "Open the constructor",
    bespokeNote: "Personal design with transparent pricing before checkout.",
    bespokePreviewEyebrow: "Personal design",
    bespokePreviewTitle: "A piece assembled around your character",
    bespokePreviewLive: "Real constructor options",
    bespokePreviewNote: "Type, metal, stone, and a personal finishing touch — arranged as a calm editorial composition.",
    bespokePreviewChipEngraving: "Engraving",
    bespokeSteps: [
      {
        number: "01",
        title: "Jewelry type",
        text: "Choose the form that sets the direction for your future piece."
      },
      {
        number: "02",
        title: "Metal",
        text: "From silver to gold, the base defines the tone and mood of the design."
      },
      {
        number: "03",
        title: "Stone",
        text: "The stone brings light, emphasis, and character to the composition."
      },
      {
        number: "04",
        title: "Engraving",
        text: "A personal finishing touch that makes the design feel even more your own."
      }
    ],
    editorialEyebrow: "ATELIER APPROACH",
    editorialTitle: "Jewelry shaped with attention to every detail",
    editorialSubtitle:
      "Aurora Atelier brings together a finished collection, a personal constructor, and careful work with every piece — from the first idea to jewelry made to be worn.",
    editorialCards: [
      {
        number: "01",
        title: "Handcrafted work",
        text: "Each piece is created with attention to form, proportion, and fit, so the jewelry feels natural, delicate, and personal."
      },
      {
        number: "02",
        title: "Personal approach",
        text: "You choose more than a jewel — you choose the details that matter to you: the type of piece, material, stone, and mood of the future design."
      },
      {
        number: "03",
        title: "Transparent process",
        text: "Parameters, configuration, and price are clear before placing an order, so every choice in the collection or constructor feels considered."
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
    required: "* required",
    footerText: "Quietly expressive jewelry made for personal rituals, meaningful gifts and everyday elegance.",
    footerCollections: "Collections",
    readyPieces: "Ready pieces",
    footerAbout: "About",
    contact: "Contact",
    kharkivAtelier: "Kharkiv atelier"
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
  diamond: "/assets/generated/diamind.png",
  none: "/assets/preview/stone-none.svg",
  heart_charm: "/assets/images/product-heart.png"
};

export function compactCatalogFilters(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value)));
}

const FILTER_LABELS = {
  uk: {
    type: "Тип",
    metal: "Метал",
    stoneType: "Камінь",
    stoneShape: "Огранювання",
    stoneColor: "Колір",
    stoneSize: "Розмір каменю",
    ringSize: "Розмір каблучки",
    ringType: "Стиль каблучки",
    braceletLength: "Довжина браслета"
  },
  en: {
    type: "Type",
    metal: "Metal",
    stoneType: "Stone",
    stoneShape: "Cut",
    stoneColor: "Color",
    stoneSize: "Stone size",
    ringSize: "Ring size",
    ringType: "Ring style",
    braceletLength: "Bracelet length"
  }
};

const FILTER_VALUE_TRANSLATIONS = {
  uk: {
    Silver: "Срібло",
    Gold: "Золото",
    "Rose Gold": "Рожеве золото",
    Pearl: "Перлина",
    Diamond: "Діамант",
    Emerald: "Смарагд",
    Sapphire: "Сапфір",
    Topaz: "Топаз",
    Opal: "Опал",
    Garnet: "Гранат",
    Citrine: "Цитрин",
    Morganite: "Морґаніт",
    Zircon: "Циркон",
    Quartz: "Кварц",
    "Rose Quartz": "Рожевий кварц",
    Spinel: "Шпінель",
    Aquamarine: "Аквамарин",
    Tourmaline: "Турмалін",
    Moonstone: "Місячний камінь",
    White: "Білий",
    Cream: "Кремовий",
    Blue: "Синій",
    Aqua: "Аква",
    Green: "Зелений",
    Honey: "Медовий",
    Blush: "Рожевий",
    Burgundy: "Бургунді",
    Champagne: "Шампань",
    Clear: "Прозорий",
    Smoke: "Димчастий",
    Yellow: "Жовтий",
    Ice: "Крижаний",
    Round: "Коло",
    Oval: "Овал",
    Pear: "Груша",
    Princess: "Принцеса",
    "Emerald Cut": "Смарагдове",
    Baguette: "Багет",
    Heart: "Серце",
    Marquise: "Маркіз",
    Trillion: "Трильйон",
    Fashion: "Модерн",
    Minimal: "Мінімалізм",
    Statement: "Акцентний",
    Classic: "Класика",
    Evening: "Вечірній",
    Romantic: "Романтичний",
    Signature: "Signature"
  },
  en: {}
};

export function localizeProductFilterValue(value, locale = "uk") {
  if (!value) return value;
  return FILTER_VALUE_TRANSLATIONS[locale]?.[value] || value;
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

export function productAttributeEntries(filters = {}, locale = "uk") {
  const safeFilters = filters || {};
  const labels = FILTER_LABELS[locale] || FILTER_LABELS.en;
  const entries = [
    [labels.type, safeFilters.type ? localizeProductFilterValue(safeFilters.type, locale) : safeFilters.type],
    [labels.metal, localizeProductFilterValue(safeFilters.metal, locale)],
    [labels.stoneType, localizeProductFilterValue(safeFilters.stoneType, locale)],
    [labels.stoneShape, localizeProductFilterValue(safeFilters.stoneShape, locale)],
    [labels.stoneColor, localizeProductFilterValue(safeFilters.stoneColor, locale)],
    [labels.stoneSize, localizeProductFilterValue(safeFilters.stoneSize, locale)]
  ];

  if (safeFilters.type === "Ring") {
    entries.push(
      [labels.ringSize, localizeProductFilterValue(safeFilters.ringSize, locale)],
      [labels.ringType, localizeProductFilterValue(safeFilters.ringType, locale)]
    );
  }

  if (safeFilters.type === "Bracelet") {
    entries.push([labels.braceletLength, localizeProductFilterValue(safeFilters.braceletLength, locale)]);
  }

  return entries.filter(([, value]) => Boolean(value));
}

export function productAttributeValues(filters = {}, locale = "uk") {
  return productAttributeEntries(filters, locale).map(([, value]) => value);
}

export function referenceCopy(locale) {
  return REFERENCE_COPY[locale] || REFERENCE_COPY.en;
}

export function productDisplayImage(product, index = 0) {
  return (
    product?.thumbnail_url ||
    product?.images?.[0]?.asset_path ||
    REFERENCE_IMAGES.productBySlug[product?.slug] ||
    REFERENCE_IMAGES.featured[index % REFERENCE_IMAGES.featured.length] ||
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

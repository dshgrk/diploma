const bcrypt = require("bcryptjs");
const { ORDER_STATUSES } = require("../../server/constants/order-statuses");
const { generateOrderNumber } = require("../../server/utils/order-number");

exports.seed = async function seed(knex) {
  await knex("notification_logs").del();
  await knex("payments").del();
  await knex("order_status_history").del();
  await knex("order_items").del();
  await knex("orders").del();
  await knex("promo_code_redemptions").del();
  await knex("promo_code_user_usage").del();
  await knex("promo_codes").del();
  await knex("cart_items").del();
  await knex("carts").del();
  await knex("design_option_values").del();
  await knex("design_options").del();
  await knex("product_images").del();
  await knex("products").del();
  await knex("materials").del();
  await knex("jewelry_types").del();
  await knex("sessions").del();
  await knex("users").del();

  if (knex.client.config.client === "sqlite3") {
    await knex("sqlite_sequence")
      .whereIn("name", [
        "users",
        "jewelry_types",
        "materials",
        "products",
        "product_images",
        "design_options",
        "design_option_values",
        "carts",
        "cart_items",
        "promo_codes",
        "promo_code_user_usage",
        "promo_code_redemptions",
        "orders",
        "order_items",
        "order_status_history",
        "payments",
        "notification_logs"
      ])
      .del();
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  const [adminId] = await knex("users").insert({
    role: "admin",
    full_name: "Майстер Studio Aurora",
    email: "admin@aurora.local",
    phone: "+380000000001",
    password_hash: passwordHash,
    auth_provider: "local",
    email_verified_at: knex.fn.now(),
    preferred_locale: "uk",
    is_active: true
  });

  const [clientId] = await knex("users").insert({
    role: "client",
    full_name: "Дарина Клієнт",
    email: "client@aurora.local",
    phone: "+380000000002",
    password_hash: passwordHash,
    auth_provider: "local",
    email_verified_at: knex.fn.now(),
    preferred_locale: "uk",
    is_active: true
  });

  const [ringTypeId] = await knex("jewelry_types").insert({
    code: "ring",
    name_uk: "Каблучка",
    name_en: "Ring",
    base_price: 1100,
    preview_base_asset: null,
    is_active: true
  });

  const [braceletTypeId] = await knex("jewelry_types").insert({
    code: "bracelet",
    name_uk: "Браслет",
    name_en: "Bracelet",
    base_price: 850,
    preview_base_asset: null,
    is_active: true
  });

  const [pendantTypeId] = await knex("jewelry_types").insert({
    code: "pendant",
    name_uk: "Підвіска",
    name_en: "Pendant",
    base_price: 950,
    preview_base_asset: null,
    is_active: true
  });

  const [earringsTypeId] = await knex("jewelry_types").insert({
    code: "earrings",
    name_uk: "Сережки",
    name_en: "Earrings",
    base_price: 980,
    preview_base_asset: null,
    is_active: true
  });

  const [silverId] = await knex("materials").insert({
    code: "silver",
    name_uk: "Срібло 925",
    name_en: "Silver 925",
    price_delta: 0,
    is_active: true
  });

  const [goldPlatedId] = await knex("materials").insert({
    code: "gold_plated",
    name_uk: "Позолота",
    name_en: "Gold plated",
    price_delta: 320,
    is_active: true
  });

  const [solidGoldId] = await knex("materials").insert({
    code: "solid_gold",
    name_uk: "Золото 585",
    name_en: "Solid gold 585",
    price_delta: 1250,
    is_active: true
  });

  const [steelId] = await knex("materials").insert({
    code: "jewelry_steel",
    name_uk: "Ювелірна сталь",
    name_en: "Jewelry steel",
    price_delta: -120,
    is_active: true
  });

  const catalogBlueprint = [
    { typeId: ringTypeId, typeCode: "ring", prefix: "RING", filterType: "Ring", uaType: "каблучка", enType: "ring", counts: { Silver: 3, Gold: 4, "Rose Gold": 3 } },
    { typeId: braceletTypeId, typeCode: "bracelet", prefix: "BRACELET", filterType: "Bracelet", uaType: "браслет", enType: "bracelet", counts: { Silver: 4, Gold: 3, "Rose Gold": 3 } },
    { typeId: earringsTypeId, typeCode: "earrings", prefix: "EARRINGS", filterType: "Earrings", uaType: "сережки", enType: "earrings", counts: { Silver: 3, Gold: 4, "Rose Gold": 3 } },
    { typeId: pendantTypeId, typeCode: "pendant", prefix: "PENDANT", filterType: null, uaType: "підвіска", enType: "pendant", counts: { Silver: 4, Gold: 3, "Rose Gold": 3 } }
  ];

  const namePairs = [
    ["Ранкова Зірка", "Morning Star"], ["Полярне Сяйво", "Polar Glow"], ["Тиха Хвиля", "Quiet Wave"],
    ["Оксамитовий Промінь", "Velvet Ray"], ["Нічна Роса", "Night Dew"], ["Бурштиновий Акцент", "Amber Accent"],
    ["Сонячна Лінія", "Sunline"], ["Кришталевий Ритм", "Crystal Rhythm"], ["М'який Вогонь", "Soft Flame"], ["Лунна Стежка", "Moon Path"]
  ];

  const metalUa = { Silver: "Срібло", Gold: "Золото", "Rose Gold": "Рожеве золото" };
  const metalEn = { Silver: "Silver", Gold: "Gold", "Rose Gold": "Rose Gold" };
  const stoneByMetal = {
    Silver: ["Sapphire", "Diamond", "None"],
    Gold: ["Diamond", "Emerald", "Sapphire"],
    "Rose Gold": ["Emerald", "Diamond", "None"]
  };
  const stoneMeta = {
    Diamond: { color: "White", shape: "Round", size: "1 ct" },
    Emerald: { color: "Green", shape: "Princess", size: "2 ct" },
    Sapphire: { color: "Blue", shape: "Oval", size: "0.5 ct" },
    None: { color: "White", shape: "Round", size: "0.5 ct" }
  };

  const createdProducts = [];
  for (const category of catalogBlueprint) {
    let localIndex = 0;
    const metals = Object.entries(category.counts).flatMap(([metal, count]) => Array.from({ length: count }, () => metal));

    for (const metal of metals) {
      const [uaNamePart, enNamePart] = namePairs[localIndex % namePairs.length];
      const sequence = String(localIndex + 1).padStart(2, "0");
      const sku = `AUR-${category.prefix}-${sequence}`;
      const slug = `${category.typeCode}-${enNamePart.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${metalEn[metal].toLowerCase().replace(/\s+/g, "-")}-${sequence}`;
      const stoneType = stoneByMetal[metal][localIndex % stoneByMetal[metal].length];
      const stone = stoneMeta[stoneType];
      const priceBase = category.typeCode === "ring" ? 3100 : category.typeCode === "bracelet" ? 2900 : category.typeCode === "earrings" ? 3300 : 2700;
      const metalDelta = metal === "Gold" ? 900 : metal === "Rose Gold" ? 760 : 0;
      const price = priceBase + metalDelta + localIndex * 35;

      const [productId] = await knex("products").insert({
        jewelry_type_id: category.typeId,
        sku,
        slug,
        name_uk: `${category.uaType} ${uaNamePart} (${metalUa[metal]})`,
        name_en: `${enNamePart} ${category.enType} (${metalEn[metal]})`,
        description_uk: `Авторська ${category.uaType} з колекції Aurora Atelier у металі ${metalUa[metal].toLowerCase()}. Камінь: ${stoneType === "None" ? "без каменю" : stoneType}. Створена для щоденного стилю та святкових образів.`,
        description_en: `Handcrafted ${category.enType} from Aurora Atelier in ${metalEn[metal].toLowerCase()}. Stone: ${stoneType === "None" ? "no stone" : stoneType}. Designed for both everyday styling and special occasions.`,
        price,
        currency: "UAH",
        filter_type: category.filterType,
        filter_metal: metal,
        filter_stone_type: stoneType,
        filter_stone_shape: stone.shape,
        filter_stone_color: stone.color,
        filter_stone_size: stone.size,
        filter_ring_size: category.typeCode === "ring" ? ["15", "16", "17", "18"][localIndex % 4] : null,
        filter_ring_type: category.typeCode === "ring" ? ["Engagement", "Wedding", "Fashion"][localIndex % 3] : null,
        filter_bracelet_length: category.typeCode === "bracelet" ? ["16 cm", "18 cm", "20 cm"][localIndex % 3] : null,
        is_active: true
      });

      await knex("product_images").insert({
        product_id: productId,
        asset_path: `/assets/images/generated/${category.typeCode}-${metalEn[metal].toLowerCase().replace(/\s+/g, "-")}-${sequence}.svg`,
        alt_uk: `${category.uaType} ${uaNamePart} на прозорому фоні`,
        alt_en: `${enNamePart} ${category.enType} on transparent background`,
        width: 1200,
        height: 1200,
        sort_order: 1,
        is_primary: true
      });

      createdProducts.push({ id: productId, category: category.typeCode, price });
      localIndex += 1;
    }
  }

  const heartProductId = createdProducts.find((item) => item.category === "pendant")?.id;
  const moonProductId = createdProducts.find((item) => item.category === "bracelet")?.id;
  const ringProductId = createdProducts.find((item) => item.category === "ring")?.id;
  const earringsProductId = createdProducts.find((item) => item.category === "earrings")?.id;
  async function insertOption(jewelryTypeId, code, labelUk, labelEn, sortOrder, overrides = {}) {
    const [id] = await knex("design_options").insert({
      jewelry_type_id: jewelryTypeId,
      code,
      label_uk: labelUk,
      label_en: labelEn,
      input_type: overrides.input_type || "select",
      is_required: overrides.is_required ?? true,
      sort_order: sortOrder,
      affects_price: overrides.affects_price ?? true,
      affects_preview: overrides.affects_preview ?? false,
      is_active: true
    });
    return id;
  }

  async function insertValues(designOptionId, values) {
    await knex("design_option_values").insert(
      values.map((value) => ({
        design_option_id: designOptionId,
        material_id: value.material_id || null,
        code: value.code,
        label_uk: value.label_uk,
        label_en: value.label_en,
        price_delta: value.price_delta,
        layer_key: value.layer_key || null,
        asset_path: value.asset_path || null,
        z_index: value.z_index || 0,
        metadata_json: value.metadata_json ? JSON.stringify(value.metadata_json) : null,
        is_active: true
      }))
    );
  }

  const materialValues = [
    { material_id: silverId, code: "silver", label_uk: "Срібло 925", label_en: "Silver 925", price_delta: 0, layer_key: "material", z_index: 1 },
    { material_id: goldPlatedId, code: "gold_plated", label_uk: "Позолота", label_en: "Gold plated", price_delta: 320, layer_key: "material", z_index: 1 },
    { material_id: solidGoldId, code: "solid_gold", label_uk: "Золото 585", label_en: "Solid gold 585", price_delta: 1250, layer_key: "material", z_index: 1 }
  ];
  const braceletMaterialValues = [
    { material_id: steelId, code: "jewelry_steel", label_uk: "Ювелірна сталь", label_en: "Jewelry steel", price_delta: -120, layer_key: "material", z_index: 1 },
    ...materialValues
  ];
  const stoneValues = [
    { code: "none", label_uk: "Без каменю", label_en: "No stone", price_delta: 0, layer_key: "stone", z_index: 3 },
    { code: "pearl", label_uk: "Перлина", label_en: "Pearl", price_delta: 180, layer_key: "stone", z_index: 3 },
    { code: "onyx", label_uk: "Онікс", label_en: "Onyx", price_delta: 160, layer_key: "stone", z_index: 3 },
    { code: "rose_quartz", label_uk: "Рожевий кварц", label_en: "Rose quartz", price_delta: 210, layer_key: "stone", z_index: 3 },
    { code: "garnet", label_uk: "Гранат", label_en: "Garnet", price_delta: 260, layer_key: "stone", z_index: 3 }
  ];

  const ringMaterialOptionId = await insertOption(ringTypeId, "material", "Матеріал", "Material", 1);
  const ringSizeOptionId = await insertOption(ringTypeId, "size", "Розмір", "Size", 2);
  const ringStoneOptionId = await insertOption(ringTypeId, "stone", "Камінь", "Stone", 3, { is_required: false, affects_preview: true });
  await insertOption(ringTypeId, "engraving_text", "Гравіювання", "Engraving", 4, { input_type: "text", is_required: false, affects_preview: true });

  const braceletMaterialOptionId = await insertOption(braceletTypeId, "material", "Матеріал", "Material", 1);
  const braceletSizeOptionId = await insertOption(braceletTypeId, "size", "Довжина", "Length", 2);
  const braceletStoneOptionId = await insertOption(braceletTypeId, "stone", "Камінь або шарм", "Stone or charm", 3, { is_required: false, affects_preview: true });
  await insertOption(braceletTypeId, "engraving_text", "Гравіювання", "Engraving", 4, { input_type: "text", is_required: false, affects_preview: true });

  const pendantMaterialOptionId = await insertOption(pendantTypeId, "material", "Матеріал", "Material", 1);
  const pendantShapeOptionId = await insertOption(pendantTypeId, "shape", "Форма", "Shape", 2, { affects_preview: true });
  const pendantStoneOptionId = await insertOption(pendantTypeId, "stone", "Камінь", "Stone", 3, { is_required: false, affects_preview: true });
  await insertOption(pendantTypeId, "engraving_text", "Гравіювання", "Engraving", 4, { input_type: "text", is_required: false, affects_preview: true });

  await insertValues(ringMaterialOptionId, materialValues);
  await insertValues(ringSizeOptionId, [
    { code: "16", label_uk: "16", label_en: "16", price_delta: 0 },
    { code: "17", label_uk: "17", label_en: "17", price_delta: 0 },
    { code: "18", label_uk: "18", label_en: "18", price_delta: 40 },
    { code: "19", label_uk: "19", label_en: "19", price_delta: 70 }
  ]);
  await insertValues(ringStoneOptionId, stoneValues);

  await insertValues(braceletMaterialOptionId, braceletMaterialValues);
  await insertValues(braceletSizeOptionId, [
    { code: "16", label_uk: "16 см", label_en: "16 cm", price_delta: 0 },
    { code: "17", label_uk: "17 см", label_en: "17 cm", price_delta: 30 },
    { code: "18", label_uk: "18 см", label_en: "18 cm", price_delta: 50 },
    { code: "19", label_uk: "19 см", label_en: "19 cm", price_delta: 70 }
  ]);
  await insertValues(braceletStoneOptionId, [
    ...stoneValues,
    { code: "heart_charm", label_uk: "Шарм серце", label_en: "Heart charm", price_delta: 140, layer_key: "charm", z_index: 3 }
  ]);

  await insertValues(pendantMaterialOptionId, materialValues);
  await insertValues(pendantShapeOptionId, [
    { code: "heart", label_uk: "Серце", label_en: "Heart", price_delta: 0, layer_key: "shape", z_index: 2 },
    { code: "moon", label_uk: "Місяць", label_en: "Moon", price_delta: 80, layer_key: "shape", z_index: 2 },
    { code: "drop", label_uk: "Крапля", label_en: "Drop", price_delta: 120, layer_key: "shape", z_index: 2 }
  ]);
  await insertValues(pendantStoneOptionId, stoneValues);

  const [activeCartId] = await knex("carts").insert({
    user_id: clientId,
    status: "active",
    currency: "UAH",
    active_cart_key: `active:${clientId}`
  });

  await knex("promo_codes").insert([
    {
      code: "WELCOME10",
      discount_type: "percent",
      discount_value: 10,
      min_order_amount: 800,
      max_redemptions: 500,
      per_user_limit: 1,
      description: "Welcome discount for the first atelier order",
      is_active: true
    },
    {
      code: "AURORA200",
      discount_type: "fixed_amount",
      discount_value: 200,
      min_order_amount: 1500,
      max_redemptions: null,
      per_user_limit: 3,
      description: "Fixed discount for larger orders",
      is_active: true
    }
  ]);

  await knex("cart_items").insert({
    cart_id: activeCartId,
    item_type: "ready_product",
    product_id: moonProductId,
    title_snapshot: "Браслет Місяць",
    unit_price: 999,
    quantity: 1
  });

  const confirmedOrderNumber = generateOrderNumber();
  const [confirmedOrderId] = await knex("orders").insert({
    order_number: confirmedOrderNumber,
    user_id: clientId,
    status: ORDER_STATUSES.CONFIRMED,
    customer_name: "Дарина Клієнт",
    email: "client@aurora.local",
    phone: "+380000000002",
    delivery_method: "nova_poshta",
    delivery_address: "Харків, відділення 1",
    subtotal_amount: 1299,
    total_amount: 1299,
    currency: "UAH",
    accepted_offer_at: knex.fn.now(),
    accepted_return_policy_at: knex.fn.now(),
    confirmed_at: knex.fn.now()
  });

  await knex("order_items").insert({
    order_id: confirmedOrderId,
    item_type: "ready_product",
    product_id: heartProductId,
    title_snapshot: "Срібна підвіска Серце",
    unit_price: 1299,
    quantity: 1,
    line_total: 1299
  });

  await knex("order_status_history").insert([
    { order_id: confirmedOrderId, old_status: null, new_status: ORDER_STATUSES.CREATED_PENDING_PAYMENT, changed_by_user_id: clientId, comment: "Замовлення створено в кабінеті" },
    { order_id: confirmedOrderId, old_status: ORDER_STATUSES.CREATED_PENDING_PAYMENT, new_status: ORDER_STATUSES.CONFIRMED, changed_by_user_id: clientId, comment: "Передплату підтверджено" }
  ]);

  await knex("payments").insert({
    order_id: confirmedOrderId,
    provider: "mock",
    provider_payment_id: `mock-${confirmedOrderNumber}`,
    status: "succeeded",
    amount: 1299,
    currency: "UAH",
    payload_json: JSON.stringify({ source: "seed" }),
    paid_at: knex.fn.now()
  });

  const inProgressOrderNumber = generateOrderNumber();
  const [inProgressOrderId] = await knex("orders").insert({
    order_number: inProgressOrderNumber,
    user_id: clientId,
    status: ORDER_STATUSES.IN_PROGRESS,
    customer_name: "Дарина Клієнт",
    email: "client@aurora.local",
    phone: "+380000000002",
    delivery_method: "courier",
    delivery_address: "Харків, вул. Сумська, 12",
    subtotal_amount: 1740,
    total_amount: 1740,
    currency: "UAH",
    accepted_offer_at: knex.fn.now(),
    accepted_return_policy_at: knex.fn.now(),
    confirmed_at: knex.fn.now(),
    in_progress_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
  });

  await knex("order_items").insert({
    order_id: inProgressOrderId,
    item_type: "custom_design",
    jewelry_type_id: pendantTypeId,
    title_snapshot: "Підвіска з рожевим кварцом",
    configuration_json: JSON.stringify({
      material: "gold_plated",
      shape: "drop",
      stone: "rose_quartz",
      engraving_text: "Love"
    }),
    unit_price: 1740,
    quantity: 1,
    line_total: 1740
  });

  await knex("order_status_history").insert([
    { order_id: inProgressOrderId, old_status: null, new_status: ORDER_STATUSES.CREATED_PENDING_PAYMENT, changed_by_user_id: clientId, comment: "Замовлення створено в кабінеті" },
    { order_id: inProgressOrderId, old_status: ORDER_STATUSES.CREATED_PENDING_PAYMENT, new_status: ORDER_STATUSES.CONFIRMED, changed_by_user_id: clientId, comment: "Передплату підтверджено" },
    { order_id: inProgressOrderId, old_status: ORDER_STATUSES.CONFIRMED, new_status: ORDER_STATUSES.IN_PROGRESS, changed_by_user_id: adminId, comment: "Майстер взяв виріб у роботу" }
  ]);

  await knex("payments").insert({
    order_id: inProgressOrderId,
    provider: "mock",
    provider_payment_id: `mock-${inProgressOrderNumber}`,
    status: "succeeded",
    amount: 1740,
    currency: "UAH",
    payload_json: JSON.stringify({ source: "seed" }),
    paid_at: knex.fn.now()
  });
};

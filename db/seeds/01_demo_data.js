const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { ORDER_STATUSES } = require("../../server/constants/order-statuses");
const { generateOrderNumber } = require("../../server/utils/order-number");
const { CATALOG_PRODUCTS } = require("../catalog-products");

const PRODUCT_ASSET_DIR = path.resolve(process.cwd(), "public", "assets", "products");
const PRODUCT_IMAGE_FALLBACKS = {
  ring: "/assets/images/aurora-jewelry-hero.png",
  bracelet: "/assets/images/product-moon.png",
  pendant: "/assets/images/product-heart.png",
  earrings: "/assets/images/aurora-jewelry-hero.png"
};

function resolveProductImageAsset(product) {
  const candidates = [
    `${product.slug}.png`,
    `${product.slug}.jpg`,
    `${product.slug}.jpeg`,
    `${product.slug}.webp`,
    `${product.slug}.svg`,
    `${product.name_en}.png`,
    `${product.name_en}.jpg`,
    `${product.name_en}.jpeg`,
    `${product.name_en}.webp`,
    `${product.name_en}.svg`
  ];

  for (const filename of candidates) {
    if (fs.existsSync(path.join(PRODUCT_ASSET_DIR, filename))) {
      return `/assets/products/${encodeURIComponent(filename)}`;
    }
  }

  return PRODUCT_IMAGE_FALLBACKS[product.type] || "/assets/images/aurora-jewelry-hero.png";
}

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

  const jewelryTypeIds = {
    ring: ringTypeId,
    bracelet: braceletTypeId,
    pendant: pendantTypeId,
    earrings: earringsTypeId
  };

  const productIdBySlug = {};
  for (const product of CATALOG_PRODUCTS) {
    const [productId] = await knex("products").insert({
      jewelry_type_id: jewelryTypeIds[product.type],
      sku: product.sku,
      slug: product.slug,
      name_uk: product.name_uk,
      name_en: product.name_en,
      description_uk: product.description_uk,
      description_en: product.description_en,
      price: product.price,
      currency: "UAH",
      filter_type: product.filter_type,
      filter_metal: product.metal,
      filter_stone_type: product.stoneType,
      filter_stone_shape: product.stoneShape,
      filter_stone_color: product.stoneColor,
      filter_stone_size: product.stoneSize,
      filter_ring_size: product.ringSize || null,
      filter_ring_type: product.ringType || null,
      filter_bracelet_length: product.braceletLength || null,
      is_active: true
    });
    productIdBySlug[product.slug] = productId;
  }

  await knex("product_images").insert(
    CATALOG_PRODUCTS.map((product) => ({
      product_id: productIdBySlug[product.slug],
      asset_path: resolveProductImageAsset(product),
      alt_uk: product.name_uk + " Aurora Atelier",
      alt_en: product.name_en + " by Aurora Atelier",
      width: 1200,
      height: 1200,
      sort_order: 1,
      is_primary: true
    }))
  );

  const heartProductId = productIdBySlug["silver-heart-pendant"];
  const moonProductId = productIdBySlug["moon-bracelet"];
  const ringProductId = productIdBySlug["quiet-pearl-ring"];
  const earringsProductId = productIdBySlug["white-diamond-earrings"];

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

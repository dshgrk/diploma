// Файл містить бізнес-логіку серверного модуля admin-catalog та готує дані для API.
const { db } = require("../../db/knex");
const { createHttpError } = require("../../utils/http-error");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { CATALOG_FILTERS, serializeProductFilters } = require("../catalog/catalog.filters");
const { readConstructorLayouts, writeConstructorLayouts } = require("../constructor/layouts.store");
const { listProductMeta, upsertProductMeta, listAssets } = require("../constructor/constructor-json.service");

const TYPE_FILTER_BY_JEWELRY_CODE = {
  ring: "Ring",
  bracelet: "Bracelet",
  pendant: "Pendant",
  earrings: "Earrings"
};

// Перетворює значення на число з fallback для адмін-каталогу.
function toNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw createHttpError(422, "VALIDATION_ERROR", `${field} must be a valid number`, { [field]: `${field} must be a valid number` });
  }
  return number;
}

// Перевіряє require text і повертає результат або кидає помилку валідації.
function requireText(payload, field, label = field) {
  const value = String(payload[field] || "").trim();
  if (!value) {
    throw createHttpError(422, "VALIDATION_ERROR", `${label} is required`, { [field]: `${label} is required` });
  }
  return value;
}

// Нормалізує normalize boolean, щоб API та UI працювали з однаковим форматом даних.
function normalizeBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

// Нормалізує normalize filter value, щоб API та UI працювали з однаковим форматом даних.
function normalizeFilterValue(payload, key) {
  const value = String(payload[key] || "").trim();
  if (!value) return null;
  if (!CATALOG_FILTERS[key]?.includes(value)) {
    throw createHttpError(422, "VALIDATION_ERROR", `${key} has an unsupported value`, {
      [key]: `${key} has an unsupported value`
    });
  }
  return value;
}

// Нормалізує normalize product filters, щоб API та UI працювали з однаковим форматом даних.
function normalizeProductFilters(payload, forcedType = "") {
  const type = forcedType || normalizeFilterValue(payload, "type");
  return {
    filter_type: type,
    filter_metal: normalizeFilterValue(payload, "metal"),
    filter_stone_type: normalizeFilterValue(payload, "stoneType"),
    filter_stone_shape: normalizeFilterValue(payload, "stoneShape"),
    filter_stone_color: normalizeFilterValue(payload, "stoneColor"),
    filter_stone_size: normalizeFilterValue(payload, "stoneSize"),
    filter_ring_size: type === "Ring" ? normalizeFilterValue(payload, "ringSize") : null,
    filter_ring_type: type === "Ring" ? normalizeFilterValue(payload, "ringType") : null,
    filter_bracelet_length: type === "Bracelet" ? normalizeFilterValue(payload, "braceletLength") : null
  };
}

// Формує URL-friendly slug з назви товару.
function slugify(value) {
  const translit = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye", ж: "zh", з: "z", и: "y", і: "i", ї: "yi", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "yu", я: "ya", ы: "y", э: "e", ё: "yo", ъ: ""
  };
  const source = String(value || "")
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => translit[char] ?? char)
    .join("");

  return source
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

// Підбирає унікальний slug, додаючи числовий суфікс при конфлікті.
async function ensureUniqueSlug(baseSlug, productId = null) {
  const normalizedBase = baseSlug || `product-${Date.now()}`;
  let slug = normalizedBase;
  let index = 2;

  while (true) {
    const existing = await db("products").where({ slug }).first();
    if (!existing || Number(existing.id) === Number(productId)) return slug;
    slug = `${normalizedBase}-${index}`;
    index += 1;
  }
}

// Повертає список даних list jewelry types у форматі, готовому для API або UI.
async function listJewelryTypes() {
  return db("jewelry_types")
    .select("id", "code", "name_uk", "name_en", "base_price", "preview_base_asset", "is_active")
    .orderBy("id", "asc")
    .then((records) => records.map((item) => ({ ...item, base_price: Number(item.base_price), is_active: Boolean(item.is_active) })));
}

// Повертає список даних list products у форматі, готовому для API або UI.
async function listProducts() {
  const [productMeta, assets] = await Promise.all([listProductMeta(), listAssets()]);
  const metaByProductId = Object.fromEntries(productMeta.map((item) => [item.product_id, item]));
  const assetById = Object.fromEntries(assets.map((item) => [item.id, item]));
  const products = await db("products as p")
    .leftJoin("jewelry_types as jt", "jt.id", "p.jewelry_type_id")
    .select(
      "p.*",
      "jt.code as jewelry_type_code",
      "jt.name_uk as jewelry_type_name_uk",
      "jt.name_en as jewelry_type_name_en"
    )
    .orderBy("p.created_at", "desc");

  const productIds = products.map((product) => product.id);
  const images = productIds.length
    ? await db("product_images").whereIn("product_id", productIds).andWhere({ is_primary: true })
    : [];
  const imageByProductId = images.reduce((accumulator, image) => {
    accumulator[image.product_id] = image;
    return accumulator;
  }, {});

  return products.map((product) => ({
    id: product.id,
    jewelry_type_id: product.jewelry_type_id,
    jewelry_type_code: product.jewelry_type_code,
    jewelry_type_name_uk: product.jewelry_type_name_uk,
    jewelry_type_name_en: product.jewelry_type_name_en,
    sku: product.sku,
    slug: product.slug,
    name_uk: product.name_uk,
    name_en: product.name_en,
    description_uk: product.description_uk,
    description_en: product.description_en,
    price: Number(product.price),
    currency: product.currency,
    is_active: Boolean(product.is_active),
    filters: serializeProductFilters(product),
    image: imageByProductId[product.id] || null,
    variant_id: metaByProductId[product.id]?.variant_id || null,
    asset_id: metaByProductId[product.id]?.asset_id || null,
    asset_path: metaByProductId[product.id]?.asset_id ? assetById[metaByProductId[product.id].asset_id]?.path || null : null
  }));
}

// Отримує get product з поточного набору даних або конфігурації.
async function getProduct(id) {
  const [productMeta, assets] = await Promise.all([listProductMeta(), listAssets()]);
  const meta = productMeta.find((item) => Number(item.product_id) === Number(id)) || null;
  const asset = meta?.asset_id ? assets.find((item) => Number(item.id) === Number(meta.asset_id)) || null : null;
  const product = await db("products").where({ id }).first();
  if (!product) {
    throw createHttpError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }
  const image = await db("product_images").where({ product_id: id, is_primary: true }).first();
  return {
    ...product,
    price: Number(product.price),
    is_active: Boolean(product.is_active),
    filters: serializeProductFilters(product),
    image: image || null,
    variant_id: meta?.variant_id || null,
    asset_id: meta?.asset_id || null,
    asset_path: asset?.path || null
  };
}

// Перевіряє validate product payload і повертає результат або кидає помилку валідації.
function validateProductPayload(payload) {
  const price = toNumber(payload.price, "price");
  if (price < 0) {
    throw createHttpError(422, "VALIDATION_ERROR", "Price must be greater than or equal to 0", { price: "Price must be greater than or equal to 0" });
  }

  return {
    jewelry_type_id: toNumber(payload.jewelry_type_id, "jewelry_type_id"),
    sku: String(payload.sku || "").trim(),
    slug: String(payload.slug || "").trim(),
    name_uk: requireText(payload, "name_uk", "Ukrainian name"),
    name_en: requireText(payload, "name_en", "English name"),
    description_uk: requireText(payload, "description_uk", "Ukrainian description"),
    description_en: requireText(payload, "description_en", "English description"),
    price,
    currency: String(payload.currency || "UAH").trim().toUpperCase(),
    is_active: normalizeBoolean(payload.is_active),
    image_asset_path: String(payload.image_asset_path || "").trim(),
    image_alt_uk: String(payload.image_alt_uk || payload.name_uk || "").trim(),
    image_alt_en: String(payload.image_alt_en || payload.name_en || "").trim()
  };
}

// Перевіряє assert jewelry type exists і повертає результат або кидає помилку валідації.
async function assertJewelryTypeExists(id) {
  const type = await db("jewelry_types").where({ id }).first();
  if (!type) throw createHttpError(422, "VALIDATION_ERROR", "Jewelry type does not exist", { jewelry_type_id: "Jewelry type does not exist" });
  return type;
}

// Замінює головне зображення товару й підтримує тільки один primary image.
async function replacePrimaryImage(productId, payload) {
  await db("product_images").where({ product_id: productId, is_primary: true }).del();
  if (!payload.image_asset_path) return;

  await db("product_images").insert({
    product_id: productId,
    asset_path: payload.image_asset_path,
    alt_uk: payload.image_alt_uk || payload.name_uk,
    alt_en: payload.image_alt_en || payload.name_en,
    width: 1200,
    height: 1200,
    sort_order: 1,
    is_primary: true
  });
}

// Створює новий запис або чернетку для create product.
async function createProduct(payload) {
  const data = validateProductPayload(payload);
  const jewelryType = await assertJewelryTypeExists(data.jewelry_type_id);
  data.filters = normalizeProductFilters(payload, TYPE_FILTER_BY_JEWELRY_CODE[jewelryType.code] || "");
  data.sku = data.sku || `AUR-${Date.now()}`;
  data.slug = await ensureUniqueSlug(slugify(data.slug || data.name_en || data.name_uk));

  const [id] = await db("products").insert({
    jewelry_type_id: data.jewelry_type_id,
    sku: data.sku,
    slug: data.slug,
    name_uk: data.name_uk,
    name_en: data.name_en,
    description_uk: data.description_uk,
    description_en: data.description_en,
    price: data.price,
    currency: data.currency,
    is_active: data.is_active,
    ...data.filters
  });
  await replacePrimaryImage(id, data);
  await upsertProductMeta({ product_id: id, variant_id: payload.variant_id, asset_id: payload.asset_id });
  return getProduct(id);
}

// Оновлює існуючі дані update product без зміни решти стану.
async function updateProduct(id, payload) {
  const product = await db("products").where({ id }).first();
  if (!product) throw createHttpError(404, "PRODUCT_NOT_FOUND", "Product not found");

  const data = validateProductPayload(payload);
  const jewelryType = await assertJewelryTypeExists(data.jewelry_type_id);
  data.filters = normalizeProductFilters(payload, TYPE_FILTER_BY_JEWELRY_CODE[jewelryType.code] || "");
  data.sku = data.sku || `AUR-${id}`;
  data.slug = await ensureUniqueSlug(slugify(data.slug || data.name_en || data.name_uk), id);
  await db("products").where({ id }).update({
    jewelry_type_id: data.jewelry_type_id,
    sku: data.sku,
    slug: data.slug,
    name_uk: data.name_uk,
    name_en: data.name_en,
    description_uk: data.description_uk,
    description_en: data.description_en,
    price: data.price,
    currency: data.currency,
    is_active: data.is_active,
    ...data.filters,
    updated_at: db.fn.now()
  });
  await replacePrimaryImage(id, data);
  await upsertProductMeta({ product_id: id, variant_id: payload.variant_id, asset_id: payload.asset_id });
  return getProduct(id);
}

// Видаляє або деактивує запис deactivate product згідно з правилами модуля.
async function deactivateProduct(id) {
  await db("products").where({ id }).update({ is_active: false, updated_at: db.fn.now() });
  return getProduct(id);
}

// Зберігає зображення товару, читає його розміри та створює запис у БД.
async function uploadProductImage(payload) {
  const fileName = String(payload.file_name || "product.png").trim();
  const dataUrl = String(payload.data_url || "");
  const match = dataUrl.match(/^data:(image\/png|image\/jpeg);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw createHttpError(422, "INVALID_IMAGE", "Only PNG or JPG images are supported", {
      image: "Only PNG or JPG images are supported"
    });
  }

  const mime = match[1];
  const extension = mime === "image/png" ? "png" : "jpg";
  const bytes = Buffer.from(match[2], "base64");
  const maxBytes = 5 * 1024 * 1024;
  if (bytes.length > maxBytes) {
    throw createHttpError(422, "IMAGE_TOO_LARGE", "Image must be 5 MB or smaller", {
      image: "Image must be 5 MB or smaller"
    });
  }

  const safeBase = slugify(fileName.replace(/\.[^.]+$/, "")) || "product";
  const publicDir = path.resolve(process.cwd(), "public", "assets", "uploads", "products");
  await fs.mkdir(publicDir, { recursive: true });

  const storedName = `${safeBase}-${crypto.randomBytes(4).toString("hex")}.${extension}`;
  await fs.writeFile(path.join(publicDir, storedName), bytes);

  return {
    asset_path: `/assets/uploads/products/${storedName}`,
    file_name: storedName
  };
}

// Повертає список даних list materials у форматі, готовому для API або UI.
async function listMaterials() {
  return db("materials")
    .select("*")
    .orderBy("id", "asc")
    .then((records) => records.map((item) => ({ ...item, price_delta: Number(item.price_delta), is_active: Boolean(item.is_active) })));
}

// Перевіряє validate material payload і повертає результат або кидає помилку валідації.
function validateMaterialPayload(payload) {
  return {
    code: requireText(payload, "code", "Code"),
    name_uk: requireText(payload, "name_uk", "Ukrainian name"),
    name_en: requireText(payload, "name_en", "English name"),
    price_delta: toNumber(payload.price_delta ?? 0, "price_delta"),
    is_active: normalizeBoolean(payload.is_active)
  };
}

// Отримує get material з поточного набору даних або конфігурації.
async function getMaterial(id) {
  const material = await db("materials").where({ id }).first();
  if (!material) throw createHttpError(404, "MATERIAL_NOT_FOUND", "Material not found");
  return { ...material, price_delta: Number(material.price_delta), is_active: Boolean(material.is_active) };
}

// Створює новий запис або чернетку для create material.
async function createMaterial(payload) {
  const data = validateMaterialPayload(payload);
  const [id] = await db("materials").insert(data);
  return getMaterial(id);
}

// Оновлює існуючі дані update material без зміни решти стану.
async function updateMaterial(id, payload) {
  await getMaterial(id);
  const data = validateMaterialPayload(payload);
  await db("materials").where({ id }).update({ ...data, updated_at: db.fn.now() });
  return getMaterial(id);
}

// Видаляє або деактивує запис deactivate material згідно з правилами модуля.
async function deactivateMaterial(id) {
  await db("materials").where({ id }).update({ is_active: false, updated_at: db.fn.now() });
  return getMaterial(id);
}

// Повертає список даних list constructor admin config у форматі, готовому для API або UI.
async function listConstructorAdminConfig() {
  const [jewelryTypes, options, values, materials, layouts] = await Promise.all([
    listJewelryTypes(),
    db("design_options").select("*").orderBy("jewelry_type_id", "asc").orderBy("sort_order", "asc"),
    db("design_option_values").select("*").orderBy("design_option_id", "asc").orderBy("id", "asc"),
    listMaterials(),
    readConstructorLayouts()
  ]);

  return {
    jewelry_types: jewelryTypes,
    options: options.map((item) => ({ ...item, is_required: Boolean(item.is_required), affects_price: Boolean(item.affects_price), affects_preview: Boolean(item.affects_preview), is_active: Boolean(item.is_active) })),
    values: values.map((item) => ({ ...item, price_delta: Number(item.price_delta), is_active: Boolean(item.is_active) })),
    materials,
    layouts
  };
}

// Оновлює існуючі дані update constructor layouts без зміни решти стану.
async function updateConstructorLayouts(payload) {
  return writeConstructorLayouts(payload);
}

// Перевіряє validate option value payload і повертає результат або кидає помилку валідації.
function validateOptionValuePayload(payload) {
  return {
    design_option_id: toNumber(payload.design_option_id, "design_option_id"),
    material_id: payload.material_id ? toNumber(payload.material_id, "material_id") : null,
    code: requireText(payload, "code", "Code"),
    label_uk: requireText(payload, "label_uk", "Ukrainian label"),
    label_en: requireText(payload, "label_en", "English label"),
    price_delta: toNumber(payload.price_delta ?? 0, "price_delta"),
    layer_key: String(payload.layer_key || "").trim() || null,
    asset_path: String(payload.asset_path || "").trim() || null,
    z_index: Number.isFinite(Number(payload.z_index)) ? Number(payload.z_index) : 0,
    is_active: normalizeBoolean(payload.is_active)
  };
}

// Перевіряє assert option exists і повертає результат або кидає помилку валідації.
async function assertOptionExists(id) {
  const option = await db("design_options").where({ id }).first();
  if (!option) throw createHttpError(422, "VALIDATION_ERROR", "Design option does not exist", { design_option_id: "Design option does not exist" });
}

// Отримує get option value з поточного набору даних або конфігурації.
async function getOptionValue(id) {
  const value = await db("design_option_values").where({ id }).first();
  if (!value) throw createHttpError(404, "OPTION_VALUE_NOT_FOUND", "Constructor value not found");
  return { ...value, price_delta: Number(value.price_delta), is_active: Boolean(value.is_active) };
}

// Створює новий запис або чернетку для create option value.
async function createOptionValue(payload) {
  const data = validateOptionValuePayload(payload);
  await assertOptionExists(data.design_option_id);
  const [id] = await db("design_option_values").insert(data);
  return getOptionValue(id);
}

// Оновлює існуючі дані update option value без зміни решти стану.
async function updateOptionValue(id, payload) {
  await getOptionValue(id);
  const data = validateOptionValuePayload(payload);
  await assertOptionExists(data.design_option_id);
  await db("design_option_values").where({ id }).update({ ...data, updated_at: db.fn.now() });
  return getOptionValue(id);
}

// Видаляє або деактивує запис deactivate option value згідно з правилами модуля.
async function deactivateOptionValue(id) {
  await db("design_option_values").where({ id }).update({ is_active: false, updated_at: db.fn.now() });
  return getOptionValue(id);
}

module.exports = {
  createMaterial,
  createOptionValue,
  createProduct,
  deactivateMaterial,
  deactivateOptionValue,
  deactivateProduct,
  listConstructorAdminConfig,
  listJewelryTypes,
  listMaterials,
  listProducts,
  updateConstructorLayouts,
  updateMaterial,
  updateOptionValue,
  updateProduct,
  uploadProductImage
};

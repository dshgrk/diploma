// Файл містить логіку серверного модуля constructor.
const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const DB_DIR = path.resolve(process.cwd(), "db");
const FILES = {
  types: path.join(DB_DIR, "constructor.types.json"),
  variants: path.join(DB_DIR, "constructor.variants.json"),
  stones: path.join(DB_DIR, "constructor.stones.json"),
  assets: path.join(DB_DIR, "constructor.assets.json"),
  productMeta: path.join(DB_DIR, "product.meta.json")
};

const { DEFAULT_DATA } = require("./constructor-default-data");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// Виконує локальну логіку ensure dir для модуля серверного модуля constructor.
async function ensureDir() {
  await fs.mkdir(DB_DIR, { recursive: true });
}

// Зчитує дані для read or init з URL, localStorage, файлу або вхідного payload.
async function readOrInit(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf8");
    return clone(fallback);
  }
}

// Записує підготовлені дані write file json у файл, базу або зовнішнє сховище.
async function writeFileJson(filePath, data) {
  await ensureDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  return data;
}

// Зчитує дані для read studio data з URL, localStorage, файлу або вхідного payload.
async function readStudioData() {
  await ensureDir();
  const [types, variants, stones, assets, productMeta] = await Promise.all([
    readOrInit(FILES.types, DEFAULT_DATA.types),
    readOrInit(FILES.variants, DEFAULT_DATA.variants),
    readOrInit(FILES.stones, DEFAULT_DATA.stones),
    readOrInit(FILES.assets, DEFAULT_DATA.assets),
    readOrInit(FILES.productMeta, DEFAULT_DATA.productMeta)
  ]);

  return { types, variants, stones, assets, productMeta };
}

// Виконує локальну логіку next numeric id для модуля серверного модуля constructor.
function nextNumericId(items) {
  return (items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) || 0) + 1;
}

// Нормалізує normalize boolean, щоб API та UI працювали з однаковим форматом даних.
function normalizeBoolean(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return fallback;
}

// Виконує локальну логіку to number для модуля серверного модуля constructor.
function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

// Нормалізує normalize text, щоб API та UI працювали з однаковим форматом даних.
function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

// Виконує локальну логіку sort by order для модуля серверного модуля constructor.
function sortByOrder(items) {
  return [...items].sort((left, right) => (left.sort_order || 0) - (right.sort_order || 0) || String(left.id).localeCompare(String(right.id)));
}

// Формує структуру build public config для UI, API-відповіді або подальших розрахунків.
function buildPublicConfig(studioData, locale = "uk") {
  const types = sortByOrder(studioData.types.items.filter((item) => item.is_active !== false)).map((type) => ({
    id: type.id,
    code: type.code,
    name: locale === "en" ? type.name_en : type.name_uk,
    name_uk: type.name_uk,
    name_en: type.name_en,
    base_price: Number(type.base_price),
    materials: sortByOrder((type.materials || []).filter((item) => item.is_active !== false)).map((material) => ({
      code: material.code,
      label: locale === "en" ? material.name_en : material.name_uk,
      label_uk: material.name_uk,
      label_en: material.name_en,
      price_delta: Number(material.price_delta || 0),
      tone: material.tone || null
    })),
    size_options: sortByOrder((type.size_options || []).filter((item) => item.is_active !== false)).map((size) => ({
      code: size.code,
      label: locale === "en" ? size.label_en : size.label_uk,
      label_uk: size.label_uk,
      label_en: size.label_en,
      price_delta: Number(size.price_delta || 0),
      is_default: Boolean(size.is_default)
    })),
    engraving: type.engraving || { enabled: false, max_length: 0, price_delta: 0 }
  }));

  const assetsById = Object.fromEntries(studioData.assets.items.map((asset) => [asset.id, asset]));
  const stonesById = Object.fromEntries(studioData.stones.items.map((stone) => [stone.id, stone]));
  const activeVariants = sortByOrder(studioData.variants.items.filter((item) => item.is_active !== false));
  const slotsByVariant = {};

  activeVariants.forEach((variant) => {
    slotsByVariant[variant.id] = sortByOrder(
      studioData.variants.slots.filter((slot) => slot.variant_id === variant.id && slot.is_active !== false)
    ).map((slot) => ({
      id: slot.id,
      code: slot.code,
      label: locale === "en" ? slot.label_en : slot.label_uk,
      label_uk: slot.label_uk,
      label_en: slot.label_en,
      sort_order: slot.sort_order,
      x: Number(slot.x),
      y: Number(slot.y),
      scale_x: Number(slot.scale_x || 1),
      scale_y: Number(slot.scale_y || 1),
      diameter: Number(slot.diameter || 12),
      layer_mode: slot.layer_mode || "above"
    }));
  });

  return {
    types,
    variants: activeVariants.map((variant) => ({
      id: variant.id,
      type_id: variant.type_id,
      code: variant.code,
      name: locale === "en" ? variant.name_en : variant.name_uk,
      name_uk: variant.name_uk,
      name_en: variant.name_en,
      group: variant.group,
      subtype: variant.subtype,
      price_delta: Number(variant.price_delta || 0),
      base_asset_id: variant.base_asset_id,
      base_asset_url: assetsById[variant.base_asset_id]?.path || null
    })),
    slotsByVariant,
    stones: sortByOrder(studioData.stones.items.filter((stone) => stone.is_active !== false)).map((stone) => ({
      id: stone.id,
      code: stone.code,
      label: locale === "en" ? stone.name_en : stone.name_uk,
      label_uk: stone.name_uk,
      label_en: stone.name_en,
      asset_id: stone.asset_id,
      asset_url: stone.asset_id ? assetsById[stone.asset_id]?.path || null : null,
      default_scale_x: Number(stone.default_scale_x || 1),
      default_scale_y: Number(stone.default_scale_y || 1),
      default_layer_mode: stone.default_layer_mode || "above"
    })),
    variantStoneMatrix: sortByOrder(studioData.variants.variant_stones.filter((item) => item.is_enabled !== false)).map((entry) => ({
      ...entry,
      price_delta: Number(entry.price_delta || 0),
      stone_code: stonesById[entry.stone_id]?.code || null
    }))
  };
}

// Визначає потрібне значення resolve image metadata за поточним контекстом або вхідними параметрами.
async function resolveImageMetadata(absolutePath) {
  try {
    const meta = await sharp(absolutePath).metadata();
    return {
      width: Number(meta.width || 0),
      height: Number(meta.height || 0)
    };
  } catch (error) {
    return { width: 0, height: 0 };
  }
}

module.exports = {
  FILES,
  DEFAULT_DATA,
  buildPublicConfig,
  nextNumericId,
  normalizeBoolean,
  normalizeText,
  readStudioData,
  resolveImageMetadata,
  sortByOrder,
  toNumber,
  writeFileJson
};

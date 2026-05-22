const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const { BUSINESS_RULES } = require("../../constants/business-rules");

const DB_DIR = path.resolve(process.cwd(), "db");
const FILES = {
  types: path.join(DB_DIR, "constructor.types.json"),
  variants: path.join(DB_DIR, "constructor.variants.json"),
  stones: path.join(DB_DIR, "constructor.stones.json"),
  assets: path.join(DB_DIR, "constructor.assets.json"),
  productMeta: path.join(DB_DIR, "product.meta.json")
};

const DEFAULT_DATA = {
  types: {
    items: [
      {
        id: 1,
        code: "ring",
        name_uk: "Каблучка",
        name_en: "Ring",
        base_price: 1100,
        is_active: true,
        sort_order: 1,
        materials: [
          { code: "silver", name_uk: "\u0421\u0440\u0456\u0431\u043b\u043e", name_en: "Silver", price_delta: 0, tone: "#b7bec8", is_active: true, sort_order: 1 },
          { code: "gold", name_uk: "\u0417\u043e\u043b\u043e\u0442\u043e", name_en: "Gold", price_delta: 1250, tone: "#b8914f", is_active: true, sort_order: 2 },
          { code: "rose_gold", name_uk: "\u0420\u043e\u0436\u0435\u0432\u0435 \u0437\u043e\u043b\u043e\u0442\u043e", name_en: "Rose Gold", price_delta: 950, tone: "#c88d78", is_active: true, sort_order: 3 }
        ],
        size_options: [
          { code: "16", label_uk: "16", label_en: "16", price_delta: 0, is_default: true, is_active: true, sort_order: 1 },
          { code: "17", label_uk: "17", label_en: "17", price_delta: 0, is_active: true, sort_order: 2 },
          { code: "18", label_uk: "18", label_en: "18", price_delta: 40, is_active: true, sort_order: 3 },
          { code: "19", label_uk: "19", label_en: "19", price_delta: 70, is_active: true, sort_order: 4 }
        ],
        engraving: {
          enabled: true,
          max_length: 24,
          price_delta: BUSINESS_RULES.DEFAULT_ENGRAVING_PRICE,
          placeholder_uk: "Ініціали, дата або одне тихе слово",
          placeholder_en: "Initials, date or one quiet word"
        }
      },
      {
        id: 2,
        code: "bracelet",
        name_uk: "Браслет",
        name_en: "Bracelet",
        base_price: 850,
        is_active: true,
        sort_order: 2,
        materials: [
          { code: "silver", name_uk: "\u0421\u0440\u0456\u0431\u043b\u043e", name_en: "Silver", price_delta: 0, tone: "#b7bec8", is_active: true, sort_order: 1 },
          { code: "gold", name_uk: "\u0417\u043e\u043b\u043e\u0442\u043e", name_en: "Gold", price_delta: 1250, tone: "#b8914f", is_active: true, sort_order: 2 },
          { code: "rose_gold", name_uk: "\u0420\u043e\u0436\u0435\u0432\u0435 \u0437\u043e\u043b\u043e\u0442\u043e", name_en: "Rose Gold", price_delta: 950, tone: "#c88d78", is_active: true, sort_order: 3 }
        ],
        size_options: [
          { code: "16", label_uk: "16 см", label_en: "16 cm", price_delta: 0, is_default: true, is_active: true, sort_order: 1 },
          { code: "17", label_uk: "17 см", label_en: "17 cm", price_delta: 30, is_active: true, sort_order: 2 },
          { code: "18", label_uk: "18 см", label_en: "18 cm", price_delta: 50, is_active: true, sort_order: 3 },
          { code: "19", label_uk: "19 см", label_en: "19 cm", price_delta: 70, is_active: true, sort_order: 4 }
        ],
        engraving: {
          enabled: true,
          max_length: 24,
          price_delta: BUSINESS_RULES.DEFAULT_ENGRAVING_PRICE,
          placeholder_uk: "Ініціали, дата або одне тихе слово",
          placeholder_en: "Initials, date or one quiet word"
        }
      },
      {
        id: 3,
        code: "pendant",
        name_uk: "Підвіска",
        name_en: "Pendant",
        base_price: 950,
        is_active: true,
        sort_order: 3,
        materials: [
          { code: "silver", name_uk: "\u0421\u0440\u0456\u0431\u043b\u043e", name_en: "Silver", price_delta: 0, tone: "#b7bec8", is_active: true, sort_order: 1 },
          { code: "gold", name_uk: "\u0417\u043e\u043b\u043e\u0442\u043e", name_en: "Gold", price_delta: 1250, tone: "#b8914f", is_active: true, sort_order: 2 },
          { code: "rose_gold", name_uk: "\u0420\u043e\u0436\u0435\u0432\u0435 \u0437\u043e\u043b\u043e\u0442\u043e", name_en: "Rose Gold", price_delta: 950, tone: "#c88d78", is_active: true, sort_order: 3 }
        ],
        size_options: [],
        engraving: {
          enabled: true,
          max_length: 24,
          price_delta: BUSINESS_RULES.DEFAULT_ENGRAVING_PRICE,
          placeholder_uk: "Ініціали, дата або одне тихе слово",
          placeholder_en: "Initials, date or one quiet word"
        }
      },
      {
        id: 4,
        code: "earrings",
        name_uk: "Сережки",
        name_en: "Earrings",
        base_price: 980,
        is_active: true,
        sort_order: 4,
        materials: [
          { code: "silver", name_uk: "\u0421\u0440\u0456\u0431\u043b\u043e", name_en: "Silver", price_delta: 0, tone: "#b7bec8", is_active: true, sort_order: 1 },
          { code: "gold", name_uk: "\u0417\u043e\u043b\u043e\u0442\u043e", name_en: "Gold", price_delta: 1250, tone: "#b8914f", is_active: true, sort_order: 2 },
          { code: "rose_gold", name_uk: "\u0420\u043e\u0436\u0435\u0432\u0435 \u0437\u043e\u043b\u043e\u0442\u043e", name_en: "Rose Gold", price_delta: 950, tone: "#c88d78", is_active: true, sort_order: 3 }
        ],
        size_options: [],
        engraving: {
          enabled: false,
          max_length: 0,
          price_delta: 0,
          placeholder_uk: "",
          placeholder_en: ""
        }
      }
    ]
  },
  assets: {
    items: [
      { id: 1, kind: "jewelry-base", path: "/assets/generated/ring.png", width: 0, height: 0, label: "Ring base", tags: ["ring"], created_at: "seed" },
      { id: 2, kind: "jewelry-base", path: "/assets/generated/bracelet.png", width: 0, height: 0, label: "Bracelet base", tags: ["bracelet"], created_at: "seed" },
      { id: 3, kind: "jewelry-base", path: "/assets/generated/pendant1.png", width: 0, height: 0, label: "Pendant heart", tags: ["pendant", "heart"], created_at: "seed" },
      { id: 4, kind: "jewelry-base", path: "/assets/generated/pendant2.png", width: 0, height: 0, label: "Pendant moon", tags: ["pendant", "moon"], created_at: "seed" },
      { id: 5, kind: "jewelry-base", path: "/assets/generated/pendant3.png", width: 0, height: 0, label: "Pendant drop", tags: ["pendant", "drop"], created_at: "seed" },
      { id: 6, kind: "jewelry-base", path: "/assets/generated/earrings.png", width: 0, height: 0, label: "Earrings base", tags: ["earrings"], created_at: "seed" },
      { id: 7, kind: "stone", path: "/assets/generated/pearl.png", width: 0, height: 0, label: "Pearl", tags: ["stone"], created_at: "seed" },
      { id: 8, kind: "stone", path: "/assets/generated/onyx.png", width: 0, height: 0, label: "Onyx", tags: ["stone"], created_at: "seed" },
      { id: 9, kind: "stone", path: "/assets/generated/rose_quartz.png", width: 0, height: 0, label: "Rose quartz", tags: ["stone"], created_at: "seed" },
      { id: 10, kind: "stone", path: "/assets/generated/garnet.png", width: 0, height: 0, label: "Garnet", tags: ["stone"], created_at: "seed" },
      { id: 11, kind: "stone", path: "/assets/generated/opal.png", width: 0, height: 0, label: "Opal", tags: ["stone"], created_at: "seed" },
      { id: 12, kind: "stone", path: "/assets/generated/heart_charm.png", width: 0, height: 0, label: "Heart charm", tags: ["stone", "charm"], created_at: "seed" },
      { id: 13, kind: "stone", path: "/assets/generated/diamind.png", width: 0, height: 0, label: "Diamond", tags: ["stone"], created_at: "seed" }
    ]
  },
  stones: {
    items: [
      { id: 1, code: "none", name_uk: "Без каменю", name_en: "No stone", asset_id: null, default_scale_x: 1, default_scale_y: 1, default_layer_mode: "above", is_active: true, sort_order: 1 },
      { id: 2, code: "pearl", name_uk: "Перлина", name_en: "Pearl", asset_id: 7, default_scale_x: 1, default_scale_y: 1, default_layer_mode: "above", is_active: true, sort_order: 2 },
      { id: 3, code: "onyx", name_uk: "Онікс", name_en: "Onyx", asset_id: 8, default_scale_x: 1, default_scale_y: 1, default_layer_mode: "above", is_active: true, sort_order: 3 },
      { id: 4, code: "rose_quartz", name_uk: "Рожевий кварц", name_en: "Rose quartz", asset_id: 9, default_scale_x: 1, default_scale_y: 1, default_layer_mode: "above", is_active: true, sort_order: 4 },
      { id: 5, code: "garnet", name_uk: "Гранат", name_en: "Garnet", asset_id: 10, default_scale_x: 1, default_scale_y: 1, default_layer_mode: "above", is_active: true, sort_order: 5 },
      { id: 6, code: "opal", name_uk: "Опал", name_en: "Opal", asset_id: 11, default_scale_x: 1, default_scale_y: 1, default_layer_mode: "above", is_active: true, sort_order: 6 },
      { id: 7, code: "heart_charm", name_uk: "Шарм серце", name_en: "Heart charm", asset_id: 12, default_scale_x: 0.88, default_scale_y: 0.88, default_layer_mode: "above", is_active: true, sort_order: 7 },
      { id: 8, code: "diamond", name_uk: "Діамант", name_en: "Diamond", asset_id: 13, default_scale_x: 1, default_scale_y: 1, default_layer_mode: "above", is_active: true, sort_order: 8 }
    ]
  },
  variants: {
    items: [
      { id: 101, type_id: 1, code: "ring-trinity", name_uk: "Каблучка Trinity", name_en: "Trinity Ring", group: "ring", subtype: "trinity", base_asset_id: 1, is_active: true, sort_order: 1 },
      { id: 201, type_id: 2, code: "bracelet-orbit", name_uk: "Браслет Orbit", name_en: "Orbit Bracelet", group: "bracelet", subtype: "orbit", base_asset_id: 2, is_active: true, sort_order: 1 },
      { id: 301, type_id: 3, code: "pendant-heart", name_uk: "Підвіска Серце", name_en: "Heart Pendant", group: "pendant", subtype: "heart", base_asset_id: 3, is_active: true, sort_order: 1 },
      { id: 302, type_id: 3, code: "pendant-moon", name_uk: "Підвіска Місяць", name_en: "Moon Pendant", group: "pendant", subtype: "moon", base_asset_id: 4, is_active: true, sort_order: 2 },
      { id: 303, type_id: 3, code: "pendant-drop", name_uk: "Підвіска Крапля", name_en: "Drop Pendant", group: "pendant", subtype: "drop", base_asset_id: 5, is_active: true, sort_order: 3 },
      { id: 401, type_id: 4, code: "earrings-drop", name_uk: "Сережки Drop", name_en: "Drop Earrings", group: "earrings", subtype: "drop", base_asset_id: 6, is_active: true, sort_order: 1 }
    ],
    slots: [
      { id: 1001, variant_id: 101, code: "center", label_uk: "Центр", label_en: "Center", sort_order: 1, x: 50.4, y: 49.0, scale_x: 1, scale_y: 1, diameter: 18, layer_mode: "below", is_active: true },
      { id: 1002, variant_id: 101, code: "left", label_uk: "Ліворуч", label_en: "Left", sort_order: 2, x: 23.1, y: 53.4, scale_x: 1, scale_y: 1, diameter: 12, layer_mode: "below", is_active: true },
      { id: 1003, variant_id: 101, code: "right", label_uk: "Праворуч", label_en: "Right", sort_order: 3, x: 78.2, y: 53.4, scale_x: 1, scale_y: 1, diameter: 12, layer_mode: "below", is_active: true },
      { id: 2001, variant_id: 201, code: "slot-1", label_uk: "Камінь 1", label_en: "Stone 1", sort_order: 1, x: 50.0, y: 14.7, scale_x: 1, scale_y: 1, diameter: 11, layer_mode: "below", is_active: true },
      { id: 2002, variant_id: 201, code: "slot-2", label_uk: "Камінь 2", label_en: "Stone 2", sort_order: 2, x: 82.25, y: 31.05, scale_x: 1, scale_y: 1, diameter: 11, layer_mode: "below", is_active: true },
      { id: 2003, variant_id: 201, code: "slot-3", label_uk: "Камінь 3", label_en: "Stone 3", sort_order: 3, x: 82.05, y: 62.0, scale_x: 1, scale_y: 1, diameter: 11, layer_mode: "below", is_active: true },
      { id: 2004, variant_id: 201, code: "slot-4", label_uk: "Камінь 4", label_en: "Stone 4", sort_order: 4, x: 49.8, y: 77.2, scale_x: 1, scale_y: 1, diameter: 11, layer_mode: "below", is_active: true },
      { id: 2005, variant_id: 201, code: "slot-5", label_uk: "Камінь 5", label_en: "Stone 5", sort_order: 5, x: 17.75, y: 62.0, scale_x: 1, scale_y: 1, diameter: 11, layer_mode: "below", is_active: true },
      { id: 2006, variant_id: 201, code: "slot-6", label_uk: "Камінь 6", label_en: "Stone 6", sort_order: 6, x: 17.55, y: 31.05, scale_x: 1, scale_y: 1, diameter: 11, layer_mode: "below", is_active: true },
      { id: 3001, variant_id: 301, code: "pendant", label_uk: "Кулон", label_en: "Pendant", sort_order: 1, x: 50.3, y: 55.3, scale_x: 1, scale_y: 1, diameter: 16, layer_mode: "below", is_active: true },
      { id: 3002, variant_id: 302, code: "pendant", label_uk: "Кулон", label_en: "Pendant", sort_order: 1, x: 51.2, y: 53.5, scale_x: 1, scale_y: 1, diameter: 16, layer_mode: "below", is_active: true },
      { id: 3003, variant_id: 303, code: "pendant", label_uk: "Кулон", label_en: "Pendant", sort_order: 1, x: 49.8, y: 58.3, scale_x: 1, scale_y: 1, diameter: 16, layer_mode: "below", is_active: true },
      { id: 4001, variant_id: 401, code: "left", label_uk: "Ліва", label_en: "Left", sort_order: 1, x: 29.9, y: 65.1, scale_x: 1, scale_y: 1, diameter: 15, layer_mode: "below", is_active: true },
      { id: 4002, variant_id: 401, code: "right", label_uk: "Права", label_en: "Right", sort_order: 2, x: 70.8, y: 65.1, scale_x: 1, scale_y: 1, diameter: 15, layer_mode: "below", is_active: true }
    ],
    variant_stones: [
      { variant_id: 101, stone_id: 1, price_delta: 0, is_default: false, is_enabled: true, sort_order: 1 },
      { variant_id: 101, stone_id: 2, price_delta: 180, is_default: true, is_enabled: true, sort_order: 2 },
      { variant_id: 101, stone_id: 3, price_delta: 160, is_default: false, is_enabled: true, sort_order: 3 },
      { variant_id: 101, stone_id: 4, price_delta: 210, is_default: false, is_enabled: true, sort_order: 4 },
      { variant_id: 101, stone_id: 5, price_delta: 260, is_default: false, is_enabled: true, sort_order: 5 },
      { variant_id: 101, stone_id: 8, price_delta: 320, is_default: false, is_enabled: true, sort_order: 6 },
      { variant_id: 201, stone_id: 1, price_delta: 0, is_default: false, is_enabled: true, sort_order: 1 },
      { variant_id: 201, stone_id: 2, price_delta: 180, is_default: true, is_enabled: true, sort_order: 2 },
      { variant_id: 201, stone_id: 3, price_delta: 160, is_default: false, is_enabled: true, sort_order: 3 },
      { variant_id: 201, stone_id: 4, price_delta: 210, is_default: false, is_enabled: true, sort_order: 4 },
      { variant_id: 201, stone_id: 5, price_delta: 260, is_default: false, is_enabled: true, sort_order: 5 },
      { variant_id: 201, stone_id: 7, price_delta: 140, is_default: false, is_enabled: true, sort_order: 6 },
      { variant_id: 201, stone_id: 8, price_delta: 320, is_default: false, is_enabled: true, sort_order: 7 },
      { variant_id: 301, stone_id: 1, price_delta: 0, is_default: false, is_enabled: true, sort_order: 1 },
      { variant_id: 301, stone_id: 2, price_delta: 180, is_default: true, is_enabled: true, sort_order: 2 },
      { variant_id: 301, stone_id: 3, price_delta: 160, is_default: false, is_enabled: true, sort_order: 3 },
      { variant_id: 301, stone_id: 4, price_delta: 210, is_default: false, is_enabled: true, sort_order: 4 },
      { variant_id: 301, stone_id: 5, price_delta: 260, is_default: false, is_enabled: true, sort_order: 5 },
      { variant_id: 301, stone_id: 8, price_delta: 320, is_default: false, is_enabled: true, sort_order: 6 },
      { variant_id: 302, stone_id: 1, price_delta: 0, is_default: false, is_enabled: true, sort_order: 1 },
      { variant_id: 302, stone_id: 2, price_delta: 180, is_default: true, is_enabled: true, sort_order: 2 },
      { variant_id: 302, stone_id: 3, price_delta: 160, is_default: false, is_enabled: true, sort_order: 3 },
      { variant_id: 302, stone_id: 4, price_delta: 210, is_default: false, is_enabled: true, sort_order: 4 },
      { variant_id: 302, stone_id: 5, price_delta: 260, is_default: false, is_enabled: true, sort_order: 5 },
      { variant_id: 302, stone_id: 8, price_delta: 320, is_default: false, is_enabled: true, sort_order: 6 },
      { variant_id: 303, stone_id: 1, price_delta: 0, is_default: false, is_enabled: true, sort_order: 1 },
      { variant_id: 303, stone_id: 2, price_delta: 180, is_default: true, is_enabled: true, sort_order: 2 },
      { variant_id: 303, stone_id: 3, price_delta: 160, is_default: false, is_enabled: true, sort_order: 3 },
      { variant_id: 303, stone_id: 4, price_delta: 210, is_default: false, is_enabled: true, sort_order: 4 },
      { variant_id: 303, stone_id: 5, price_delta: 260, is_default: false, is_enabled: true, sort_order: 5 },
      { variant_id: 303, stone_id: 8, price_delta: 320, is_default: false, is_enabled: true, sort_order: 6 },
      { variant_id: 401, stone_id: 1, price_delta: 0, is_default: false, is_enabled: true, sort_order: 1 },
      { variant_id: 401, stone_id: 2, price_delta: 180, is_default: true, is_enabled: true, sort_order: 2 },
      { variant_id: 401, stone_id: 3, price_delta: 160, is_default: false, is_enabled: true, sort_order: 3 },
      { variant_id: 401, stone_id: 4, price_delta: 210, is_default: false, is_enabled: true, sort_order: 4 },
      { variant_id: 401, stone_id: 5, price_delta: 260, is_default: false, is_enabled: true, sort_order: 5 },
      { variant_id: 401, stone_id: 8, price_delta: 320, is_default: false, is_enabled: true, sort_order: 6 }
    ]
  },
  productMeta: {
    items: []
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function ensureDir() {
  await fs.mkdir(DB_DIR, { recursive: true });
}

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

async function writeFileJson(filePath, data) {
  await ensureDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  return data;
}

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

function nextNumericId(items) {
  return (items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) || 0) + 1;
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return fallback;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function sortByOrder(items) {
  return [...items].sort((left, right) => (left.sort_order || 0) - (right.sort_order || 0) || String(left.id).localeCompare(String(right.id)));
}

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

// Файл містить admin CRUD-операції для JSON-даних конструктора.
const { createHttpError } = require("../../utils/http-error");
const {
  FILES,
  nextNumericId,
  readStudioData,
  sortByOrder,
  toNumber,
  writeFileJson
} = require("./constructor-json.store");
const {
  normalizeSlotRecord,
  normalizeStoneRecord,
  normalizeTypeRecord,
  normalizeVariantRecord,
  normalizeVariantStoneDefaults,
  normalizeVariantStoneRecord,
  syncDefaultFlags
} = require("./constructor-normalizers");

// Записує тільки ті JSON-частини студії, які змінилися.
async function persistStudioParts(studio, keys) {
  await Promise.all(keys.map((key) => writeFileJson(FILES[key], studio[key])));
}

// Повертає повний admin-конфіг конструктора для CMS-екрана.
async function listAdminConstructorConfig() {
  const studio = await readStudioData();
  return {
    types: sortByOrder(studio.types.items),
    variants: sortByOrder(studio.variants.items),
    slots: sortByOrder(studio.variants.slots),
    stones: sortByOrder(studio.stones.items),
    variant_stones: sortByOrder(studio.variants.variant_stones),
    assets: sortByOrder(studio.assets.items),
    product_meta: studio.productMeta.items
  };
}

// Створює новий тип прикраси з унікальним code.
async function createType(payload) {
  const studio = await readStudioData();
  const record = normalizeTypeRecord(payload);
  if (studio.types.items.some((item) => item.code === record.code)) {
    throw createHttpError(422, "VALIDATION_ERROR", "Type code must be unique", { code: "Type code must be unique" });
  }
  record.id = nextNumericId(studio.types.items);
  studio.types.items.push(record);
  await writeFileJson(FILES.types, studio.types);
  return record;
}

// Оновлює існуючий тип прикраси без зміни його id.
async function updateType(typeId, payload) {
  const studio = await readStudioData();
  const index = studio.types.items.findIndex((item) => Number(item.id) === Number(typeId));
  if (index === -1) throw createHttpError(404, "TYPE_NOT_FOUND", "Type not found");
  const current = studio.types.items[index];
  const next = normalizeTypeRecord(payload, current);
  next.id = current.id;
  studio.types.items[index] = next;
  await writeFileJson(FILES.types, studio.types);
  return next;
}

// Видаляє тип прикраси разом із залежними варіантами, слотами і матрицею.
async function deleteType(typeId) {
  const studio = await readStudioData();
  const typeIndex = studio.types.items.findIndex((item) => Number(item.id) === Number(typeId));
  if (typeIndex === -1) throw createHttpError(404, "TYPE_NOT_FOUND", "Type not found");

  const variantIds = studio.variants.items
    .filter((item) => Number(item.type_id) === Number(typeId))
    .map((item) => Number(item.id));

  studio.types.items.splice(typeIndex, 1);
  studio.variants.items = studio.variants.items.filter((item) => Number(item.type_id) !== Number(typeId));
  studio.variants.slots = studio.variants.slots.filter((item) => !variantIds.includes(Number(item.variant_id)));
  studio.variants.variant_stones = studio.variants.variant_stones.filter((item) => !variantIds.includes(Number(item.variant_id)));
  studio.productMeta.items = studio.productMeta.items.map((item) => (
    variantIds.includes(Number(item.variant_id)) ? { ...item, variant_id: null } : item
  ));

  await persistStudioParts(studio, ["types", "variants", "productMeta"]);
  return { deleted: true, type_id: Number(typeId), variant_ids: variantIds };
}

// Створює новий варіант для наявного типу прикраси.
async function createVariant(payload) {
  const studio = await readStudioData();
  const record = normalizeVariantRecord(payload);
  if (!studio.types.items.some((item) => Number(item.id) === Number(record.type_id))) {
    throw createHttpError(422, "VALIDATION_ERROR", "Variant type does not exist", { type_id: "Variant type does not exist" });
  }
  record.id = nextNumericId(studio.variants.items);
  studio.variants.items.push(record);
  await writeFileJson(FILES.variants, studio.variants);
  return record;
}

// Оновлює варіант прикраси без зміни його id.
async function updateVariant(variantId, payload) {
  const studio = await readStudioData();
  const index = studio.variants.items.findIndex((item) => Number(item.id) === Number(variantId));
  if (index === -1) throw createHttpError(404, "VARIANT_NOT_FOUND", "Variant not found");
  const current = studio.variants.items[index];
  const next = normalizeVariantRecord(payload, current);
  next.id = current.id;
  studio.variants.items[index] = next;
  await writeFileJson(FILES.variants, studio.variants);
  return next;
}

// Видаляє варіант і очищає залежні слоти, матрицю та product meta.
async function deleteVariant(variantId) {
  const studio = await readStudioData();
  const variantIndex = studio.variants.items.findIndex((item) => Number(item.id) === Number(variantId));
  if (variantIndex === -1) throw createHttpError(404, "VARIANT_NOT_FOUND", "Variant not found");

  studio.variants.items.splice(variantIndex, 1);
  studio.variants.slots = studio.variants.slots.filter((item) => Number(item.variant_id) !== Number(variantId));
  studio.variants.variant_stones = studio.variants.variant_stones.filter((item) => Number(item.variant_id) !== Number(variantId));
  studio.productMeta.items = studio.productMeta.items.map((item) => (
    Number(item.variant_id) === Number(variantId) ? { ...item, variant_id: null } : item
  ));

  await persistStudioParts(studio, ["variants", "productMeta"]);
  return { deleted: true, variant_id: Number(variantId) };
}

// Створює слот каменю для варіанта прикраси.
async function createSlot(payload) {
  const studio = await readStudioData();
  const record = normalizeSlotRecord(payload);
  if (!studio.variants.items.some((item) => Number(item.id) === Number(record.variant_id))) {
    throw createHttpError(422, "VALIDATION_ERROR", "Variant does not exist", { variant_id: "Variant does not exist" });
  }
  record.id = nextNumericId(studio.variants.slots);
  studio.variants.slots.push(record);
  await writeFileJson(FILES.variants, studio.variants);
  return record;
}

// Оновлює слот каменю та його preview-координати.
async function updateSlot(slotId, payload) {
  const studio = await readStudioData();
  const index = studio.variants.slots.findIndex((item) => Number(item.id) === Number(slotId));
  if (index === -1) throw createHttpError(404, "SLOT_NOT_FOUND", "Slot not found");
  const current = studio.variants.slots[index];
  const next = normalizeSlotRecord(payload, current);
  next.id = current.id;
  studio.variants.slots[index] = next;
  await writeFileJson(FILES.variants, studio.variants);
  return next;
}

// Деактивує слот через той самий update-шлях, що й ручне редагування.
async function deactivateSlot(slotId) {
  return updateSlot(slotId, { ...(await readStudioData()).variants.slots.find((item) => Number(item.id) === Number(slotId)), is_active: false });
}

// Створює новий камінь для бібліотеки конструктора.
async function createStone(payload) {
  const studio = await readStudioData();
  const record = normalizeStoneRecord(payload);
  record.id = nextNumericId(studio.stones.items);
  studio.stones.items.push(record);
  await writeFileJson(FILES.stones, studio.stones);
  return record;
}

// Оновлює камінь, asset-зв'язок і стандартні параметри preview.
async function updateStone(stoneId, payload) {
  const studio = await readStudioData();
  const index = studio.stones.items.findIndex((item) => Number(item.id) === Number(stoneId));
  if (index === -1) throw createHttpError(404, "STONE_NOT_FOUND", "Stone not found");
  const current = studio.stones.items[index];
  const next = normalizeStoneRecord(payload, current);
  next.id = current.id;
  studio.stones.items[index] = next;
  await writeFileJson(FILES.stones, studio.stones);
  return next;
}

// Видаляє камінь і прибирає його з матриці варіантів.
async function deleteStone(stoneId) {
  const studio = await readStudioData();
  const stoneIndex = studio.stones.items.findIndex((item) => Number(item.id) === Number(stoneId));
  if (stoneIndex === -1) throw createHttpError(404, "STONE_NOT_FOUND", "Stone not found");

  const stone = studio.stones.items[stoneIndex];
  studio.stones.items.splice(stoneIndex, 1);
  studio.variants.variant_stones = normalizeVariantStoneDefaults(
    studio.variants.variant_stones.filter((item) => Number(item.stone_id) !== Number(stoneId))
  );

  await persistStudioParts(studio, ["stones", "variants"]);
  return { deleted: true, stone_id: Number(stoneId), stone_code: stone.code };
}

// Створює або оновлює запис матриці каменю для варіанта.
async function upsertVariantStone(payload) {
  const studio = await readStudioData();
  const record = normalizeVariantStoneRecord(payload);
  const index = studio.variants.variant_stones.findIndex((item) => Number(item.variant_id) === Number(record.variant_id) && Number(item.stone_id) === Number(record.stone_id));
  if (index === -1) {
    studio.variants.variant_stones.push(record);
  } else {
    studio.variants.variant_stones[index] = { ...studio.variants.variant_stones[index], ...record };
  }
  if (record.is_default) {
    studio.variants.variant_stones = studio.variants.variant_stones.map((item) => (
      Number(item.variant_id) === Number(record.variant_id) && Number(item.stone_id) !== Number(record.stone_id)
        ? { ...item, is_default: false }
        : item
    ));
  }
  await writeFileJson(FILES.variants, studio.variants);
  return record;
}

// Видаляє зв'язок каменю з варіантом і перенормалізовує default-прапорці.
async function deleteVariantStone(variantId, stoneId) {
  const studio = await readStudioData();
  const nextEntries = studio.variants.variant_stones.filter((item) => !(
    Number(item.variant_id) === Number(variantId) && Number(item.stone_id) === Number(stoneId)
  ));
  const targetVariantEntries = syncDefaultFlags(
    nextEntries
      .filter((item) => Number(item.variant_id) === Number(variantId))
      .sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
  );
  const unaffectedEntries = nextEntries.filter((item) => Number(item.variant_id) !== Number(variantId));
  studio.variants.variant_stones = [...unaffectedEntries, ...targetVariantEntries];
  await writeFileJson(FILES.variants, studio.variants);
  return { deleted: true, variant_id: Number(variantId), stone_id: Number(stoneId) };
}

// Повертає зв'язки product meta для синхронізації каталогу з конструктором.
async function listProductMeta() {
  const studio = await readStudioData();
  return studio.productMeta.items;
}

// Створює або оновлює product meta для зв'язку конструктора з каталогом.
async function upsertProductMeta(payload) {
  const studio = await readStudioData();
  const record = {
    product_id: toNumber(payload.product_id, 0),
    variant_id: payload.variant_id == null || payload.variant_id === "" ? null : toNumber(payload.variant_id, 0),
    asset_id: payload.asset_id == null || payload.asset_id === "" ? null : toNumber(payload.asset_id, 0)
  };
  const index = studio.productMeta.items.findIndex((item) => Number(item.product_id) === Number(record.product_id));
  if (index === -1) {
    studio.productMeta.items.push(record);
  } else {
    studio.productMeta.items[index] = record;
  }
  await writeFileJson(FILES.productMeta, studio.productMeta);
  return record;
}

module.exports = {
  createSlot,
  createStone,
  createType,
  createVariant,
  deleteSlot: deactivateSlot,
  deleteStone,
  deleteType,
  deleteVariant,
  deactivateSlot,
  deleteVariantStone,
  listAdminConstructorConfig,
  listProductMeta,
  upsertProductMeta,
  upsertVariantStone,
  updateSlot,
  updateStone,
  updateType,
  updateVariant
};

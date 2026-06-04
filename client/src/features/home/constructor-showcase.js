// Файл містить логіку головної сторінки.
// Виконує локальну логіку localized constructor value для модуля головної сторінки.
export function localizedConstructorValue(entry, locale, keys = ["label", "name"]) {
  if (!entry) return "";

  for (const key of keys) {
    const localized = entry?.[`${key}_${locale}`];
    if (localized) return localized;
    if (entry?.[key]) return entry[key];
  }

  return "";
}

// Виконує локальну логіку select constructor showcase type для модуля головної сторінки.
function selectConstructorShowcaseType(types = []) {
  const preferredCodes = ["pendant", "ring", "bracelet", "earrings"];
  return preferredCodes.map((code) => types.find((item) => item.code === code)).find(Boolean) || types[0] || null;
}

// Виконує локальну логіку select constructor showcase variant для модуля головної сторінки.
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

// Виконує локальну логіку select constructor showcase material для модуля головної сторінки.
function selectConstructorShowcaseMaterial(materials = []) {
  return [...materials].sort((left, right) => Number(right.price_delta || 0) - Number(left.price_delta || 0))[0] || materials[0] || null;
}

// Виконує локальну логіку select constructor showcase stone для модуля головної сторінки.
function selectConstructorShowcaseStone(stones = []) {
  const preferredCodes = ["diamond", "opal", "pearl", "garnet", "rose_quartz", "onyx", "heart_charm", "none"];
  return preferredCodes.map((code) => stones.find((item) => item.code === code)).find(Boolean) || stones[0] || null;
}

// Формує структуру build constructor showcase для UI, API-відповіді або подальших розрахунків.
export function buildConstructorShowcase(config, locale) {
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

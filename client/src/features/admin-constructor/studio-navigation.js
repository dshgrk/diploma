// Файл містить логіку адмін-конструктора.
// Формує структуру build studio home state для UI, API-відповіді або подальших розрахунків.
export function buildStudioHomeState() {
  return { section: "home" };
}

// Формує структуру build studio assets state для UI, API-відповіді або подальших розрахунків.
export function buildStudioAssetsState(extra = {}) {
  return {
    section: "assets",
    ...extra
  };
}

// Формує структуру build studio stones list state для UI, API-відповіді або подальших розрахунків.
export function buildStudioStonesListState(extra = {}) {
  return {
    section: "stones",
    stoneStep: "list",
    selectedStoneId: "",
    ...extra
  };
}

// Формує структуру build studio stone editor state для UI, API-відповіді або подальших розрахунків.
export function buildStudioStoneEditorState(stoneId, extra = {}) {
  return {
    section: "stones",
    stoneStep: "editor",
    selectedStoneId: stoneId,
    ...extra
  };
}

// Формує структуру build studio pricing state для UI, API-відповіді або подальших розрахунків.
export function buildStudioPricingState(selectedTypeId = "", selectedVariantId = "", extra = {}) {
  return {
    section: "pricing",
    selectedTypeId,
    selectedVariantId,
    ...extra
  };
}

// Формує структуру build studio jewelry types state для UI, API-відповіді або подальших розрахунків.
export function buildStudioJewelryTypesState(extra = {}) {
  return {
    section: "jewelry",
    jewelryStep: "types",
    editorSubview: "slots",
    selectedVariantId: "",
    selectedSlotId: "",
    selectedStoneId: "",
    ...extra
  };
}

// Формує структуру build studio jewelry variants state для UI, API-відповіді або подальших розрахунків.
export function buildStudioJewelryVariantsState(selectedTypeId, extra = {}) {
  return {
    section: "jewelry",
    jewelryStep: "variants",
    selectedTypeId,
    selectedVariantId: "",
    selectedSlotId: "",
    selectedStoneId: "",
    ...extra
  };
}

// Формує структуру build studio jewelry editor state для UI, API-відповіді або подальших розрахунків.
export function buildStudioJewelryEditorState({
  selectedTypeId,
  selectedVariantId,
  editorSubview = "slots",
  selectedSlotId = "",
  selectedStoneId = ""
}) {
  return {
    section: "jewelry",
    jewelryStep: "editor",
    editorSubview,
    selectedTypeId,
    selectedVariantId,
    selectedSlotId,
    selectedStoneId
  };
}

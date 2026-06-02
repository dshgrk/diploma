export function buildStudioHomeState() {
  return { section: "home" };
}

export function buildStudioAssetsState(extra = {}) {
  return {
    section: "assets",
    ...extra
  };
}

export function buildStudioStonesListState(extra = {}) {
  return {
    section: "stones",
    stoneStep: "list",
    selectedStoneId: "",
    ...extra
  };
}

export function buildStudioStoneEditorState(stoneId, extra = {}) {
  return {
    section: "stones",
    stoneStep: "editor",
    selectedStoneId: stoneId,
    ...extra
  };
}

export function buildStudioPricingState(selectedTypeId = "", selectedVariantId = "", extra = {}) {
  return {
    section: "pricing",
    selectedTypeId,
    selectedVariantId,
    ...extra
  };
}

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

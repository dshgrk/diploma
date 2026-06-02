export function clampPercent(value) {
  const numeric = Number.parseFloat(String(value || "").replace("%", ""));
  if (!Number.isFinite(numeric)) return "50%";
  return `${Math.min(100, Math.max(0, Number(numeric.toFixed(2))))}%`;
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Не вдалося завантажити зображення"));
    reader.readAsDataURL(file);
  });
}

export function getConstructorSlotKeys(typeCode) {
  if (typeCode === "bracelet") return ["slot-1", "slot-2", "slot-3", "slot-4", "slot-5", "slot-6"];
  if (typeCode === "ring") return ["left", "center", "right"];
  if (typeCode === "earrings") return ["left", "right"];
  return ["pendant"];
}

export function getLayoutEditorModel(layouts, typeCode, pendantShape, defaultBases, defaultPositions) {
  const safeLayouts = layouts || { bases: defaultBases, positions: defaultPositions };
  if (typeCode === "pendant") {
    const activeShape = pendantShape === "moon" || pendantShape === "drop" ? pendantShape : "heart";
    return {
      baseAsset: safeLayouts.bases?.pendant?.[activeShape] || defaultBases.pendant[activeShape],
      positions: {
        pendant: safeLayouts.positions?.pendant?.[activeShape] || defaultPositions.pendant[activeShape]
      },
      positionGroup: "pendant"
    };
  }

  return {
    baseAsset: safeLayouts.bases?.[typeCode] || defaultBases[typeCode],
    positions: safeLayouts.positions?.[typeCode] || defaultPositions[typeCode],
    positionGroup: typeCode
  };
}

export function updateLayoutBaseAsset(draft, typeCode, pendantShape, nextAssetPath) {
  const next = JSON.parse(JSON.stringify(draft));
  if (typeCode === "pendant") {
    next.bases.pendant[pendantShape] = nextAssetPath;
  } else {
    next.bases[typeCode] = nextAssetPath;
  }
  return next;
}

export function createStudioSlotDraft(variantId, order = 1) {
  return {
    variant_id: Number(variantId),
    code: `slot-${order}`,
    label_uk: `Камінь ${order}`,
    label_en: `Stone ${order}`,
    sort_order: order,
    x: 50,
    y: 50,
    scale_x: 1,
    scale_y: 1,
    diameter: 12,
    rotation_deg: 0,
    layer_mode: "above",
    is_active: true
  };
}

export function createStudioMaterialDraft(order = 1) {
  return {
    code: `material-${order}`,
    name_uk: `Матеріал ${order}`,
    name_en: `Material ${order}`,
    price_delta: 0,
    tone: "",
    is_active: true,
    sort_order: order
  };
}

export function createStudioTypeDraft(order = 1) {
  return {
    code: "",
    name_uk: "",
    name_en: "",
    base_price: 0,
    is_active: true,
    sort_order: order,
    materials: [createStudioMaterialDraft(1)],
    size_options: [],
    engraving: {
      enabled: false,
      max_length: 24,
      price_delta: 0,
      placeholder_uk: "",
      placeholder_en: ""
    }
  };
}

export function createStudioVariantDraft(typeId, order = 1) {
  return {
    type_id: Number(typeId) || 0,
    code: "",
    name_uk: "",
    name_en: "",
    group: "",
    subtype: "",
    price_delta: 0,
    base_asset_id: null,
    is_active: true,
    sort_order: order
  };
}

export function createStudioSizeDraft(order = 1) {
  return {
    code: `size-${order}`,
    label_uk: `Розмір ${order}`,
    label_en: `Size ${order}`,
    price_delta: 0,
    is_default: order === 1,
    is_active: true,
    sort_order: order
  };
}

export function slotStoredYToDisplayY(value) {
  return 100 - Number(value || 0);
}

export function slotDisplayYToStoredY(value) {
  return 100 - Number(value || 0);
}

export function readAdminConstructorLocationState() {
  const search = new URLSearchParams(window.location.search);
  return {
    section: search.get("section") || "home",
    jewelryStep: search.get("step") || "types",
    editorSubview: search.get("subview") || "slots",
    stoneStep: search.get("stoneStep") || "list",
    selectedTypeId: search.get("type") || "",
    selectedVariantId: search.get("variant") || "",
    selectedSlotId: search.get("slot") || "",
    selectedStoneId: search.get("stone") || ""
  };
}

export function isSameAdminConstructorState(left, right) {
  return ["section", "jewelryStep", "editorSubview", "stoneStep", "selectedTypeId", "selectedVariantId", "selectedSlotId", "selectedStoneId"].every(
    (key) => String(left?.[key] ?? "") === String(right?.[key] ?? "")
  );
}

export function normalizeAdminConstructorState(rawState, studio) {
  const safeState = {
    section: ["home", "jewelry", "stones", "assets", "pricing"].includes(rawState?.section) ? rawState.section : "home",
    jewelryStep: ["types", "variants", "editor"].includes(rawState?.jewelryStep) ? rawState.jewelryStep : "types",
    editorSubview: ["slots", "basic", "matrix", "preview"].includes(rawState?.editorSubview) ? rawState.editorSubview : "slots",
    stoneStep: ["list", "editor"].includes(rawState?.stoneStep) ? rawState.stoneStep : "list",
    selectedTypeId: String(rawState?.selectedTypeId || ""),
    selectedVariantId: String(rawState?.selectedVariantId || ""),
    selectedSlotId: String(rawState?.selectedSlotId || ""),
    selectedStoneId: String(rawState?.selectedStoneId || "")
  };

  if (!studio) return safeState;

  const types = studio.types || [];
  const variants = studio.variants || [];
  const slots = studio.slots || [];
  const stones = studio.stones || [];

  if (safeState.section === "home") {
    return {
      ...safeState,
      section: "home",
      jewelryStep: "types",
      editorSubview: "slots",
      stoneStep: "list",
      selectedTypeId: "",
      selectedVariantId: "",
      selectedSlotId: "",
      selectedStoneId: ""
    };
  }

  if (safeState.section === "assets") {
    return {
      ...safeState,
      section: "assets",
      jewelryStep: "types",
      editorSubview: "slots",
      stoneStep: "list",
      selectedTypeId: "",
      selectedVariantId: "",
      selectedSlotId: "",
      selectedStoneId: ""
    };
  }

  if (safeState.section === "stones") {
    const isNewStoneDraft = safeState.selectedStoneId === "new";
    const validStone = stones.find((item) => String(item.id) === safeState.selectedStoneId) || null;
    if (safeState.stoneStep === "editor" && (isNewStoneDraft || validStone)) {
      return {
        ...safeState,
        section: "stones",
        stoneStep: "editor",
        jewelryStep: "types",
        editorSubview: "slots",
        selectedTypeId: "",
        selectedVariantId: "",
        selectedSlotId: "",
        selectedStoneId: isNewStoneDraft ? "new" : String(validStone.id)
      };
    }
    return {
      ...safeState,
      section: "stones",
      stoneStep: "list",
      jewelryStep: "types",
      editorSubview: "slots",
      selectedTypeId: "",
      selectedVariantId: "",
      selectedSlotId: "",
      selectedStoneId: ""
    };
  }

  if (safeState.section === "pricing") {
    const validType = types.find((item) => String(item.id) === safeState.selectedTypeId) || null;
    if (!validType) {
      return {
        ...safeState,
        section: "pricing",
        jewelryStep: "types",
        editorSubview: "slots",
        stoneStep: "list",
        selectedTypeId: "",
        selectedVariantId: "",
        selectedSlotId: "",
        selectedStoneId: ""
      };
    }
    const typeVariants = variants.filter((item) => String(item.type_id) === String(validType.id));
    const validVariant = typeVariants.find((item) => String(item.id) === safeState.selectedVariantId) || null;
    return {
      ...safeState,
      section: "pricing",
      jewelryStep: "types",
      editorSubview: "slots",
      stoneStep: "list",
      selectedTypeId: String(validType.id),
      selectedVariantId: validVariant ? String(validVariant.id) : "",
      selectedSlotId: "",
      selectedStoneId: ""
    };
  }

  const isNewTypeDraft = safeState.selectedTypeId === "new";
  if (safeState.jewelryStep === "editor" && isNewTypeDraft) {
    return {
      ...safeState,
      section: "jewelry",
      jewelryStep: "editor",
      editorSubview: "basic",
      stoneStep: "list",
      selectedTypeId: "new",
      selectedVariantId: "",
      selectedSlotId: "",
      selectedStoneId: ""
    };
  }

  const validType = types.find((item) => String(item.id) === safeState.selectedTypeId) || null;
  if (!validType) {
    return {
      ...safeState,
      section: "jewelry",
      jewelryStep: "types",
      editorSubview: "slots",
      stoneStep: "list",
      selectedTypeId: "",
      selectedVariantId: "",
      selectedSlotId: "",
      selectedStoneId: ""
    };
  }

  if (safeState.jewelryStep === "types") {
    return {
      ...safeState,
      section: "jewelry",
      jewelryStep: "types",
      editorSubview: "slots",
      stoneStep: "list",
      selectedTypeId: String(validType.id),
      selectedVariantId: "",
      selectedSlotId: "",
      selectedStoneId: ""
    };
  }

  const typeVariants = variants.filter((item) => String(item.type_id) === String(validType.id));
  const isNewVariantDraft = safeState.selectedVariantId === "new";
  if (safeState.jewelryStep === "editor" && isNewVariantDraft) {
    return {
      ...safeState,
      section: "jewelry",
      jewelryStep: "editor",
      editorSubview: "basic",
      stoneStep: "list",
      selectedTypeId: String(validType.id),
      selectedVariantId: "new",
      selectedSlotId: "",
      selectedStoneId: ""
    };
  }

  const validVariant = typeVariants.find((item) => String(item.id) === safeState.selectedVariantId) || null;
  if (!validVariant) {
    return {
      ...safeState,
      section: "jewelry",
      jewelryStep: "variants",
      editorSubview: "slots",
      stoneStep: "list",
      selectedTypeId: String(validType.id),
      selectedVariantId: "",
      selectedSlotId: "",
      selectedStoneId: ""
    };
  }

  if (safeState.jewelryStep === "variants") {
    return {
      ...safeState,
      section: "jewelry",
      jewelryStep: "variants",
      editorSubview: "slots",
      stoneStep: "list",
      selectedTypeId: String(validType.id),
      selectedVariantId: "",
      selectedSlotId: "",
      selectedStoneId: ""
    };
  }

  const variantSlots = slots.filter((item) => String(item.variant_id) === String(validVariant.id) && item.is_active !== false);
  const validSlot = variantSlots.find((item) => String(item.id) === safeState.selectedSlotId) || variantSlots[0] || null;
  return {
    ...safeState,
    section: "jewelry",
    jewelryStep: "editor",
    editorSubview: safeState.editorSubview,
    stoneStep: "list",
    selectedTypeId: String(validType.id),
    selectedVariantId: String(validVariant.id),
    selectedSlotId: validSlot ? String(validSlot.id) : "",
    selectedStoneId: ""
  };
}

export function buildAdminConstructorSearch(state) {
  if (state.section === "home") return "";
  const params = new URLSearchParams();
  params.set("section", state.section);

  if (state.section === "jewelry") {
    params.set("step", state.jewelryStep);
    if (state.jewelryStep === "editor") {
      params.set("subview", state.editorSubview);
    }
    if (state.selectedTypeId && state.selectedTypeId !== "new") {
      params.set("type", state.selectedTypeId);
    }
    if (state.jewelryStep === "editor" && state.selectedVariantId && state.selectedVariantId !== "new") {
      params.set("variant", state.selectedVariantId);
    } else if (state.jewelryStep === "variants" && state.selectedTypeId && state.selectedTypeId !== "new") {
      params.set("type", state.selectedTypeId);
    }
    if (state.jewelryStep === "editor" && state.selectedSlotId) {
      params.set("slot", state.selectedSlotId);
    }
  }

  if (state.section === "stones") {
    params.set("stoneStep", state.stoneStep);
    if (state.stoneStep === "editor" && state.selectedStoneId && state.selectedStoneId !== "new") {
      params.set("stone", state.selectedStoneId);
    }
  }

  if (state.section === "pricing") {
    if (state.selectedTypeId && state.selectedTypeId !== "new") {
      params.set("type", state.selectedTypeId);
    }
    if (state.selectedVariantId && state.selectedVariantId !== "new") {
      params.set("variant", state.selectedVariantId);
    }
  }

  return params.toString();
}

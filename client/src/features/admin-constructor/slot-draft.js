export function cloneSlotDraft(draft) {
  return draft ? JSON.parse(JSON.stringify(draft)) : null;
}

export function slotDraftComparableKeys() {
  return [
    "code",
    "label_uk",
    "label_en",
    "sort_order",
    "x",
    "y",
    "scale_x",
    "scale_y",
    "diameter",
    "rotation_deg",
    "layer_mode"
  ];
}

export function slotDraftMatches(left, right) {
  if (!left || !right) return false;
  return slotDraftComparableKeys().every((key) => String(left[key] ?? "") === String(right[key] ?? ""));
}

export function isSlotDraftDirtyAgainstPersisted(draft, persistedSlot) {
  if (!draft) return false;
  if (!draft.id) return true;
  if (!persistedSlot) return true;
  return slotDraftComparableKeys().some((key) => String(draft[key] ?? "") !== String(persistedSlot[key] ?? ""));
}

export function resolveSlotDraftById(slotId, currentDraft, slots) {
  if (String(currentDraft?.id) === String(slotId)) {
    return currentDraft;
  }
  return slots.find((slot) => String(slot.id) === String(slotId)) || null;
}

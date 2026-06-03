// Файл містить логіку адмін-конструктора.
// Виконує локальну логіку clone slot draft для модуля адмін-конструктора.
export function cloneSlotDraft(draft) {
  return draft ? JSON.parse(JSON.stringify(draft)) : null;
}

// Виконує локальну логіку slot draft comparable keys для модуля адмін-конструктора.
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

// Виконує локальну логіку slot draft matches для модуля адмін-конструктора.
export function slotDraftMatches(left, right) {
  if (!left || !right) return false;
  return slotDraftComparableKeys().every((key) => String(left[key] ?? "") === String(right[key] ?? ""));
}

// Перевіряє is slot draft dirty against persisted і повертає результат або кидає помилку валідації.
export function isSlotDraftDirtyAgainstPersisted(draft, persistedSlot) {
  if (!draft) return false;
  if (!draft.id) return true;
  if (!persistedSlot) return true;
  return slotDraftComparableKeys().some((key) => String(draft[key] ?? "") !== String(persistedSlot[key] ?? ""));
}

// Визначає потрібне значення resolve slot draft by id за поточним контекстом або вхідними параметрами.
export function resolveSlotDraftById(slotId, currentDraft, slots) {
  if (String(currentDraft?.id) === String(slotId)) {
    return currentDraft;
  }
  return slots.find((slot) => String(slot.id) === String(slotId)) || null;
}

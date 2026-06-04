// Файл рендерить вибір каменів по слотах у публічному конструкторі.
import React, { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { previewStoneStyle } from "../../jewelry-preview";
import { studioLocalizedName } from "./constructor-copy";

// Показує слоти виробу та панель вибору каменю для активного слота.
export function StudioConstructorSlots({ locale, slots, stones, selections, onSelectSlot }) {
  const [activeSlotId, setActiveSlotId] = useState(null);
  const activeSlot = slots.find((slot) => String(slot.id) === String(activeSlotId)) || null;
  const activeStoneCode = activeSlot ? selections?.[activeSlot.code] || "none" : "none";
  const selectedCount = slots.filter((slot) => selections?.[slot.code] && selections?.[slot.code] !== "none").length;
  const orderedSlots = useMemo(() => {
    const preferredOrder = ["left", "center", "right"];
    const ordered = preferredOrder.map((code) => slots.find((slot) => slot.code === code)).filter(Boolean);
    const remaining = slots.filter((slot) => !preferredOrder.includes(slot.code));
    return ordered.length ? [...ordered, ...remaining] : slots;
  }, [slots]);

  return (
    <div className="stone-slots-wrap">
      <div className="stone-slots-header">
        <span className="stone-count-badge">{selectedCount}/{slots.length} {locale === "en" ? "slots" : "слотів"}</span>
      </div>
      <div className="slots-row">
        {orderedSlots.map((slot) => {
          const selectedStone = stones.find((stone) => stone.code === selections?.[slot.code]) || null;
          const hasSelection = Boolean(selectedStone && selectedStone.code !== "none");
          const isActive = String(activeSlotId) === String(slot.id);
          return (
            <div className="slot-container" key={slot.id}>
              <button
                type="button"
                className={`stone-slot stone-slot-lg${hasSelection ? " slot-filled" : " slot-empty"}${isActive ? " slot-active" : ""}`}
                onClick={() => setActiveSlotId(isActive ? null : slot.id)}
                title={locale === "en" ? slot.label_en : slot.label_uk}
              >
                {hasSelection ? (
                  <span
                    className="constructor-gem constructor-gem-lg has-image"
                    style={previewStoneStyle({ x: 50, y: 50, diameter: 100, scale_x: 1, scale_y: 1 }, selectedStone, "slot")}
                  />
                ) : (
                  <span className="slot-add-icon">+</span>
                )}
              </button>
              <span className="slot-label">{locale === "en" ? slot.label_en : slot.label_uk}</span>
              {hasSelection ? <span className="slot-stone-name">{studioLocalizedName(selectedStone, locale)}</span> : null}
            </div>
          );
        })}
      </div>
      {activeSlot ? (
        <div className="stone-picker-panel">
          <p className="stone-picker-title">
            {locale === "en" ? "Choose stone for" : "Оберіть камінь для"} <strong>{locale === "en" ? activeSlot.label_en : activeSlot.label_uk}</strong>
          </p>
          <div className="stone-picker-grid">
            {stones.map((stone) => {
              const isCurrent = stone.code === activeStoneCode;
              return (
                <button
                  type="button"
                  key={stone.id}
                  className={`stone-pick-btn${isCurrent ? " current" : ""}`}
                  onClick={() => {
                    onSelectSlot(activeSlot.code, stone.code);
                    setActiveSlotId(null);
                  }}
                >
                  <span
                    className={`stone-pick-media${stone.asset_url ? " has-image" : ""}`}
                    style={stone.asset_url ? previewStoneStyle({ x: 50, y: 50, diameter: 100, scale_x: 1, scale_y: 1 }, stone, "picker") : undefined}
                  />
                  <span className="stone-pick-meta">
                    <span className="stone-pick-name">{studioLocalizedName(stone, locale)}</span>
                    <span className="stone-pick-price">{stone.price_delta > 0 ? `+${stone.price_delta}` : stone.price_delta || 0} грн</span>
                  </span>
                  {isCurrent ? <span className="stone-pick-check"><Check aria-hidden="true" size={12} /></span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

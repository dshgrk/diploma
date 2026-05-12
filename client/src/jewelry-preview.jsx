import React from "react";

export function buildStoneCodeMap(stones = []) {
  return Object.fromEntries((stones || []).map((stone) => [stone.code, stone]));
}

export function previewStoneStyle(slot, stone, mode = "preview") {
  const diameter = Number(slot?.diameter || 12);
  const scaleX = Number(slot?.scale_x || 1) * Number(stone?.default_scale_x || 1);
  const scaleY = Number(slot?.scale_y || 1) * Number(stone?.default_scale_y || 1);
  const visualBoost = stone?.code === "heart_charm"
    ? (mode === "preview" ? 0.98 : 0.94)
    : (mode === "preview" ? 1.28 : 1.22);
  const width = diameter * scaleX * visualBoost;
  const height = diameter * scaleY * visualBoost;
  const assetUrl = stone?.asset_url || null;

  if (mode === "picker") {
    return {
      backgroundImage: assetUrl ? `url(${assetUrl})` : undefined,
      backgroundColor: "transparent",
      backgroundSize: stone?.code === "heart_charm" ? "92%" : "122%",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center center"
    };
  }

  return {
    left: `${Number(slot?.x || 50)}%`,
    top: `${Number(slot?.y || 50)}%`,
    width: `${width}%`,
    height: `${height}%`,
    backgroundImage: assetUrl ? `url(${assetUrl})` : undefined,
    backgroundColor: "transparent",
    backgroundSize: mode === "picker" ? "92%" : "100% 100%",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center center"
  };
}

export function JewelryPreview({
  variant,
  slots = [],
  stonesByCode = {},
  selections = {},
  engraving = "",
  className = ""
}) {
  const orderedSlots = [...(slots || [])].sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0));
  const belowSlots = orderedSlots.filter((slot) => slot.layer_mode === "below");
  const aboveSlots = orderedSlots.filter((slot) => slot.layer_mode !== "below");

  function renderSlotStone(slot) {
    const stone = stonesByCode[selections?.[slot.code]];
    if (!stone?.asset_url) return null;
    return (
      <span
        key={slot.id || slot.code}
        className={`studio-preview-stone has-image ${slot.layer_mode === "below" ? "is-below" : "is-above"}`}
        style={previewStoneStyle(slot, stone)}
      />
    );
  }

  return (
    <div className={`studio-preview-art${className ? ` ${className}` : ""}`}>
      <div className="studio-preview-square">
        <div className="studio-preview-layer studio-preview-layer-below">
          {belowSlots.map(renderSlotStone)}
        </div>
        <div className="studio-preview-layer studio-preview-layer-base">
          {variant?.base_asset_url ? <img className="studio-preview-base" src={variant.base_asset_url} alt="" aria-hidden="true" /> : null}
        </div>
        <div className="studio-preview-layer studio-preview-layer-above">
          {aboveSlots.map(renderSlotStone)}
        </div>
        {!variant?.base_asset_url ? <div className="studio-preview-empty">No base asset</div> : null}
      </div>
      {engraving ? <div className="preview-engraving">"{engraving}"</div> : null}
    </div>
  );
}

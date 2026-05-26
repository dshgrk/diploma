import React from "react";

export function buildStoneCodeMap(stones = []) {
  return Object.fromEntries((stones || []).map((stone) => [stone.code, stone]));
}

function normalizeMaterialAssetSlug(materialCode) {
  const normalized = String(materialCode || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "rose_gold") return "rose-gold";
  return normalized.replaceAll("_", "-");
}

function assetStemFromUrl(assetUrl) {
  const normalized = String(assetUrl || "").trim();
  if (!normalized) return "";
  const filename = normalized.split("/").pop() || "";
  return filename.replace(/\.[^.]+$/, "");
}

export function buildMaterialAwareBaseAssetCandidates(variant, materialCode) {
  const fallbackAsset = String(variant?.base_asset_url || "").trim();
  const variantCode = String(variant?.code || "").trim();
  const materialSlug = normalizeMaterialAssetSlug(materialCode);
  const fallbackStem = assetStemFromUrl(fallbackAsset);
  const candidates = [];

  if (materialSlug) {
    if (variantCode) {
      if (fallbackAsset) {
        const assetPath = fallbackAsset.replace(/[^/]+$/, `${variantCode}-${materialSlug}.png`);
        candidates.push(assetPath);
      } else {
        candidates.push(`/assets/generated/${variantCode}-${materialSlug}.png`);
      }
    }

    if (fallbackStem) {
      if (fallbackAsset) {
        const assetPath = fallbackAsset.replace(/[^/]+$/, `${fallbackStem}-${materialSlug}.png`);
        candidates.push(assetPath);
      } else {
        candidates.push(`/assets/generated/${fallbackStem}-${materialSlug}.png`);
      }
    }
  }

  if (!candidates.length && variantCode && materialSlug) {
    if (fallbackAsset) {
      const assetPath = fallbackAsset.replace(/[^/]+$/, `${variantCode}-${materialSlug}.png`);
      candidates.push(assetPath);
    } else {
      candidates.push(`/assets/generated/${variantCode}-${materialSlug}.png`);
    }
  }

  if (fallbackAsset) candidates.push(fallbackAsset);
  return [...new Set(candidates.filter(Boolean))];
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
  className = "",
  materialCode = "",
  baseAssetCandidates = null
}) {
  const orderedSlots = [...(slots || [])].sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0));
  const belowSlots = orderedSlots.filter((slot) => slot.layer_mode === "below");
  const aboveSlots = orderedSlots.filter((slot) => slot.layer_mode !== "below");
  const resolvedBaseAssetCandidates = React.useMemo(
    () => (
      Array.isArray(baseAssetCandidates) && baseAssetCandidates.length
        ? [...new Set(baseAssetCandidates.filter(Boolean))]
        : buildMaterialAwareBaseAssetCandidates(variant, materialCode)
    ),
    [baseAssetCandidates, materialCode, variant]
  );
  const [baseAssetIndex, setBaseAssetIndex] = React.useState(0);

  React.useEffect(() => {
    setBaseAssetIndex(0);
  }, [resolvedBaseAssetCandidates.join("|")]);

  const activeBaseAssetUrl = resolvedBaseAssetCandidates[baseAssetIndex] || null;

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
          {activeBaseAssetUrl ? (
            <img
              className="studio-preview-base"
              src={activeBaseAssetUrl}
              alt=""
              aria-hidden="true"
              onError={() => {
                if (baseAssetIndex < resolvedBaseAssetCandidates.length - 1) {
                  setBaseAssetIndex((current) => current + 1);
                }
              }}
            />
          ) : null}
        </div>
        <div className="studio-preview-layer studio-preview-layer-above">
          {aboveSlots.map(renderSlotStone)}
        </div>
        {!activeBaseAssetUrl ? <div className="studio-preview-empty">No base asset</div> : null}
      </div>
      {engraving ? <div className="preview-engraving">"{engraving}"</div> : null}
    </div>
  );
}

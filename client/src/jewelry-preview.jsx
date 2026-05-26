import React from "react";

const METAL_GAMMA_LEVELS = {
  rose_gold: { red: 1.26, green: 0.52, blue: 0.45 },
  gold: { red: 1.44, green: 0.72, blue: 0.28 }
};

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function normalizeMaterialCode(materialCode) {
  const normalized = String(materialCode || "").trim().toLowerCase();
  if (normalized === "gold_plated" || normalized === "solid_gold") return "gold";
  if (normalized === "jewelry_steel") return "silver";
  return normalized;
}

function normalizeMaterialAssetSlug(materialCode) {
  const normalized = normalizeMaterialCode(materialCode);
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

function resolveMetalGammaLevels(materialCode) {
  const normalized = normalizeMaterialCode(materialCode);
  return METAL_GAMMA_LEVELS[normalized] || null;
}

function applyChannelLevels(imageData, materialCode) {
  const gamma = resolveMetalGammaLevels(materialCode);
  if (!gamma) return imageData;

  const next = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  const { data } = next;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3];
    if (!alpha) continue;

    const red = data[index] / 255;
    const green = data[index + 1] / 255;
    const blue = data[index + 2] / 255;

    data[index] = clampChannel(Math.pow(red, 1 / gamma.red) * 255);
    data[index + 1] = clampChannel(Math.pow(green, 1 / gamma.green) * 255);
    data[index + 2] = clampChannel(Math.pow(blue, 1 / gamma.blue) * 255);
  }

  return next;
}

export function buildStoneCodeMap(stones = []) {
  return Object.fromEntries((stones || []).map((stone) => [stone.code, stone]));
}

export function buildMaterialAwareBaseAssetCandidates(variant, materialCode) {
  const fallbackAsset = String(variant?.base_asset_url || "").trim();
  const variantCode = String(variant?.code || "").trim();
  const fallbackStem = assetStemFromUrl(fallbackAsset);
  const silverSlug = normalizeMaterialAssetSlug("silver");
  const candidates = [];

  if (variantCode) {
    if (fallbackAsset) {
      candidates.push(fallbackAsset.replace(/[^/]+$/, `${variantCode}-${silverSlug}.png`));
    } else {
      candidates.push(`/assets/generated/${variantCode}-${silverSlug}.png`);
    }
  }

  if (fallbackStem && fallbackStem !== `${variantCode}-${silverSlug}`) {
    if (fallbackAsset) {
      candidates.push(fallbackAsset.replace(/[^/]+$/, `${fallbackStem}-${silverSlug}.png`));
    } else {
      candidates.push(`/assets/generated/${fallbackStem}-${silverSlug}.png`);
    }
  }

  if (fallbackAsset) candidates.push(fallbackAsset);

  return [...new Set(candidates.filter(Boolean))];
}

export function previewStoneStyle(slot, stone, mode = "preview", options = {}) {
  const includeRotation = options.includeRotation === true;
  const diameter = Number(slot?.diameter || 12);
  const scaleX = Number(slot?.scale_x || 1) * Number(stone?.default_scale_x || 1);
  const scaleY = Number(slot?.scale_y || 1) * Number(stone?.default_scale_y || 1);
  const rotationDeg = includeRotation ? Number(slot?.rotation_deg || 0) : 0;
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
    transform: includeRotation ? `translate(-50%, -50%) rotate(${rotationDeg}deg)` : undefined,
    backgroundImage: assetUrl ? `url(${assetUrl})` : undefined,
    backgroundColor: "transparent",
    backgroundSize: mode === "picker" ? "92%" : "100% 100%",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center center"
  };
}

function CanvasBaseAsset({ assetUrl, materialCode = "", onError }) {
  const canvasRef = React.useRef(null);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    let isDisposed = false;
    const canvas = canvasRef.current;
    if (!canvas || !assetUrl) {
      setIsReady(false);
      return undefined;
    }

    setIsReady(false);

    const image = new Image();
    image.decoding = "async";
    image.crossOrigin = "anonymous";

    image.onload = () => {
      if (isDisposed) return;

      const canvasSize = 1200;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;

      canvas.width = canvasSize;
      canvas.height = canvasSize;
      context.clearRect(0, 0, canvasSize, canvasSize);

      const naturalWidth = image.naturalWidth || canvasSize;
      const naturalHeight = image.naturalHeight || canvasSize;
      const scale = Math.min(canvasSize / naturalWidth, canvasSize / naturalHeight);
      const drawWidth = naturalWidth * scale;
      const drawHeight = naturalHeight * scale;
      const drawX = (canvasSize - drawWidth) / 2;
      const drawY = (canvasSize - drawHeight) / 2;

      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

      const gamma = resolveMetalGammaLevels(materialCode);
      if (gamma) {
        const imageData = context.getImageData(0, 0, canvasSize, canvasSize);
        const recolored = applyChannelLevels(imageData, materialCode);
        context.putImageData(recolored, 0, 0);
      }

      setIsReady(true);
    };

    image.onerror = () => {
      if (isDisposed) return;
      setIsReady(false);
      onError?.();
    };

    image.src = assetUrl;

    return () => {
      isDisposed = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [assetUrl, materialCode, onError]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="studio-preview-base"
        aria-hidden="true"
        style={{ opacity: isReady ? 1 : 0 }}
      />
      {!isReady ? <span className="studio-preview-base studio-preview-base-loading" aria-hidden="true" /> : null}
    </>
  );
}

export function JewelryPreview({
  variant,
  slots = [],
  stonesByCode = {},
  selections = {},
  engraving = "",
  className = "",
  materialCode = "",
  baseAssetCandidates = null,
  applySlotRotation = false
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
        style={previewStoneStyle(slot, stone, "preview", { includeRotation: applySlotRotation })}
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
            <CanvasBaseAsset
              assetUrl={activeBaseAssetUrl}
              materialCode={materialCode}
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

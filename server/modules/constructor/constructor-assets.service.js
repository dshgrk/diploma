// Файл керує asset-записами конструктора та завантаженням зображень у public/assets.
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { createHttpError } = require("../../utils/http-error");
const {
  FILES,
  nextNumericId,
  normalizeText,
  readStudioData,
  resolveImageMetadata,
  sortByOrder,
  toNumber,
  writeFileJson
} = require("./constructor-json.store");
const { requireText } = require("./constructor-normalizers");

const ALLOWED_ASSET_KINDS = new Set(["jewelry-base", "stone", "product", "other"]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

// Повертає всі asset-записи конструктора у стабільному порядку.
async function listAssets() {
  const studio = await readStudioData();
  return sortByOrder(studio.assets.items);
}

// Створює asset-запис для вже наявного public-файлу.
async function createAssetRecord(payload) {
  const studio = await readStudioData();
  const kind = requireText(payload, "kind", "Asset kind");
  if (!ALLOWED_ASSET_KINDS.has(kind)) {
    throw createHttpError(422, "VALIDATION_ERROR", "Unsupported asset kind", {
      kind: "Unsupported asset kind"
    });
  }
  const assetPath = requireText(payload, "path", "Asset path");
  if (!assetPath.startsWith("/assets/")) {
    throw createHttpError(422, "VALIDATION_ERROR", "Asset path must be public /assets path", {
      path: "Asset path must start with /assets/"
    });
  }
  const next = {
    id: nextNumericId(studio.assets.items),
    kind,
    path: assetPath,
    width: toNumber(payload.width, 0),
    height: toNumber(payload.height, 0),
    label: normalizeText(payload.label, path.basename(payload.path)),
    tags: Array.isArray(payload.tags) ? payload.tags.map((item) => normalizeText(item)).filter(Boolean) : [],
    created_at: new Date().toISOString()
  };
  studio.assets.items.push(next);
  await writeFileJson(FILES.assets, studio.assets);
  return next;
}

// Приймає data URL, зберігає файл у uploads і створює asset-запис.
async function uploadAsset(payload) {
  const fileName = normalizeText(payload.file_name, "asset.png");
  const kind = normalizeText(payload.kind, "other");
  if (!ALLOWED_ASSET_KINDS.has(kind)) {
    throw createHttpError(422, "VALIDATION_ERROR", "Unsupported asset kind", {
      kind: "Unsupported asset kind"
    });
  }
  const dataUrl = normalizeText(payload.data_url);
  const match = dataUrl.match(/^data:(image\/png|image\/jpeg|image\/webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw createHttpError(422, "INVALID_IMAGE", "Only PNG, JPG or WEBP images are supported");
  }

  const extension = match[1] === "image/png" ? "png" : match[1] === "image/webp" ? "webp" : "jpg";
  const safeBase = fileName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "asset";
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw createHttpError(422, "INVALID_IMAGE", "Image is too large", {
      data_url: "Image must be smaller than 8 MB"
    });
  }
  const targetDir = path.resolve(process.cwd(), "public", "assets", "uploads", kind);
  await fs.mkdir(targetDir, { recursive: true });
  const storedName = `${safeBase}-${crypto.randomBytes(4).toString("hex")}.${extension}`;
  const absolutePath = path.join(targetDir, storedName);
  await fs.writeFile(absolutePath, bytes);
  const meta = await resolveImageMetadata(absolutePath);
  return createAssetRecord({
    kind,
    path: `/assets/uploads/${kind}/${storedName}`,
    width: meta.width,
    height: meta.height,
    label: payload.label || safeBase,
    tags: payload.tags || []
  });
}

// Видаляє asset-запис і очищає посилання на нього в інших JSON-частинах.
async function deleteAsset(assetId) {
  const studio = await readStudioData();
  const assetIndex = studio.assets.items.findIndex((item) => Number(item.id) === Number(assetId));
  if (assetIndex === -1) throw createHttpError(404, "ASSET_NOT_FOUND", "Asset not found");

  const asset = studio.assets.items[assetIndex];
  studio.assets.items.splice(assetIndex, 1);
  studio.variants.items = studio.variants.items.map((item) => (
    Number(item.base_asset_id) === Number(assetId) ? { ...item, base_asset_id: null } : item
  ));
  studio.stones.items = studio.stones.items.map((item) => (
    Number(item.asset_id) === Number(assetId) ? { ...item, asset_id: null } : item
  ));
  studio.productMeta.items = studio.productMeta.items.map((item) => (
    Number(item.asset_id) === Number(assetId) ? { ...item, asset_id: null } : item
  ));

  const uploadsRoot = path.resolve(process.cwd(), "public", "assets", "uploads");
  if (typeof asset.path === "string" && asset.path.startsWith("/assets/uploads/")) {
    const absoluteAssetPath = path.resolve(process.cwd(), "public", asset.path.replace(/^\/assets\//, "assets/"));
    if (absoluteAssetPath.startsWith(uploadsRoot)) {
      await fs.unlink(absoluteAssetPath).catch(() => {});
    }
  }

  await Promise.all([
    writeFileJson(FILES.assets, studio.assets),
    writeFileJson(FILES.variants, studio.variants),
    writeFileJson(FILES.stones, studio.stones),
    writeFileJson(FILES.productMeta, studio.productMeta)
  ]);
  return { deleted: true, asset_id: Number(assetId), path: asset.path || null };
}

module.exports = {
  createAssetRecord,
  deleteAsset,
  listAssets,
  uploadAsset
};

const fs = require("fs");
const path = require("path");

const PRODUCT_IMAGE_FALLBACKS = {
  ring: "/assets/images/aurora-jewelry-hero.png",
  bracelet: "/assets/images/product-moon.png",
  pendant: "/assets/images/product-heart.png",
  earrings: "/assets/images/aurora-jewelry-hero.png"
};

const PRODUCT_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg"];

function normalizeProductType(type) {
  const normalized = String(type || "").trim().toLowerCase();
  if (normalized === "ring") return "ring";
  if (normalized === "bracelet") return "bracelet";
  if (normalized === "pendant") return "pendant";
  if (normalized === "earrings") return "earrings";
  return "pendant";
}

function publicAssetExists(assetPath) {
  if (!assetPath || typeof assetPath !== "string" || !assetPath.startsWith("/")) {
    return false;
  }

  const relativePath = decodeURIComponent(assetPath.replace(/^\//, ""));
  const absolutePath = path.resolve(process.cwd(), "public", relativePath);
  return fs.existsSync(absolutePath);
}

function resolveImageBySlug(slug) {
  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) return null;

  for (const extension of PRODUCT_IMAGE_EXTENSIONS) {
    const assetPath = `/assets/products/${normalizedSlug}${extension}`;
    if (publicAssetExists(assetPath)) {
      return assetPath;
    }
  }

  return null;
}

function resolveProductImage(assetPath, productType, slug) {
  const slugAsset = resolveImageBySlug(slug);
  if (slugAsset) {
    return slugAsset;
  }

  if (publicAssetExists(assetPath)) {
    return assetPath;
  }

  return PRODUCT_IMAGE_FALLBACKS[normalizeProductType(productType)];
}

module.exports = { resolveProductImage };

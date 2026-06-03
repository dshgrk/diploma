// Файл містить невеликі серверні helper'и, які перевикористовуються в різних модулях.
const fs = require("fs");
const path = require("path");

const PRODUCT_IMAGE_FALLBACKS = {
  ring: "/assets/images/aurora-jewelry-hero.png",
  bracelet: "/assets/images/product-moon.png",
  pendant: "/assets/images/product-heart.png",
  earrings: "/assets/images/aurora-jewelry-hero.png"
};

const PRODUCT_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg"];

// Нормалізує normalize product type, щоб API та UI працювали з однаковим форматом даних.
function normalizeProductType(type) {
  const normalized = String(type || "").trim().toLowerCase();
  if (normalized === "ring") return "ring";
  if (normalized === "bracelet") return "bracelet";
  if (normalized === "pendant") return "pendant";
  if (normalized === "earrings") return "earrings";
  return "pendant";
}

// Виконує локальну логіку public asset exists для модуля серверних утиліт.
function publicAssetExists(assetPath) {
  if (!assetPath || typeof assetPath !== "string" || !assetPath.startsWith("/")) {
    return false;
  }

  const relativePath = decodeURIComponent(assetPath.replace(/^\//, ""));
  const absolutePath = path.resolve(process.cwd(), "public", relativePath);
  return fs.existsSync(absolutePath);
}

// Отримує get public asset absolute path з поточного набору даних або конфігурації.
function getPublicAssetAbsolutePath(assetPath) {
  if (!assetPath || typeof assetPath !== "string" || !assetPath.startsWith("/")) {
    return null;
  }

  const normalizedAssetPath = assetPath.split("?")[0];
  const relativePath = decodeURIComponent(normalizedAssetPath.replace(/^\//, ""));
  return path.resolve(process.cwd(), "public", relativePath);
}

// Виконує локальну логіку with asset version для модуля серверних утиліт.
function withAssetVersion(assetPath) {
  const absolutePath = getPublicAssetAbsolutePath(assetPath);
  if (!absolutePath || !fs.existsSync(absolutePath)) {
    return assetPath;
  }

  const stats = fs.statSync(absolutePath);
  const version = Math.floor(stats.mtimeMs);
  return `${assetPath}?v=${version}`;
}

// Визначає потрібне значення resolve image by slug за поточним контекстом або вхідними параметрами.
function resolveImageBySlug(slug) {
  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) return null;

  for (const extension of PRODUCT_IMAGE_EXTENSIONS) {
    const assetPath = `/assets/products/${normalizedSlug}${extension}`;
    if (publicAssetExists(assetPath)) {
      return withAssetVersion(assetPath);
    }
  }

  return null;
}

// Визначає потрібне значення resolve product image за поточним контекстом або вхідними параметрами.
function resolveProductImage(assetPath, productType, slug) {
  const slugAsset = resolveImageBySlug(slug);
  if (slugAsset) {
    return slugAsset;
  }

  if (publicAssetExists(assetPath)) {
    return withAssetVersion(assetPath);
  }

  return withAssetVersion(PRODUCT_IMAGE_FALLBACKS[normalizeProductType(productType)]);
}

module.exports = { resolveProductImage };

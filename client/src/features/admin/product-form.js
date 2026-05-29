export function emptyProductForm(jewelryTypes = []) {
  return {
    jewelry_type_id: String(jewelryTypes[0]?.id || ""),
    sku: "",
    slug: "",
    name_uk: "",
    name_en: "",
    description_uk: "",
    description_en: "",
    price: "",
    currency: "UAH",
    image_asset_path: "",
    asset_id: "",
    variant_id: "",
    image_alt_uk: "",
    image_alt_en: "",
    is_active: true,
    type: "",
    metal: "",
    stoneType: "",
    stoneShape: "",
    stoneColor: "",
    stoneSize: "",
    ringSize: "",
    ringType: "",
    braceletLength: ""
  };
}

export function productToForm(product) {
  return {
    jewelry_type_id: String(product.jewelry_type_id || ""),
    sku: product.sku || "",
    slug: product.slug || "",
    name_uk: product.name_uk || "",
    name_en: product.name_en || "",
    description_uk: product.description_uk || "",
    description_en: product.description_en || "",
    price: String(product.price ?? ""),
    currency: product.currency || "UAH",
    image_asset_path: product.image?.asset_path || "",
    asset_id: product.asset_id ? String(product.asset_id) : "",
    variant_id: product.variant_id ? String(product.variant_id) : "",
    image_alt_uk: product.image?.alt_uk || "",
    image_alt_en: product.image?.alt_en || "",
    is_active: Boolean(product.is_active),
    type: product.filters?.type || "",
    metal: product.filters?.metal || "",
    stoneType: product.filters?.stoneType || "",
    stoneShape: product.filters?.stoneShape || "",
    stoneColor: product.filters?.stoneColor || "",
    stoneSize: product.filters?.stoneSize || "",
    ringSize: product.filters?.ringSize || "",
    ringType: product.filters?.ringType || "",
    braceletLength: product.filters?.braceletLength || ""
  };
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Не вдалося завантажити зображення"));
    reader.readAsDataURL(file);
  });
}

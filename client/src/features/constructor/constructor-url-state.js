// Файл синхронізує вибраний тип і варіант конструктора з query-параметрами URL.

// Зчитує початковий стан конструктора з query-параметрів.
export function readConstructorSearchState() {
  if (typeof window === "undefined") return { type: "", variant: "" };
  const params = new URLSearchParams(window.location.search);
  return {
    type: String(params.get("type") || "").trim(),
    variant: String(params.get("variant") || "").trim()
  };
}

// Знаходить id типу за id або code з URL.
export function resolveConstructorTypeId(types = [], requestedType = "") {
  const normalized = String(requestedType || "").trim().toLowerCase();
  if (!normalized) return "";
  const match = (types || []).find((type) => {
    const typeId = String(type?.id || "").trim().toLowerCase();
    const typeCode = String(type?.code || "").trim().toLowerCase();
    return typeId === normalized || typeCode === normalized;
  });
  return match ? String(match.id) : "";
}

// Знаходить id варіанта за id або code з URL.
export function resolveConstructorVariantId(variants = [], requestedVariant = "") {
  const normalized = String(requestedVariant || "").trim().toLowerCase();
  if (!normalized) return "";
  const match = (variants || []).find((variant) => {
    const variantId = String(variant?.id || "").trim().toLowerCase();
    const variantCode = String(variant?.code || "").trim().toLowerCase();
    return variantId === normalized || variantCode === normalized;
  });
  return match ? String(match.id) : "";
}

// Оновлює query-параметри без перезавантаження сторінки.
export function syncConstructorSearchState(currentType, currentVariant) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (currentType?.code) url.searchParams.set("type", currentType.code);
  else url.searchParams.delete("type");
  if (currentVariant?.code) url.searchParams.set("variant", currentVariant.code);
  else url.searchParams.delete("variant");
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextUrl !== currentUrl) {
    window.history.replaceState({}, "", nextUrl);
  }
}

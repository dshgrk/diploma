// Файл містить короткі текстові helper'и публічного конструктора.
const UI = {
  uk: {
    addToCart: "Додати в кошик",
    adding: "Додаємо...",
    calculating: "Розрахунок...",
    constructorUnavailable: "Конструктор тимчасово недоступний",
    currentPrice: "Поточна ціна",
    jewelryType: "Тип прикраси",
    piece: "Прикраса",
    validated: "Перевірено",
    personalDesign: "Персональний дизайн"
  },
  en: {
    addToCart: "Add to cart",
    adding: "Adding...",
    calculating: "Calculating...",
    constructorUnavailable: "Constructor is temporarily unavailable",
    currentPrice: "Current price",
    jewelryType: "Jewelry type",
    piece: "Piece",
    validated: "Validated",
    personalDesign: "Personal design"
  }
};

// Повертає локалізований UI-текст за ключем.
export function constructorText(locale, key) {
  return UI[locale]?.[key] || UI.en[key] || key;
}

// Обирає назву елемента конструктора за поточною локаллю.
export function studioLocalizedName(item, locale) {
  return locale === "en"
    ? item?.name_en || item?.label_en || item?.name || item?.code
    : item?.name_uk || item?.label_uk || item?.name || item?.code;
}

// Приводить legacy-коди матеріалів конструктора до активних кодів UI.
export function normalizeLegacyConstructorMaterialCode(code) {
  if (code === "gold_plated") return "gold";
  if (code === "solid_gold") return "gold";
  if (code === "jewelry_steel") return "silver";
  return code || "";
}

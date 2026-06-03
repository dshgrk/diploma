// Файл містить логіку замовлень.
import { normalizePendantType } from "../../pendant-chain";
import { formatCurrency } from "../../utils";

export const LOCALE_FORMATS = {
  uk: "uk-UA",
  en: "en-US"
};

// Перевіряє is pendant item і повертає результат або кидає помилку валідації.
export function isPendantItem(item, typeById = {}) {
  if (!item) return false;
  if (item.item_type === "ready_product") {
    return normalizePendantType(item.product_type);
  }
  const typeCode = typeById[String(item.jewelry_type_id)]?.code || item.jewelry_type_code;
  return normalizePendantType(typeCode) || Boolean(item.configuration?.chain);
}

// Отримує get item chain configuration з поточного набору даних або конфігурації.
export function getItemChainConfiguration(item, typeById = {}) {
  if (!isPendantItem(item, typeById)) return null;
  return item?.configuration?.chain || { option: "none", length: null, metal: null, price: 0 };
}

// Отримує get pendant chain display з поточного набору даних або конфігурації.
export function getPendantChainDisplay(item, locale, typeById = {}, options = {}) {
  const chain = getItemChainConfiguration(item, typeById);
  if (!chain) return null;

  const isEnglish = locale === "en" || locale === "en-US";
  const includeLabel = options.includeLabel !== false;
  const useExplicitMetal = options.includeMetal !== false;

  if (chain.option === "none") {
    return {
      text: includeLabel
        ? (isEnglish ? "Configuration: without chain" : "Комплектація: без ланцюжка")
        : (isEnglish ? "without chain" : "без ланцюжка"),
      surcharge: null,
      chain
    };
  }

  const chainLength = chain.length || Number(String(chain.option || "").replace("cm", ""));
  const parts = [
    isEnglish ? `chain ${chainLength} cm` : `ланцюжок ${chainLength} см`,
    useExplicitMetal
      ? (isEnglish ? `color ${chain.metal}` : `колір ${chain.metal}`)
      : (isEnglish ? "matching pendant color" : "у колір підвіски")
  ];

  return {
    text: `${includeLabel ? (isEnglish ? "Configuration: " : "Комплектація: ") : ""}${parts.join(", ")}`,
    surcharge:
      Number(chain.price || 0) > 0
        ? `${isEnglish ? "Chain surcharge" : "Доплата за ланцюжок"}: ${formatCurrency(Number(chain.price || 0), "UAH", isEnglish ? LOCALE_FORMATS.en : LOCALE_FORMATS.uk)}`
        : null,
    chain
  };
}

// Виконує локальну логіку find type option label для модуля замовлень.
export function findTypeOptionLabel(options = [], code) {
  if (!code) return "";
  const match = (options || []).find((item) => String(item.code) === String(code));
  return match?.label || match?.name_uk || match?.name_en || "";
}

// Форматує format order date у вигляд, зручний для відображення користувачу.
export function formatOrderDate(value, locale = "uk-UA") {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

// Виконує локальну логіку order status label для модуля замовлень.
export function orderStatusLabel(status, labels = {}) {
  return labels[status] || String(status || "").replaceAll("_", " ");
}

// Виконує локальну логіку status class name для модуля замовлень.
export function statusClassName(status, overdue = false) {
  if (overdue) return "is-overdue";
  return `is-${String(status || "unknown").replaceAll("_", "-")}`;
}

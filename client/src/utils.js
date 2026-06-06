// Файл містить логіку utils.
// Форматує format currency у вигляд, зручний для відображення користувачу.
export function formatCurrency(amount, currency = "UAH", locale = "uk-UA") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

// Повертає безпечне display-ім'я клієнта, якщо в замовленні збереглася порожня або бита строка.
export function formatCustomerName(name, email, fallback = "Клієнт") {
  const normalizedName = String(name || "").trim();
  const meaningfulName = normalizedName.replace(/[?\uFFFD\s._-]+/g, "");
  if (meaningfulName) return normalizedName;

  const emailLocal = String(email || "")
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();

  if (emailLocal) {
    return emailLocal.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
  }

  return fallback;
}

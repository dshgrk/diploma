export function formatCurrency(amount, currency = "UAH", locale = "uk-UA") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

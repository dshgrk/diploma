// Файл містить невеликі серверні helper'и, які перевикористовуються в різних модулях.
// Виконує локальну логіку generate order number для модуля серверних утиліт.
function generateOrderNumber() {
  const now = new Date();
  const datePart = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate()
  ).padStart(2, "0")}`;
  const randomPart = Math.random().toString().slice(2, 8);
  return `ORD-${datePart}-${randomPart}`;
}

module.exports = { generateOrderNumber };

// Файл містить невеликі серверні helper'и, які перевикористовуються в різних модулях.
// Виконує локальну логіку parse json field для модуля серверних утиліт.
function parseJsonField(value, fallback = null) {
  if (value == null) {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

module.exports = { parseJsonField };

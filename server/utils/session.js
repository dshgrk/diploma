// Файл містить невеликі серверні helper'и, які перевикористовуються в різних модулях.
const crypto = require("crypto");

// Виконує локальну логіку generate session token для модуля серверних утиліт.
function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Виконує локальну логіку hash session token для модуля серверних утиліт.
function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = { generateSessionToken, hashSessionToken };

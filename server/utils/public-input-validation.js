// Файл містить невеликі серверні helper'и, які перевикористовуються в різних модулях.
const PUBLIC_FIELD_LIMITS = {
  nameMax: 120,
  addressMin: 5,
  addressMax: 240,
  passwordMin: 6,
  verificationCodeLength: 6
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UA_PHONE_PATTERN = /^\+380\d{9}$/;

// Нормалізує normalize phone, щоб API та UI працювали з однаковим форматом даних.
function normalizePhone(phone) {
  const compact = String(phone || "").trim().replace(/[^\d+]/g, "");
  if (/^0\d{9}$/.test(compact)) return `+38${compact}`;
  if (/^380\d{9}$/.test(compact)) return `+${compact}`;
  return compact;
}

// Перевіряє is valid ukrainian phone і повертає результат або кидає помилку валідації.
function isValidUkrainianPhone(phone) {
  return UA_PHONE_PATTERN.test(normalizePhone(phone));
}

// Нормалізує normalize email, щоб API та UI працювали з однаковим форматом даних.
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// Перевіряє is valid email і повертає результат або кидає помилку валідації.
function isValidEmail(email) {
  return EMAIL_PATTERN.test(normalizeEmail(email));
}

// Нормалізує normalize plain text, щоб API та UI працювали з однаковим форматом даних.
function normalizePlainText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

// Нормалізує normalize verification code, щоб API та UI працювали з однаковим форматом даних.
function normalizeVerificationCode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, PUBLIC_FIELD_LIMITS.verificationCodeLength);
}

module.exports = {
  PUBLIC_FIELD_LIMITS,
  normalizePhone,
  isValidUkrainianPhone,
  normalizeEmail,
  isValidEmail,
  normalizePlainText,
  normalizeVerificationCode
};

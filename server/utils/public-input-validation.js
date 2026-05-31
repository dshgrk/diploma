const PUBLIC_FIELD_LIMITS = {
  nameMax: 120,
  addressMin: 5,
  addressMax: 240,
  passwordMin: 6,
  verificationCodeLength: 6
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UA_PHONE_PATTERN = /^\+380\d{9}$/;

function normalizePhone(phone) {
  const compact = String(phone || "").trim().replace(/[^\d+]/g, "");
  if (/^0\d{9}$/.test(compact)) return `+38${compact}`;
  if (/^380\d{9}$/.test(compact)) return `+${compact}`;
  return compact;
}

function isValidUkrainianPhone(phone) {
  return UA_PHONE_PATTERN.test(normalizePhone(phone));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return EMAIL_PATTERN.test(normalizeEmail(email));
}

function normalizePlainText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

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

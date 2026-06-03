// Файл містить невеликі серверні helper'и, які перевикористовуються в різних модулях.
const { LOCALES } = require("../constants/locales");

// Визначає потрібне значення resolve locale за поточним контекстом або вхідними параметрами.
function resolveLocale(req, fallback = LOCALES.UK) {
  if (!req) return fallback;

  const queryLocale = req.query?.lang || req.headers?.["x-locale"];
  if (queryLocale === LOCALES.EN) {
    return LOCALES.EN;
  }
  if (queryLocale === LOCALES.UK) {
    return LOCALES.UK;
  }

  if (req.user?.preferred_locale) {
    return req.user.preferred_locale;
  }

  return fallback;
}

// Виконує локальну логіку pick localized fields для модуля серверних утиліт.
function pickLocalizedFields(record, locale, fields) {
  if (!record) {
    return record;
  }

  const result = { ...record };
  fields.forEach((field) => {
    const preferredKey = `${field}_${locale}`;
    const fallbackKey = `${field}_${locale === LOCALES.EN ? LOCALES.UK : LOCALES.EN}`;
    const preferredValue = Object.prototype.hasOwnProperty.call(record, preferredKey) ? record[preferredKey] : undefined;
    const fallbackValue = Object.prototype.hasOwnProperty.call(record, fallbackKey) ? record[fallbackKey] : undefined;
    result[field] = preferredValue || fallbackValue || record[field];
  });
  return result;
}

module.exports = { resolveLocale, pickLocalizedFields };

const { LOCALES } = require("../constants/locales");

function resolveLocale(req, fallback = LOCALES.UK) {
  if (req.user?.preferred_locale) {
    return req.user.preferred_locale;
  }

  const queryLocale = req.query.lang || req.headers["x-locale"];
  if (queryLocale === LOCALES.EN) {
    return LOCALES.EN;
  }

  return fallback;
}

function pickLocalizedFields(record, locale, fields) {
  if (!record) {
    return record;
  }

  const result = { ...record };
  fields.forEach((field) => {
    const localizedKey = `${field}_${locale}`;
    if (Object.prototype.hasOwnProperty.call(record, localizedKey)) {
      result[field] = record[localizedKey];
    }
  });
  return result;
}

module.exports = { resolveLocale, pickLocalizedFields };

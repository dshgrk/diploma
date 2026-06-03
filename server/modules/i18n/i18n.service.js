// Файл містить бізнес-логіку серверного модуля i18n та готує дані для API.
const { LOCALES } = require("../../constants/locales");

// Отримує get supported locales з поточного набору даних або конфігурації.
function getSupportedLocales() {
  return Object.values(LOCALES);
}

module.exports = { getSupportedLocales };

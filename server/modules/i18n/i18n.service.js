const { LOCALES } = require("../../constants/locales");

function getSupportedLocales() {
  return Object.values(LOCALES);
}

module.exports = { getSupportedLocales };

const { getPublicConstructorConfig } = require("./constructor-json.service");

async function getConstructorConfig(req) {
  return getPublicConstructorConfig(req);
}

module.exports = { getConstructorConfig };

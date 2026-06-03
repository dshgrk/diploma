// Файл містить невеликі серверні helper'и, які перевикористовуються в різних модулях.
// Виконує локальну логіку log для модуля серверних утиліт.
function log(level, message, payload = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...payload
  };

  const printable = JSON.stringify(entry);
  if (level === "error") {
    console.error(printable);
    return;
  }

  console.log(printable);
}

const logger = {
  info(message, payload) {
    log("info", message, payload);
  },
  warn(message, payload) {
    log("warn", message, payload);
  },
  error(message, payload) {
    log("error", message, payload);
  }
};

module.exports = { logger };

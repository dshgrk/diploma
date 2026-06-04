// Файл містить Express middleware для спільної обробки HTTP-запитів.
const crypto = require("crypto");

// Виконує локальну логіку attach request context для модуля Express middleware.
function attachRequestContext(req, res, next) {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  req.requestId = String(requestId);
  res.setHeader("X-Request-Id", req.requestId);
  next();
}

module.exports = { attachRequestContext };

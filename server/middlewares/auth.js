// Файл містить Express middleware для спільної обробки HTTP-запитів.
const { ROLES } = require("../constants/roles");
const { createHttpError } = require("../utils/http-error");

// Перевіряє require auth і повертає результат або кидає помилку валідації.
function requireAuth(req, res, next) {
  if (!req.user) {
    return next(createHttpError(401, "UNAUTHORIZED", "Authentication required"));
  }

  next();
}

// Перевіряє require role і повертає результат або кидає помилку валідації.
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return next(createHttpError(401, "UNAUTHORIZED", "Authentication required"));
    }

    if (req.user.role !== role) {
      return next(createHttpError(403, "FORBIDDEN", "You do not have access to this resource"));
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin: requireRole(ROLES.ADMIN)
};

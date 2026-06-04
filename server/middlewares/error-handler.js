// Файл містить Express middleware для спільної обробки HTTP-запитів.
const { logger } = require("../utils/logger");

// Виконує локальну логіку error handler для модуля Express middleware.
function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  const code = error.code || "INTERNAL_SERVER_ERROR";
  const message = status >= 500 ? "Unexpected server error" : (error.message || "Unexpected server error");

  if (res.headersSent) {
    return next(error);
  }

  if (status >= 500) {
    logger.error("Unhandled request failure", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      error: error.message
    });
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      request_id: req.requestId,
      details: error.details || null
    }
  });
}

module.exports = { errorHandler };

// Файл містить Express middleware для спільної обробки HTTP-запитів.
// Виконує локальну логіку async handler для модуля Express middleware.
function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { asyncHandler };

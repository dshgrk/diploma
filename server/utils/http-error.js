// Файл містить невеликі серверні helper'и, які перевикористовуються в різних модулях.
// Створює новий запис або чернетку для create http error.
function createHttpError(status, code, message, details = null) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}

module.exports = { createHttpError };

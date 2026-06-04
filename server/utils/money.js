// Файл містить невеликі серверні helper'и, які перевикористовуються в різних модулях.
// Обчислює round currency та повертає стабільний результат для бізнес-логіки.
function roundCurrency(value) {
  return Number(Number(value || 0).toFixed(2));
}

// Обчислює sum money та повертає стабільний результат для бізнес-логіки.
function sumMoney(values) {
  return roundCurrency(
    values.reduce((accumulator, currentValue) => accumulator + Number(currentValue || 0), 0)
  );
}

module.exports = { roundCurrency, sumMoney };

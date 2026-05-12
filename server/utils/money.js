function roundCurrency(value) {
  return Number(Number(value || 0).toFixed(2));
}

function sumMoney(values) {
  return roundCurrency(
    values.reduce((accumulator, currentValue) => accumulator + Number(currentValue || 0), 0)
  );
}

module.exports = { roundCurrency, sumMoney };

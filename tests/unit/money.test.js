import { createRequire } from "module";
import { describe, expect, test } from "vitest";

const require = createRequire(import.meta.url);
const { roundCurrency, sumMoney } = require("../../server/utils/money");

describe("money utils", () => {
  test("roundCurrency rounds to 2 decimal places", () => {
    expect(roundCurrency(100.555)).toBe(100.56);
    expect(roundCurrency(100.554)).toBe(100.55);
  });

  test("sumMoney aggregates and rounds values", () => {
    expect(sumMoney([199.995, 100])).toBe(300);
  });
});

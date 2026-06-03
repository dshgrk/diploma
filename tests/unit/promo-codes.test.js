// Файл містить автоматичні перевірки ключових сценаріїв системи.
import { createRequire } from "module";
import { describe, expect, test } from "vitest";

const require = createRequire(import.meta.url);
const { calculatePromoDiscount } = require("../../server/modules/promotions/promo-codes.service");

describe("promo codes", () => {
  test("calculates percent discount without exceeding subtotal", () => {
    const discount = calculatePromoDiscount(
      {
        discount_type: "percent",
        discount_value: 10
      },
      1495
    );

    expect(discount).toBe(149.5);
  });

  test("caps fixed discount at subtotal", () => {
    const discount = calculatePromoDiscount(
      {
        discount_type: "fixed_amount",
        discount_value: 500
      },
      320
    );

    expect(discount).toBe(320);
  });
});

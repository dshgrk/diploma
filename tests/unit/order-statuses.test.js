// Файл містить автоматичні перевірки ключових сценаріїв системи.
import { createRequire } from "module";
import { describe, expect, test } from "vitest";

const require = createRequire(import.meta.url);
const { ORDER_STATUSES, getNextOrderStatus } = require("../../server/constants/order-statuses");
const { isOrderOverdue } = require("../../server/modules/orders/orders.service");

describe("order status flow", () => {
  test("returns next status in linear workflow", () => {
    expect(getNextOrderStatus(ORDER_STATUSES.CREATED_PENDING_PAYMENT)).toBe(ORDER_STATUSES.CONFIRMED);
    expect(getNextOrderStatus(ORDER_STATUSES.CONFIRMED)).toBe(ORDER_STATUSES.IN_PROGRESS);
    expect(getNextOrderStatus(ORDER_STATUSES.IN_PROGRESS)).toBe(ORDER_STATUSES.COMPLETED);
    expect(getNextOrderStatus(ORDER_STATUSES.COMPLETED)).toBe(null);
  });

  test("computes overdue for in progress orders older than 14 days", () => {
    expect(
      isOrderOverdue({
        status: ORDER_STATUSES.IN_PROGRESS,
        in_progress_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      })
    ).toBe(true);

    expect(
      isOrderOverdue({
        status: ORDER_STATUSES.CONFIRMED,
        in_progress_at: null
      })
    ).toBe(false);
  });
});

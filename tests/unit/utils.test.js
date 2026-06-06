import { describe, expect, it } from "vitest";
import { formatCustomerName } from "../../client/src/utils";

describe("formatCustomerName", () => {
  it("returns the original name when it contains meaningful characters", () => {
    expect(formatCustomerName("Дарина Клієнт", "client@aurora.local")).toBe("Дарина Клієнт");
  });

  it("falls back to the email local part when the stored name is corrupted", () => {
    expect(formatCustomerName("???? ?????", "dshgrk@gmail.com")).toBe("Dshgrk");
  });

  it("returns a generic fallback when both name and email are unusable", () => {
    expect(formatCustomerName("", "")).toBe("Клієнт");
  });
});

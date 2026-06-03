// Файл містить автоматичні перевірки ключових сценаріїв системи.
import { createRequire } from "module";
import { describe, expect, test } from "vitest";

const require = createRequire(import.meta.url);
const { FILTER_COLUMN_BY_KEY, normalizeCatalogFilters, normalizeCatalogQuery, normalizeCatalogSort } = require("../../server/modules/catalog/catalog.filters");

describe("catalog filters", () => {
  test("normalizes supported filter values into canonical multi-select arrays", () => {
    const filters = normalizeCatalogFilters({
      type: "Ring",
      metal: "Rose Gold,Silver",
      stone: ["Emerald", "Diamond"],
      stoneShape: "Princess",
      stoneColor: "Green",
      stoneSize: "2 ct",
      ringSize: "17",
      ringStyle: "Fashion",
      braceletLength: "20 cm",
      unsupported: "ignored"
    });

    expect(filters).toEqual({
      type: ["Ring"],
      metal: ["Rose Gold", "Silver"],
      stoneType: ["Emerald", "Diamond"],
      stoneShape: ["Princess"],
      stoneColor: ["Green"],
      stoneSize: ["2 ct"],
      ringSize: ["17"],
      ringType: ["Fashion"],
      braceletLength: ["20 cm"]
    });
  });

  test("normalizes price range and sort aliases for the catalog query", () => {
    expect(normalizeCatalogQuery({ priceMin: "1000", priceMax: "5000", sort: "price-desc" })).toEqual({
      filters: {},
      priceMin: 1000,
      priceMax: 5000,
      sort: "price_desc"
    });

    expect(normalizeCatalogSort("new")).toBe("newest");
  });

  test("keeps the expected DB filter mappings, including pendant support via type filter", () => {
    expect(FILTER_COLUMN_BY_KEY).toMatchObject({
      type: "filter_type",
      metal: "filter_metal",
      stoneType: "filter_stone_type",
      stoneShape: "filter_stone_shape",
      stoneColor: "filter_stone_color",
      stoneSize: "filter_stone_size",
      ringSize: "filter_ring_size",
      ringType: "filter_ring_type",
      braceletLength: "filter_bracelet_length"
    });
  });
});

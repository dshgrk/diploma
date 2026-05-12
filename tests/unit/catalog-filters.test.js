import { createRequire } from "module";
import { describe, expect, test } from "vitest";

const require = createRequire(import.meta.url);
const { CATALOG_FILTERS, normalizeCatalogFilters } = require("../../server/modules/catalog/catalog.filters");

describe("catalog filters", () => {
  test("keeps only the supported filter values", () => {
    const filters = normalizeCatalogFilters({
      type: "Ring",
      metal: "Rose Gold",
      stoneType: "Emerald",
      stoneShape: "Princess",
      stoneColor: "Green",
      stoneSize: "2 ct",
      ringSize: "17",
      ringType: "Fashion",
      braceletLength: "20 cm",
      unsupported: "ignored"
    });

    expect(filters).toEqual({
      type: "Ring",
      metal: "Rose Gold",
      stoneType: "Emerald",
      stoneShape: "Princess",
      stoneColor: "Green",
      stoneSize: "2 ct",
      ringSize: "17",
      ringType: "Fashion",
      braceletLength: "20 cm"
    });
  });

  test("exposes exactly the requested filter option lists", () => {
    expect(CATALOG_FILTERS).toEqual({
      type: ["Ring", "Earrings", "Bracelet"],
      metal: ["Gold", "Silver", "Rose Gold"],
      stoneType: ["Diamond", "Emerald", "Sapphire", "None"],
      stoneShape: ["Round", "Oval", "Princess"],
      stoneColor: ["White", "Green", "Blue"],
      stoneSize: ["0.5 ct", "1 ct", "2 ct"],
      ringSize: ["15", "16", "17", "18"],
      ringType: ["Engagement", "Wedding", "Fashion"],
      braceletLength: ["16 cm", "18 cm", "20 cm"]
    });
  });
});

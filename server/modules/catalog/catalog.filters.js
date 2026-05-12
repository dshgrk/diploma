const CATALOG_FILTERS = {
  type: ["Ring", "Earrings", "Bracelet"],
  metal: ["Gold", "Silver", "Rose Gold"],
  stoneType: ["Diamond", "Emerald", "Sapphire", "None"],
  stoneShape: ["Round", "Oval", "Princess"],
  stoneColor: ["White", "Green", "Blue"],
  stoneSize: ["0.5 ct", "1 ct", "2 ct"],
  ringSize: ["15", "16", "17", "18"],
  ringType: ["Engagement", "Wedding", "Fashion"],
  braceletLength: ["16 cm", "18 cm", "20 cm"]
};

const FILTER_COLUMN_BY_KEY = {
  type: "filter_type",
  metal: "filter_metal",
  stoneType: "filter_stone_type",
  stoneShape: "filter_stone_shape",
  stoneColor: "filter_stone_color",
  stoneSize: "filter_stone_size",
  ringSize: "filter_ring_size",
  ringType: "filter_ring_type",
  braceletLength: "filter_bracelet_length"
};

function normalizeCatalogFilters(query = {}) {
  return Object.entries(CATALOG_FILTERS).reduce((filters, [key, allowedValues]) => {
    const value = typeof query[key] === "string" ? query[key].trim() : "";
    if (value && allowedValues.includes(value)) {
      filters[key] = value;
    }
    return filters;
  }, {});
}

function serializeProductFilters(record) {
  return {
    type: record.filter_type,
    metal: record.filter_metal,
    stoneType: record.filter_stone_type,
    stoneShape: record.filter_stone_shape,
    stoneColor: record.filter_stone_color,
    stoneSize: record.filter_stone_size,
    ringSize: record.filter_ring_size,
    ringType: record.filter_ring_type,
    braceletLength: record.filter_bracelet_length
  };
}

module.exports = {
  CATALOG_FILTERS,
  FILTER_COLUMN_BY_KEY,
  normalizeCatalogFilters,
  serializeProductFilters
};

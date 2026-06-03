// Файл містить бізнес-логіку серверного модуля catalog та готує дані для API.
const { db } = require("../../db/knex");
const { pickLocalizedFields, resolveLocale } = require("../../utils/locale");
const { createHttpError } = require("../../utils/http-error");
const { resolveProductImage } = require("../../utils/product-image");
const { FILTER_COLUMN_BY_KEY, normalizeCatalogQuery, serializeProductFilters } = require("./catalog.filters");

const DEFAULT_CATALOG_PAGE_SIZE = 12;
const MAX_CATALOG_PAGE_SIZE = 48;

// Нормалізує normalize catalog page, щоб API та UI працювали з однаковим форматом даних.
function normalizeCatalogPage(value) {
  const page = Number.parseInt(String(value || "1"), 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

// Нормалізує normalize catalog limit, щоб API та UI працювали з однаковим форматом даних.
function normalizeCatalogLimit(value) {
  const limit = Number.parseInt(String(value || DEFAULT_CATALOG_PAGE_SIZE), 10);
  if (!Number.isFinite(limit) || limit <= 0) return DEFAULT_CATALOG_PAGE_SIZE;
  return Math.min(limit, MAX_CATALOG_PAGE_SIZE);
}

// Перевіряє is paginated catalog request і повертає результат або кидає помилку валідації.
function isPaginatedCatalogRequest(req) {
  return req.query.page != null || req.query.limit != null || req.query.paginated === "true";
}

// Виконує локальну логіку apply catalog filters для модуля серверного модуля catalog.
function applyCatalogFilters(query, req) {
  if (req.query.jewelry_type) {
    query.where("products.jewelry_type_id", Number(req.query.jewelry_type));
  }

  const { filters, priceMin, priceMax, sort } = normalizeCatalogQuery(req.query);
  Object.entries(filters).forEach(([key, values]) => {
    query.whereIn(FILTER_COLUMN_BY_KEY[key], values);
  });

  if (priceMin != null) {
    query.andWhere("products.price", ">=", priceMin);
  }

  if (priceMax != null) {
    query.andWhere("products.price", "<=", priceMax);
  }

  return { sort };
}

// Виконує локальну логіку apply catalog sort для модуля серверного модуля catalog.
function applyCatalogSort(query, sort) {
  if (sort === "price_asc") {
    query.orderBy("price", "asc").orderBy("created_at", "desc");
    return;
  }

  if (sort === "price_desc") {
    query.orderBy("price", "desc").orderBy("created_at", "desc");
    return;
  }

  query.orderBy("created_at", "desc");
}

// Виконує локальну логіку base product query для модуля серверного модуля catalog.
function baseProductQuery() {
  return db("products")
    .select(
      "id",
      "slug",
      "price",
      "currency",
      "name_uk",
      "name_en",
      "description_uk",
      "description_en",
      "filter_type",
      "filter_metal",
      "filter_stone_type",
      "filter_stone_shape",
      "filter_stone_color",
      "filter_stone_size",
      "filter_ring_size",
      "filter_ring_type",
      "filter_bracelet_length",
      "created_at"
    )
    .where("is_active", true);
}

// Виконує локальну логіку serialize catalog products для модуля серверного модуля catalog.
async function serializeCatalogProducts(records, locale) {
  const productIds = records.map((item) => item.id);
  const images = productIds.length
    ? await db("product_images").whereIn("product_id", productIds).andWhere({ is_primary: true })
    : [];
  const imagesByProductId = images.reduce((accumulator, image) => {
    accumulator[image.product_id] = image;
    return accumulator;
  }, {});

  return records.map((record) => {
    const localized = pickLocalizedFields(record, locale, ["name", "description"]);
    return {
      id: localized.id,
      slug: localized.slug,
      name: localized.name,
      description: localized.description,
      name_uk: localized.name_uk,
      name_en: localized.name_en,
      description_uk: localized.description_uk,
      description_en: localized.description_en,
      price: Number(localized.price),
      currency: localized.currency,
      createdAt: localized.created_at,
      filters: serializeProductFilters(localized),
      thumbnail_url: resolveProductImage(imagesByProductId[localized.id]?.asset_path, localized.filter_type, localized.slug)
    };
  });
}

// Повертає список даних list products у форматі, готовому для API або UI.
async function listProducts(req) {
  const locale = resolveLocale(req);
  const query = baseProductQuery();
  const { sort } = applyCatalogFilters(query, req);
  applyCatalogSort(query, sort);

  if (!isPaginatedCatalogRequest(req)) {
    return serializeCatalogProducts(await query, locale);
  }

  const page = normalizeCatalogPage(req.query.page);
  const limit = normalizeCatalogLimit(req.query.limit);
  const totalQuery = baseProductQuery().clearSelect().count({ total: "products.id" }).first();
  applyCatalogFilters(totalQuery, req);

  const [records, totalRecord] = await Promise.all([
    query.limit(limit).offset((page - 1) * limit),
    totalQuery
  ]);
  const totalItems = Number(totalRecord?.total || 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return {
    items: await serializeCatalogProducts(records, locale),
    pageInfo: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
}

// Повертає список даних list product facets у форматі, готовому для API або UI.
async function listProductFacets(req) {
  const query = db("products")
    .select(
      "filter_type",
      "filter_metal",
      "filter_stone_type",
      "filter_stone_shape",
      "filter_stone_color",
      "filter_stone_size",
      "filter_ring_size",
      "filter_ring_type",
      "filter_bracelet_length",
      "price"
    )
    .where("is_active", true);
  applyCatalogFilters(query, req);
  const records = await query;
  const facetColumnByKey = {
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
  const facets = Object.fromEntries(
    Object.entries(facetColumnByKey).map(([key, column]) => [
      key,
      [...new Set(records.map((record) => record[column]).filter(Boolean))].sort((left, right) => String(left).localeCompare(String(right)))
    ])
  );
  const prices = records.map((record) => Number(record.price || 0)).filter((price) => Number.isFinite(price));

  return {
    facets,
    priceBounds: {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0
    }
  };
}

// Отримує get product by id or slug з поточного набору даних або конфігурації.
async function getProductByIdOrSlug(identifier, req) {
  const locale = resolveLocale(req);

  const query = db("products")
    .select("*")
    .where("is_active", true)
    .modify((builder) => {
      if (/^\d+$/.test(String(identifier))) {
        builder.andWhere("id", Number(identifier));
      } else {
        builder.andWhere("slug", identifier);
      }
    })
    .first();

  const product = await query;
  if (!product) {
    throw createHttpError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  const images = await db("product_images").where({ product_id: product.id }).orderBy("sort_order", "asc");
  const localized = pickLocalizedFields(product, locale, ["name", "description"]);

  return {
    id: localized.id,
    slug: localized.slug,
    name: localized.name,
    name_uk: localized.name_uk,
    name_en: localized.name_en,
    description: localized.description,
    description_uk: localized.description_uk,
    description_en: localized.description_en,
    price: Number(localized.price),
    currency: localized.currency,
    filters: serializeProductFilters(localized),
    images: images.map((image) => ({
      id: image.id,
      asset_path: resolveProductImage(image.asset_path, localized.filter_type, localized.slug),
      alt: locale === "en" ? image.alt_en : image.alt_uk,
      is_primary: image.is_primary
    }))
  };
}

module.exports = { listProducts, listProductFacets, getProductByIdOrSlug };

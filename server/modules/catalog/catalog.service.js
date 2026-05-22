const { db } = require("../../db/knex");
const { pickLocalizedFields, resolveLocale } = require("../../utils/locale");
const { createHttpError } = require("../../utils/http-error");
const { resolveProductImage } = require("../../utils/product-image");
const { FILTER_COLUMN_BY_KEY, normalizeCatalogQuery, serializeProductFilters } = require("./catalog.filters");

async function listProducts(req) {
  const locale = resolveLocale(req);
  const query = db("products")
    .select(
      "id",
      "slug",
      "price",
      "currency",
      "name_uk",
      "name_en",
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

  if (sort === "price_asc") {
    query.orderBy("price", "asc").orderBy("created_at", "desc");
  } else if (sort === "price_desc") {
    query.orderBy("price", "desc").orderBy("created_at", "desc");
  } else {
    query.orderBy("created_at", "desc");
  }

  const records = await query;
  const productIds = records.map((item) => item.id);
  const images = productIds.length
    ? await db("product_images").whereIn("product_id", productIds).andWhere({ is_primary: true })
    : [];
  const imagesByProductId = images.reduce((accumulator, image) => {
    accumulator[image.product_id] = image;
    return accumulator;
  }, {});

  return records.map((record) => {
    const localized = pickLocalizedFields(record, locale, ["name"]);
    return {
      id: localized.id,
      slug: localized.slug,
      name: localized.name,
      price: Number(localized.price),
      currency: localized.currency,
      createdAt: localized.created_at,
      filters: serializeProductFilters(localized),
      thumbnail_url: resolveProductImage(imagesByProductId[localized.id]?.asset_path, localized.filter_type, localized.slug)
    };
  });
}

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
    description: localized.description,
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

module.exports = { listProducts, getProductByIdOrSlug };

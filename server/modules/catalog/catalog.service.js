const { db } = require("../../db/knex");
const { pickLocalizedFields, resolveLocale } = require("../../utils/locale");
const { createHttpError } = require("../../utils/http-error");
const { FILTER_COLUMN_BY_KEY, normalizeCatalogFilters, serializeProductFilters } = require("./catalog.filters");

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
      "filter_bracelet_length"
    )
    .where("is_active", true)
    .orderBy("created_at", "desc");

  if (req.query.jewelry_type) {
    query.where("products.jewelry_type_id", Number(req.query.jewelry_type));
  }

  const filters = normalizeCatalogFilters(req.query);
  Object.entries(filters).forEach(([key, value]) => {
    query.where(FILTER_COLUMN_BY_KEY[key], value);
  });

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
      filters: serializeProductFilters(localized),
      thumbnail_url: imagesByProductId[localized.id]?.asset_path || "/assets/images/product-heart.png"
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
      asset_path: image.asset_path,
      alt: locale === "en" ? image.alt_en : image.alt_uk,
      is_primary: image.is_primary
    }))
  };
}

module.exports = { listProducts, getProductByIdOrSlug };

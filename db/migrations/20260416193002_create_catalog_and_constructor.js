exports.up = async function up(knex) {
  await knex.schema.createTable("jewelry_types", (table) => {
    table.bigIncrements("id").primary();
    table.string("code", 64).notNullable().unique();
    table.string("name_uk", 255).notNullable();
    table.string("name_en", 255).notNullable();
    table.decimal("base_price", 10, 2).notNullable().defaultTo(0);
    table.string("preview_base_asset", 255);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("products", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("jewelry_type_id").unsigned().references("id").inTable("jewelry_types").onDelete("SET NULL");
    table.string("sku", 64).notNullable().unique();
    table.string("slug", 128).notNullable().unique();
    table.string("name_uk", 255).notNullable();
    table.string("name_en", 255).notNullable();
    table.text("description_uk").notNullable();
    table.text("description_en").notNullable();
    table.decimal("price", 10, 2).notNullable();
    table.string("currency", 3).notNullable().defaultTo("UAH");
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index(["is_active", "jewelry_type_id"]);
  });

  await knex.schema.createTable("product_images", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("product_id").unsigned().notNullable().references("id").inTable("products").onDelete("CASCADE");
    table.string("asset_path", 255).notNullable();
    table.string("alt_uk", 255).notNullable();
    table.string("alt_en", 255).notNullable();
    table.integer("width").notNullable();
    table.integer("height").notNullable();
    table.integer("sort_order").notNullable().defaultTo(0);
    table.boolean("is_primary").notNullable().defaultTo(false);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("materials", (table) => {
    table.bigIncrements("id").primary();
    table.string("code", 64).notNullable().unique();
    table.string("name_uk", 255).notNullable();
    table.string("name_en", 255).notNullable();
    table.decimal("price_delta", 10, 2).notNullable().defaultTo(0);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("design_options", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("jewelry_type_id").unsigned().notNullable().references("id").inTable("jewelry_types").onDelete("CASCADE");
    table.string("code", 64).notNullable();
    table.string("label_uk", 255).notNullable();
    table.string("label_en", 255).notNullable();
    table.enu("input_type", ["select", "text"]).notNullable().defaultTo("select");
    table.boolean("is_required").notNullable().defaultTo(false);
    table.integer("sort_order").notNullable().defaultTo(0);
    table.boolean("affects_price").notNullable().defaultTo(true);
    table.boolean("affects_preview").notNullable().defaultTo(false);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.unique(["jewelry_type_id", "code"]);
    table.index(["jewelry_type_id", "is_active", "sort_order"]);
  });

  await knex.schema.createTable("design_option_values", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("design_option_id").unsigned().notNullable().references("id").inTable("design_options").onDelete("CASCADE");
    table.bigInteger("material_id").unsigned().references("id").inTable("materials").onDelete("SET NULL");
    table.string("code", 64).notNullable();
    table.string("label_uk", 255).notNullable();
    table.string("label_en", 255).notNullable();
    table.decimal("price_delta", 10, 2).notNullable().defaultTo(0);
    table.string("layer_key", 64);
    table.string("asset_path", 255);
    table.integer("z_index").notNullable().defaultTo(0);
    table.json("metadata_json");
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.unique(["design_option_id", "code"]);
    table.index(["design_option_id", "is_active"]);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("design_option_values");
  await knex.schema.dropTableIfExists("design_options");
  await knex.schema.dropTableIfExists("materials");
  await knex.schema.dropTableIfExists("product_images");
  await knex.schema.dropTableIfExists("products");
  await knex.schema.dropTableIfExists("jewelry_types");
};

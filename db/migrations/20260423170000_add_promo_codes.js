exports.up = async function up(knex) {
  await knex.schema.createTable("promo_codes", (table) => {
    table.bigIncrements("id").primary();
    table.string("code", 64).notNullable().unique();
    table.enu("discount_type", ["fixed_amount", "percent"]).notNullable();
    table.decimal("discount_value", 10, 2).notNullable();
    table.decimal("min_order_amount", 10, 2).notNullable().defaultTo(0);
    table.integer("max_redemptions").nullable();
    table.integer("per_user_limit").nullable();
    table.timestamp("starts_at").nullable();
    table.timestamp("expires_at").nullable();
    table.string("description", 255).nullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index(["is_active", "code"]);
  });

  await knex.schema.createTable("promo_code_redemptions", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("promo_code_id").unsigned().notNullable().references("id").inTable("promo_codes").onDelete("CASCADE");
    table.bigInteger("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.bigInteger("cart_id").unsigned().references("id").inTable("carts").onDelete("SET NULL");
    table.bigInteger("order_id").unsigned().references("id").inTable("orders").onDelete("SET NULL");
    table.string("code_snapshot", 64).notNullable();
    table.decimal("discount_amount", 10, 2).notNullable().defaultTo(0);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index(["promo_code_id", "created_at"]);
    table.index(["promo_code_id", "user_id"]);
    table.index(["order_id"]);
  });

  await knex.schema.alterTable("carts", (table) => {
    table.bigInteger("promo_code_id").unsigned().references("id").inTable("promo_codes").onDelete("SET NULL");
  });

  await knex.schema.alterTable("orders", (table) => {
    table.bigInteger("promo_code_id").unsigned().references("id").inTable("promo_codes").onDelete("SET NULL");
    table.string("promo_code_snapshot", 64).nullable();
    table.decimal("discount_amount", 10, 2).notNullable().defaultTo(0);
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable("orders", (table) => {
    table.dropColumn("discount_amount");
    table.dropColumn("promo_code_snapshot");
    table.dropColumn("promo_code_id");
  });

  await knex.schema.alterTable("carts", (table) => {
    table.dropColumn("promo_code_id");
  });

  await knex.schema.dropTableIfExists("promo_code_redemptions");
  await knex.schema.dropTableIfExists("promo_codes");
};

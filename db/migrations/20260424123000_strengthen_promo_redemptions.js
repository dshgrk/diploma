// Файл описує зміну схеми SQLite через Knex migration.
// Виконує локальну логіку up для модуля міграції бази даних.
exports.up = async function up(knex) {
  await knex.schema.alterTable("promo_codes", (table) => {
    table.integer("redemption_count").notNullable().defaultTo(0);
  });

  await knex.schema.createTable("promo_code_user_usage", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("promo_code_id").unsigned().notNullable().references("id").inTable("promo_codes").onDelete("CASCADE");
    table.bigInteger("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.integer("redemption_count").notNullable().defaultTo(0);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.unique(["promo_code_id", "user_id"]);
  });

  const promoCodes = await knex("promo_codes").select("id");
  for (const promoCode of promoCodes) {
    const aggregate = await knex("promo_code_redemptions")
      .where({ promo_code_id: promoCode.id })
      .count({ total: "*" })
      .first();

    await knex("promo_codes")
      .where({ id: promoCode.id })
      .update({ redemption_count: Number(aggregate?.total || 0) });
  }

  const userUsageRows = await knex("promo_code_redemptions")
    .select("promo_code_id", "user_id")
    .count({ redemption_count: "*" })
    .groupBy("promo_code_id", "user_id");

  if (userUsageRows.length) {
    await knex("promo_code_user_usage").insert(
      userUsageRows.map((row) => ({
        promo_code_id: row.promo_code_id,
        user_id: row.user_id,
        redemption_count: Number(row.redemption_count || 0)
      }))
    );
  }

  await knex.schema.alterTable("promo_code_redemptions", (table) => {
    table.unique(["order_id"]);
  });
};

// Виконує локальну логіку down для модуля міграції бази даних.
exports.down = async function down(knex) {
  await knex.schema.alterTable("promo_code_redemptions", (table) => {
    table.dropUnique(["order_id"]);
  });

  await knex.schema.dropTableIfExists("promo_code_user_usage");

  await knex.schema.alterTable("promo_codes", (table) => {
    table.dropColumn("redemption_count");
  });
};

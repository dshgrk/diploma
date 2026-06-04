// Файл описує зміну схеми SQLite через Knex migration.
// Виконує локальну логіку up для модуля міграції бази даних.
exports.up = async function up(knex) {
  await knex.schema.alterTable("users", (table) => {
    table.string("google_sub", 255).nullable().unique();
    table.string("auth_provider", 32).notNullable().defaultTo("local");
    table.timestamp("email_verified_at").nullable();
  });

  await knex("users").update({
    auth_provider: "local",
    email_verified_at: knex.fn.now()
  });

  await knex.schema.createTable("email_verification_codes", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("email", 255).notNullable();
    table.string("code_hash", 255).notNullable();
    table.string("purpose", 32).notNullable().defaultTo("account_verification");
    table.integer("attempt_count").notNullable().defaultTo(0);
    table.timestamp("expires_at").notNullable();
    table.timestamp("consumed_at").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index(["user_id", "purpose", "created_at"]);
  });
};

// Виконує локальну логіку down для модуля міграції бази даних.
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("email_verification_codes");
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("email_verified_at");
    table.dropColumn("auth_provider");
    table.dropColumn("google_sub");
  });
};

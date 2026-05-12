exports.up = async function up(knex) {
  await knex.schema.createTable("users", (table) => {
    table.bigIncrements("id").primary();
    table.enu("role", ["client", "admin"]).notNullable().defaultTo("client");
    table.string("full_name", 255).notNullable();
    table.string("email", 255).notNullable().unique();
    table.string("phone", 50);
    table.string("password_hash", 255).notNullable();
    table.enu("preferred_locale", ["uk", "en"]).notNullable().defaultTo("uk");
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("sessions", (table) => {
    table.string("id", 36).primary();
    table.bigInteger("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("token_hash", 255).notNullable().unique();
    table.string("ip_address", 64);
    table.string("user_agent", 512);
    table.timestamp("expires_at").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index(["user_id", "expires_at"]);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("sessions");
  await knex.schema.dropTableIfExists("users");
};

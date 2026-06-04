// Файл описує зміну схеми SQLite через Knex migration.
// Виконує локальну логіку up для модуля міграції бази даних.
exports.up = async function up(knex) {
  await knex.schema.createTable("carts", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.enu("status", ["active", "checked_out"]).notNullable().defaultTo("active");
    table.string("currency", 3).notNullable().defaultTo("UAH");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index(["user_id", "status"]);
  });

  await knex.schema.createTable("cart_items", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("cart_id").unsigned().notNullable().references("id").inTable("carts").onDelete("CASCADE");
    table.enu("item_type", ["ready_product", "custom_design"]).notNullable();
    table.bigInteger("product_id").unsigned().references("id").inTable("products").onDelete("SET NULL");
    table.bigInteger("jewelry_type_id").unsigned().references("id").inTable("jewelry_types").onDelete("SET NULL");
    table.json("configuration_json");
    table.string("title_snapshot", 255).notNullable();
    table.decimal("unit_price", 10, 2).notNullable();
    table.integer("quantity").notNullable().defaultTo(1);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index(["cart_id"]);
  });

  await knex.schema.createTable("orders", (table) => {
    table.bigIncrements("id").primary();
    table.string("order_number", 32).notNullable().unique();
    table.bigInteger("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.enu("status", ["created_pending_payment", "confirmed", "in_progress", "completed"]).notNullable();
    table.string("customer_name", 255).notNullable();
    table.string("email", 255).notNullable();
    table.string("phone", 50).notNullable();
    table.string("delivery_method", 64).notNullable();
    table.text("delivery_address").notNullable();
    table.decimal("subtotal_amount", 10, 2).notNullable();
    table.decimal("total_amount", 10, 2).notNullable();
    table.string("currency", 3).notNullable().defaultTo("UAH");
    table.timestamp("accepted_offer_at").nullable();
    table.timestamp("accepted_return_policy_at").nullable();
    table.timestamp("confirmed_at").nullable();
    table.timestamp("in_progress_at").nullable();
    table.timestamp("completed_at").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index(["user_id", "created_at"]);
    table.index(["status", "created_at"]);
  });

  await knex.schema.createTable("order_items", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("order_id").unsigned().notNullable().references("id").inTable("orders").onDelete("CASCADE");
    table.enu("item_type", ["ready_product", "custom_design"]).notNullable();
    table.bigInteger("product_id").unsigned().references("id").inTable("products").onDelete("SET NULL");
    table.bigInteger("jewelry_type_id").unsigned().references("id").inTable("jewelry_types").onDelete("SET NULL");
    table.string("title_snapshot", 255).notNullable();
    table.json("configuration_json");
    table.decimal("unit_price", 10, 2).notNullable();
    table.integer("quantity").notNullable().defaultTo(1);
    table.decimal("line_total", 10, 2).notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("order_status_history", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("order_id").unsigned().notNullable().references("id").inTable("orders").onDelete("CASCADE");
    table.string("old_status", 64);
    table.string("new_status", 64).notNullable();
    table.bigInteger("changed_by_user_id").unsigned().references("id").inTable("users").onDelete("SET NULL");
    table.string("comment", 500);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index(["order_id", "created_at"]);
  });

  await knex.schema.createTable("payments", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("order_id").unsigned().notNullable().references("id").inTable("orders").onDelete("CASCADE");
    table.enu("provider", ["mock"]).notNullable().defaultTo("mock");
    table.string("provider_payment_id", 128).notNullable().unique();
    table.enu("status", ["pending", "succeeded", "failed"]).notNullable().defaultTo("pending");
    table.decimal("amount", 10, 2).notNullable();
    table.string("currency", 3).notNullable().defaultTo("UAH");
    table.json("payload_json");
    table.timestamp("paid_at").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index(["order_id", "status"]);
  });

  await knex.schema.createTable("notification_logs", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("order_id").unsigned().notNullable().references("id").inTable("orders").onDelete("CASCADE");
    table.enu("channel", ["email"]).notNullable().defaultTo("email");
    table.string("template_code", 64).notNullable();
    table.string("recipient", 255).notNullable();
    table.enu("status", ["pending", "sent", "failed"]).notNullable().defaultTo("pending");
    table.json("payload_json");
    table.text("error_message").nullable();
    table.timestamp("sent_at").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index(["order_id", "created_at"]);
  });
};

// Виконує локальну логіку down для модуля міграції бази даних.
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("notification_logs");
  await knex.schema.dropTableIfExists("payments");
  await knex.schema.dropTableIfExists("order_status_history");
  await knex.schema.dropTableIfExists("order_items");
  await knex.schema.dropTableIfExists("orders");
  await knex.schema.dropTableIfExists("cart_items");
  await knex.schema.dropTableIfExists("carts");
};

// Файл описує зміну схеми SQLite через Knex migration.
// Перевіряє is sqlite і повертає результат або кидає помилку валідації.
function isSqlite(knex) {
  return knex.client.config.client === "sqlite3";
}

// Виконує локальну логіку recreate sqlite table для модуля міграції бази даних.
async function recreateSqliteTable(knex, { tableName, createSql, copySql }) {
  const tempTableName = `${tableName}__new`;
  const finalCreateSql = createSql.replaceAll("__TABLE_NAME__", tempTableName);

  await knex.raw("PRAGMA foreign_keys = OFF");
  await knex.transaction(async (trx) => {
    await trx.raw(finalCreateSql);
    await trx.raw(copySql.replaceAll("__TABLE_NAME__", tempTableName));
    await trx.schema.dropTable(tableName);
    await trx.raw(`ALTER TABLE ${tempTableName} RENAME TO ${tableName}`);
  });
  await knex.raw("PRAGMA foreign_keys = ON");
}

// Виконує локальну логіку up для модуля міграції бази даних.
exports.up = async function up(knex) {
  if (isSqlite(knex)) {
    await recreateSqliteTable(knex, {
      tableName: "cart_items",
      createSql: `
        CREATE TABLE __TABLE_NAME__ (
          id integer not null primary key autoincrement,
          cart_id bigint not null references carts(id) on delete CASCADE,
          item_type text not null check (item_type in ('ready_product', 'custom_design')),
          product_id bigint references products(id) on delete SET NULL,
          jewelry_type_id bigint references jewelry_types(id) on delete SET NULL,
          configuration_json json,
          title_snapshot varchar(255) not null,
          unit_price decimal(10, 2) not null check (unit_price >= 0),
          quantity integer not null default 1 check (quantity > 0),
          created_at datetime not null default CURRENT_TIMESTAMP,
          updated_at datetime not null default CURRENT_TIMESTAMP,
          check (
            (item_type = 'ready_product' and product_id is not null and jewelry_type_id is null and configuration_json is null) or
            (item_type = 'custom_design' and product_id is null and jewelry_type_id is not null)
          )
        )
      `,
      copySql: `
        INSERT INTO __TABLE_NAME__ (
          id, cart_id, item_type, product_id, jewelry_type_id, configuration_json,
          title_snapshot, unit_price, quantity, created_at, updated_at
        )
        SELECT
          id, cart_id, item_type, product_id, jewelry_type_id, configuration_json,
          title_snapshot, unit_price, quantity, created_at, updated_at
        FROM cart_items
      `
    });

    await knex.schema.alterTable("cart_items", (table) => {
      table.index(["cart_id"]);
    });

    await recreateSqliteTable(knex, {
      tableName: "order_items",
      createSql: `
        CREATE TABLE __TABLE_NAME__ (
          id integer not null primary key autoincrement,
          order_id bigint not null references orders(id) on delete CASCADE,
          item_type text not null check (item_type in ('ready_product', 'custom_design')),
          product_id bigint references products(id) on delete SET NULL,
          jewelry_type_id bigint references jewelry_types(id) on delete SET NULL,
          title_snapshot varchar(255) not null,
          configuration_json json,
          unit_price decimal(10, 2) not null check (unit_price >= 0),
          quantity integer not null default 1 check (quantity > 0),
          line_total decimal(10, 2) not null check (line_total >= 0),
          created_at datetime not null default CURRENT_TIMESTAMP,
          check (
            (item_type = 'ready_product' and product_id is not null and jewelry_type_id is null and configuration_json is null) or
            (item_type = 'custom_design' and product_id is null and jewelry_type_id is not null)
          ),
          check (abs(line_total - (unit_price * quantity)) < 0.01)
        )
      `,
      copySql: `
        INSERT INTO __TABLE_NAME__ (
          id, order_id, item_type, product_id, jewelry_type_id, title_snapshot,
          configuration_json, unit_price, quantity, line_total, created_at
        )
        SELECT
          id, order_id, item_type, product_id, jewelry_type_id, title_snapshot,
          configuration_json, unit_price, quantity, line_total, created_at
        FROM order_items
      `
    });

    await recreateSqliteTable(knex, {
      tableName: "orders",
      createSql: `
        CREATE TABLE __TABLE_NAME__ (
          id integer not null primary key autoincrement,
          order_number varchar(32) not null unique,
          user_id bigint not null references users(id) on delete CASCADE,
          status text not null check (status in ('created_pending_payment', 'confirmed', 'in_progress', 'completed')),
          customer_name varchar(255) not null,
          email varchar(255) not null,
          phone varchar(50) not null,
          delivery_method varchar(64) not null,
          delivery_address text not null,
          subtotal_amount decimal(10, 2) not null check (subtotal_amount >= 0),
          total_amount decimal(10, 2) not null check (total_amount >= 0),
          currency varchar(3) not null default 'UAH',
          accepted_offer_at datetime,
          accepted_return_policy_at datetime,
          confirmed_at datetime,
          in_progress_at datetime,
          completed_at datetime,
          created_at datetime not null default CURRENT_TIMESTAMP,
          updated_at datetime not null default CURRENT_TIMESTAMP,
          promo_code_id bigint references promo_codes(id) on delete SET NULL,
          promo_code_snapshot varchar(64),
          discount_amount decimal(10, 2) not null default 0 check (discount_amount >= 0),
          check (total_amount <= subtotal_amount),
          check (abs(total_amount - (subtotal_amount - discount_amount)) < 0.01)
        )
      `,
      copySql: `
        INSERT INTO __TABLE_NAME__ (
          id, order_number, user_id, status, customer_name, email, phone, delivery_method,
          delivery_address, subtotal_amount, total_amount, currency, accepted_offer_at,
          accepted_return_policy_at, confirmed_at, in_progress_at, completed_at,
          created_at, updated_at, promo_code_id, promo_code_snapshot, discount_amount
        )
        SELECT
          id, order_number, user_id, status, customer_name, email, phone, delivery_method,
          delivery_address, subtotal_amount, total_amount, currency, accepted_offer_at,
          accepted_return_policy_at, confirmed_at, in_progress_at, completed_at,
          created_at, updated_at, promo_code_id, promo_code_snapshot, discount_amount
        FROM orders
      `
    });

    await knex.schema.alterTable("orders", (table) => {
      table.index(["user_id", "created_at"]);
      table.index(["status", "created_at"]);
    });

    await recreateSqliteTable(knex, {
      tableName: "payments",
      createSql: `
        CREATE TABLE __TABLE_NAME__ (
          id integer not null primary key autoincrement,
          order_id bigint not null references orders(id) on delete CASCADE,
          provider text not null default 'mock' check (provider in ('mock')),
          provider_payment_id varchar(128) not null unique,
          status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
          amount decimal(10, 2) not null check (amount >= 0),
          currency varchar(3) not null default 'UAH',
          payload_json json,
          paid_at datetime,
          created_at datetime not null default CURRENT_TIMESTAMP
        )
      `,
      copySql: `
        INSERT INTO __TABLE_NAME__ (
          id, order_id, provider, provider_payment_id, status, amount, currency, payload_json, paid_at, created_at
        )
        SELECT
          id, order_id, provider, provider_payment_id, status, amount, currency, payload_json, paid_at, created_at
        FROM payments
      `
    });

    await knex.schema.alterTable("payments", (table) => {
      table.index(["order_id", "status"]);
    });

    return;
  }

  await knex.raw(`
    ALTER TABLE cart_items
      ADD CONSTRAINT chk_cart_items_unit_price_non_negative CHECK (unit_price >= 0),
      ADD CONSTRAINT chk_cart_items_quantity_positive CHECK (quantity > 0),
      ADD CONSTRAINT chk_cart_items_shape CHECK (
        (item_type = 'ready_product' AND product_id IS NOT NULL AND jewelry_type_id IS NULL AND configuration_json IS NULL) OR
        (item_type = 'custom_design' AND product_id IS NULL AND jewelry_type_id IS NOT NULL)
      )
  `);

  await knex.raw(`
    ALTER TABLE order_items
      ADD CONSTRAINT chk_order_items_unit_price_non_negative CHECK (unit_price >= 0),
      ADD CONSTRAINT chk_order_items_quantity_positive CHECK (quantity > 0),
      ADD CONSTRAINT chk_order_items_line_total_non_negative CHECK (line_total >= 0),
      ADD CONSTRAINT chk_order_items_line_total_consistent CHECK (ABS(line_total - (unit_price * quantity)) < 0.01),
      ADD CONSTRAINT chk_order_items_shape CHECK (
        (item_type = 'ready_product' AND product_id IS NOT NULL AND jewelry_type_id IS NULL AND configuration_json IS NULL) OR
        (item_type = 'custom_design' AND product_id IS NULL AND jewelry_type_id IS NOT NULL)
      )
  `);

  await knex.raw(`
    ALTER TABLE orders
      ADD CONSTRAINT chk_orders_subtotal_non_negative CHECK (subtotal_amount >= 0),
      ADD CONSTRAINT chk_orders_discount_non_negative CHECK (discount_amount >= 0),
      ADD CONSTRAINT chk_orders_total_non_negative CHECK (total_amount >= 0),
      ADD CONSTRAINT chk_orders_total_lte_subtotal CHECK (total_amount <= subtotal_amount),
      ADD CONSTRAINT chk_orders_total_consistent CHECK (ABS(total_amount - (subtotal_amount - discount_amount)) < 0.01)
  `);

  await knex.raw(`
    ALTER TABLE payments
      ADD CONSTRAINT chk_payments_amount_non_negative CHECK (amount >= 0)
  `);
};

// Виконує локальну логіку down для модуля міграції бази даних.
exports.down = async function down(knex) {
  if (isSqlite(knex)) {
    await recreateSqliteTable(knex, {
      tableName: "cart_items",
      createSql: `
        CREATE TABLE __TABLE_NAME__ (
          id integer not null primary key autoincrement,
          cart_id bigint not null references carts(id) on delete CASCADE,
          item_type text not null check (item_type in ('ready_product', 'custom_design')),
          product_id bigint references products(id) on delete SET NULL,
          jewelry_type_id bigint references jewelry_types(id) on delete SET NULL,
          configuration_json json,
          title_snapshot varchar(255) not null,
          unit_price decimal(10, 2) not null,
          quantity integer not null default 1,
          created_at datetime not null default CURRENT_TIMESTAMP,
          updated_at datetime not null default CURRENT_TIMESTAMP
        )
      `,
      copySql: `
        INSERT INTO __TABLE_NAME__ (
          id, cart_id, item_type, product_id, jewelry_type_id, configuration_json,
          title_snapshot, unit_price, quantity, created_at, updated_at
        )
        SELECT
          id, cart_id, item_type, product_id, jewelry_type_id, configuration_json,
          title_snapshot, unit_price, quantity, created_at, updated_at
        FROM cart_items
      `
    });

    await knex.schema.alterTable("cart_items", (table) => {
      table.index(["cart_id"]);
    });

    await recreateSqliteTable(knex, {
      tableName: "order_items",
      createSql: `
        CREATE TABLE __TABLE_NAME__ (
          id integer not null primary key autoincrement,
          order_id bigint not null references orders(id) on delete CASCADE,
          item_type text not null check (item_type in ('ready_product', 'custom_design')),
          product_id bigint references products(id) on delete SET NULL,
          jewelry_type_id bigint references jewelry_types(id) on delete SET NULL,
          title_snapshot varchar(255) not null,
          configuration_json json,
          unit_price decimal(10, 2) not null,
          quantity integer not null default 1,
          line_total decimal(10, 2) not null,
          created_at datetime not null default CURRENT_TIMESTAMP
        )
      `,
      copySql: `
        INSERT INTO __TABLE_NAME__ (
          id, order_id, item_type, product_id, jewelry_type_id, title_snapshot,
          configuration_json, unit_price, quantity, line_total, created_at
        )
        SELECT
          id, order_id, item_type, product_id, jewelry_type_id, title_snapshot,
          configuration_json, unit_price, quantity, line_total, created_at
        FROM order_items
      `
    });

    await recreateSqliteTable(knex, {
      tableName: "orders",
      createSql: `
        CREATE TABLE __TABLE_NAME__ (
          id integer not null primary key autoincrement,
          order_number varchar(32) not null unique,
          user_id bigint not null references users(id) on delete CASCADE,
          status text not null check (status in ('created_pending_payment', 'confirmed', 'in_progress', 'completed')),
          customer_name varchar(255) not null,
          email varchar(255) not null,
          phone varchar(50) not null,
          delivery_method varchar(64) not null,
          delivery_address text not null,
          subtotal_amount decimal(10, 2) not null,
          total_amount decimal(10, 2) not null,
          currency varchar(3) not null default 'UAH',
          accepted_offer_at datetime,
          accepted_return_policy_at datetime,
          confirmed_at datetime,
          in_progress_at datetime,
          completed_at datetime,
          created_at datetime not null default CURRENT_TIMESTAMP,
          updated_at datetime not null default CURRENT_TIMESTAMP,
          promo_code_id bigint references promo_codes(id) on delete SET NULL,
          promo_code_snapshot varchar(64),
          discount_amount decimal(10, 2) not null default 0
        )
      `,
      copySql: `
        INSERT INTO __TABLE_NAME__ (
          id, order_number, user_id, status, customer_name, email, phone, delivery_method,
          delivery_address, subtotal_amount, total_amount, currency, accepted_offer_at,
          accepted_return_policy_at, confirmed_at, in_progress_at, completed_at,
          created_at, updated_at, promo_code_id, promo_code_snapshot, discount_amount
        )
        SELECT
          id, order_number, user_id, status, customer_name, email, phone, delivery_method,
          delivery_address, subtotal_amount, total_amount, currency, accepted_offer_at,
          accepted_return_policy_at, confirmed_at, in_progress_at, completed_at,
          created_at, updated_at, promo_code_id, promo_code_snapshot, discount_amount
        FROM orders
      `
    });

    await knex.schema.alterTable("orders", (table) => {
      table.index(["user_id", "created_at"]);
      table.index(["status", "created_at"]);
    });

    await recreateSqliteTable(knex, {
      tableName: "payments",
      createSql: `
        CREATE TABLE __TABLE_NAME__ (
          id integer not null primary key autoincrement,
          order_id bigint not null references orders(id) on delete CASCADE,
          provider text not null default 'mock' check (provider in ('mock')),
          provider_payment_id varchar(128) not null unique,
          status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
          amount decimal(10, 2) not null,
          currency varchar(3) not null default 'UAH',
          payload_json json,
          paid_at datetime,
          created_at datetime not null default CURRENT_TIMESTAMP
        )
      `,
      copySql: `
        INSERT INTO __TABLE_NAME__ (
          id, order_id, provider, provider_payment_id, status, amount, currency, payload_json, paid_at, created_at
        )
        SELECT
          id, order_id, provider, provider_payment_id, status, amount, currency, payload_json, paid_at, created_at
        FROM payments
      `
    });

    await knex.schema.alterTable("payments", (table) => {
      table.index(["order_id", "status"]);
    });

    return;
  }

  await knex.raw(`
    ALTER TABLE payments
      DROP CONSTRAINT chk_payments_amount_non_negative
  `);

  await knex.raw(`
    ALTER TABLE orders
      DROP CONSTRAINT chk_orders_subtotal_non_negative,
      DROP CONSTRAINT chk_orders_discount_non_negative,
      DROP CONSTRAINT chk_orders_total_non_negative,
      DROP CONSTRAINT chk_orders_total_lte_subtotal,
      DROP CONSTRAINT chk_orders_total_consistent
  `);

  await knex.raw(`
    ALTER TABLE order_items
      DROP CONSTRAINT chk_order_items_unit_price_non_negative,
      DROP CONSTRAINT chk_order_items_quantity_positive,
      DROP CONSTRAINT chk_order_items_line_total_non_negative,
      DROP CONSTRAINT chk_order_items_line_total_consistent,
      DROP CONSTRAINT chk_order_items_shape
  `);

  await knex.raw(`
    ALTER TABLE cart_items
      DROP CONSTRAINT chk_cart_items_unit_price_non_negative,
      DROP CONSTRAINT chk_cart_items_quantity_positive,
      DROP CONSTRAINT chk_cart_items_shape
  `);
};

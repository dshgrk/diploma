function isSqlite(knex) {
  return knex.client.config.client === "sqlite3";
}

async function recreateSqliteTable(knex, { tableName, createSql, copySql, postCreate }) {
  const tempTableName = `${tableName}__new`;
  const finalCreateSql = createSql.replaceAll("__TABLE_NAME__", tempTableName);

  await knex.raw("PRAGMA foreign_keys = OFF");
  await knex.transaction(async (trx) => {
    await trx.raw(finalCreateSql);
    await trx.raw(copySql.replaceAll("__TABLE_NAME__", tempTableName));
    await trx.schema.dropTable(tableName);
    await trx.raw(`ALTER TABLE ${tempTableName} RENAME TO ${tableName}`);
    if (typeof postCreate === "function") {
      await postCreate(trx);
    }
  });
  await knex.raw("PRAGMA foreign_keys = ON");
}

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
            (item_type = 'ready_product' and product_id is not null and jewelry_type_id is null) or
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
      `,
      postCreate: async (trx) => {
        await trx.schema.alterTable("cart_items", (table) => {
          table.index(["cart_id"]);
        });
      }
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
            (item_type = 'ready_product' and product_id is not null and jewelry_type_id is null) or
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

    return;
  }

  await knex.raw(`
    ALTER TABLE cart_items
      DROP CONSTRAINT IF EXISTS chk_cart_items_shape,
      ADD CONSTRAINT chk_cart_items_shape CHECK (
        (item_type = 'ready_product' AND product_id IS NOT NULL AND jewelry_type_id IS NULL) OR
        (item_type = 'custom_design' AND product_id IS NULL AND jewelry_type_id IS NOT NULL)
      )
  `);

  await knex.raw(`
    ALTER TABLE order_items
      DROP CONSTRAINT IF EXISTS chk_order_items_shape,
      ADD CONSTRAINT chk_order_items_shape CHECK (
        (item_type = 'ready_product' AND product_id IS NOT NULL AND jewelry_type_id IS NULL) OR
        (item_type = 'custom_design' AND product_id IS NULL AND jewelry_type_id IS NOT NULL)
      )
  `);
};

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
          id, cart_id, item_type, product_id, jewelry_type_id,
          CASE
            WHEN item_type = 'ready_product' THEN NULL
            ELSE configuration_json
          END,
          title_snapshot, unit_price, quantity, created_at, updated_at
        FROM cart_items
      `,
      postCreate: async (trx) => {
        await trx.schema.alterTable("cart_items", (table) => {
          table.index(["cart_id"]);
        });
      }
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
          CASE
            WHEN item_type = 'ready_product' THEN NULL
            ELSE configuration_json
          END,
          unit_price, quantity, line_total, created_at
        FROM order_items
      `
    });

    return;
  }

  await knex.raw(`
    ALTER TABLE cart_items
      DROP CONSTRAINT IF EXISTS chk_cart_items_shape,
      ADD CONSTRAINT chk_cart_items_shape CHECK (
        (item_type = 'ready_product' AND product_id IS NOT NULL AND jewelry_type_id IS NULL AND configuration_json IS NULL) OR
        (item_type = 'custom_design' AND product_id IS NULL AND jewelry_type_id IS NOT NULL)
      )
  `);

  await knex.raw(`
    ALTER TABLE order_items
      DROP CONSTRAINT IF EXISTS chk_order_items_shape,
      ADD CONSTRAINT chk_order_items_shape CHECK (
        (item_type = 'ready_product' AND product_id IS NOT NULL AND jewelry_type_id IS NULL AND configuration_json IS NULL) OR
        (item_type = 'custom_design' AND product_id IS NULL AND jewelry_type_id IS NOT NULL)
      )
  `);
};

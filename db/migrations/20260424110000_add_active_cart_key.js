// Файл описує зміну схеми SQLite через Knex migration.
// Виконує локальну логіку up для модуля міграції бази даних.
exports.up = async function up(knex) {
  await knex.schema.alterTable("carts", (table) => {
    table.string("active_cart_key", 64).nullable();
  });

  const activeCarts = await knex("carts").select("id", "user_id").where({ status: "active" });
  for (const cart of activeCarts) {
    await knex("carts").where({ id: cart.id }).update({
      active_cart_key: `active:${cart.user_id}`
    });
  }

  await knex.schema.alterTable("carts", (table) => {
    table.unique(["active_cart_key"]);
  });
};

// Виконує локальну логіку down для модуля міграції бази даних.
exports.down = async function down(knex) {
  await knex.schema.alterTable("carts", (table) => {
    table.dropUnique(["active_cart_key"]);
    table.dropColumn("active_cart_key");
  });
};

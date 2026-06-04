// Файл описує зміну схеми SQLite через Knex migration.
// Виконує локальну логіку up для модуля міграції бази даних.
exports.up = async function up(knex) {
  await knex.schema.alterTable("products", (table) => {
    table.string("filter_type", 32);
    table.string("filter_metal", 32);
    table.string("filter_stone_type", 32);
    table.string("filter_stone_shape", 32);
    table.string("filter_stone_color", 32);
    table.string("filter_stone_size", 32);
    table.string("filter_ring_size", 16);
    table.string("filter_ring_type", 32);
    table.string("filter_bracelet_length", 16);

    table.index(["is_active", "filter_type"]);
    table.index(["filter_metal"]);
    table.index(["filter_stone_type"]);
  });
};

// Виконує локальну логіку down для модуля міграції бази даних.
exports.down = async function down(knex) {
  await knex.schema.alterTable("products", (table) => {
    table.dropIndex(["is_active", "filter_type"]);
    table.dropIndex(["filter_metal"]);
    table.dropIndex(["filter_stone_type"]);

    table.dropColumn("filter_type");
    table.dropColumn("filter_metal");
    table.dropColumn("filter_stone_type");
    table.dropColumn("filter_stone_shape");
    table.dropColumn("filter_stone_color");
    table.dropColumn("filter_stone_size");
    table.dropColumn("filter_ring_size");
    table.dropColumn("filter_ring_type");
    table.dropColumn("filter_bracelet_length");
  });
};

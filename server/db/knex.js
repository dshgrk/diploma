// Файл створює єдине Knex-підключення до SQLite та задає локальні PRAGMA-налаштування.
const knex = require("knex");
const { env } = require("../config/env");

const db = knex({
  client: "sqlite3",
  connection: {
    filename: process.env.DB_FILENAME || "./db/dev-memory.sqlite3"
  },
  pool: {
    min: 1,
    max: 1,
    afterCreate(connection, done) {
      connection.run("PRAGMA journal_mode = MEMORY;", (journalError) => {
        if (journalError) return done(journalError, connection);
        connection.run("PRAGMA synchronous = OFF;", (syncError) => done(syncError, connection));
      });
    }
  },
  useNullAsDefault: true,
  debug: env.dbDebug
});

module.exports = { db };

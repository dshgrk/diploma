require("dotenv").config();

function sqliteConfig(filename) {
  return {
    client: "sqlite3",
    connection: {
      filename
    },
    asyncStackTraces: true,
    acquireConnectionTimeout: 10000,
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
    migrations: {
      directory: "./db/migrations",
      tableName: "knex_migrations"
    },
    seeds: {
      directory: "./db/seeds"
    }
  };
}

module.exports = {
  development: sqliteConfig(process.env.DB_FILENAME || "./db/dev-memory.sqlite3"),
  production: sqliteConfig(process.env.DB_FILENAME || "./db/dev-memory.sqlite3"),
  test: sqliteConfig(process.env.DB_FILENAME_TEST || "./db/test.sqlite3")
};

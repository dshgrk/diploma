module.exports = {
  test: {
    include: ["tests/**/*.test.js"],
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
};

const path = require("path");

function sendReactApp(res) {
  const reactIndex = path.resolve(process.cwd(), "public", "react-app", "index.html");
  res.sendFile(reactIndex);
}

function registerPageRoutes(app) {
  app.get("/", (req, res) => sendReactApp(res));
  app.get("/catalog", (req, res) => sendReactApp(res));
  app.get("/about", (req, res) => sendReactApp(res));
  app.get("/auth", (req, res) => sendReactApp(res));
  app.get("/account", (req, res) => sendReactApp(res));
  app.get("/products/:slug", (req, res) => sendReactApp(res));
  app.get("/constructor", (req, res) => sendReactApp(res));
  app.get("/cart", (req, res) => sendReactApp(res));
  app.get("/checkout", (req, res) => sendReactApp(res));
  app.get("/orders", (req, res) => sendReactApp(res));
  app.get("/orders/:id", (req, res) => sendReactApp(res));
  app.get("/admin/login", (req, res) => sendReactApp(res));
  app.get("/admin/orders", (req, res) => sendReactApp(res));
  app.get("/admin/orders/:id", (req, res) => sendReactApp(res));
  app.get("/admin/products", (req, res) => sendReactApp(res));
  app.get("/admin/constructor", (req, res) => sendReactApp(res));
}

module.exports = { registerPageRoutes };

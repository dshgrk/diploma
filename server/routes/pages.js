// Файл реєструє HTML-маршрути SPA, щоб пряме відкриття URL віддавало React-додаток.
const path = require("path");

const PAGE_ROUTES = [
  "/",
  "/catalog",
  "/about",
  "/auth",
  "/account",
  "/oferta",
  "/returns",
  "/privacy-policy",
  "/products/:slug",
  "/constructor",
  "/cart",
  "/checkout",
  "/payment/:orderId",
  "/orders",
  "/orders/:id",
  "/admin/login",
  "/admin/orders",
  "/admin/orders/:id",
  "/admin/products",
  "/admin/constructor"
];

// Відправляє зібраний React index.html для будь-якої сторінки SPA.
function sendReactApp(res) {
  const reactIndex = path.resolve(process.cwd(), "public", "react-app", "index.html");
  res.sendFile(reactIndex);
}

// Підключає всі публічні та admin-сторінки до Express без дублювання handler'ів.
function registerPageRoutes(app) {
  PAGE_ROUTES.forEach((route) => {
    app.get(route, (req, res) => sendReactApp(res));
  });

  // Віддає React для невідомих non-API URL, щоб SPA показала власну 404-сторінку.
  app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => sendReactApp(res));
}

module.exports = { PAGE_ROUTES, registerPageRoutes };

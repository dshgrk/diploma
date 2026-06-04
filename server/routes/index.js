// Файл містить логіку сторінки index.
const { authRouter } = require("../modules/auth/auth.routes");
const { adminAuthRouter } = require("../modules/auth/admin-auth.routes");
const { catalogRouter } = require("../modules/catalog/catalog.routes");
const { constructorRouter } = require("../modules/constructor/constructor.routes");
const { cartRouter } = require("../modules/cart/cart.routes");
const { checkoutRouter } = require("../modules/checkout/checkout.routes");
const { paymentsRouter } = require("../modules/payments/payments.routes");
const { ordersRouter } = require("../modules/orders/orders.routes");
const { accountRouter } = require("../modules/account/account.routes");
const { adminOrdersRouter } = require("../modules/admin-orders/admin-orders.routes");
const { adminCatalogRouter } = require("../modules/admin-catalog/admin-catalog.routes");
const { adminConstructorRouter } = require("../modules/admin-constructor/admin-constructor.routes");
const { adminAssetsRouter } = require("../modules/admin-assets/admin-assets.routes");

// Виконує локальну логіку register api routes для модуля сторінки index.
function registerApiRoutes(app) {
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminAuthRouter);
  app.use("/api/catalog", catalogRouter);
  app.use("/api/constructor", constructorRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/checkout", checkoutRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/account", accountRouter);
  app.use("/api/admin/orders", adminOrdersRouter);
  app.use("/api/admin/catalog", adminCatalogRouter);
  app.use("/api/admin/constructor", adminConstructorRouter);
  app.use("/api/admin/assets", adminAssetsRouter);
}

module.exports = { registerApiRoutes };

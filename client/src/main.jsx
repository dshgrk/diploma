import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";

const AboutRoute = React.lazy(() => import("./routes/about-route.jsx"));
const AccountRoute = React.lazy(() => import("./routes/account-route.jsx"));
const AdminConstructorRoute = React.lazy(() => import("./routes/admin-constructor-route.jsx"));
const AdminLoginRoute = React.lazy(() => import("./routes/admin-login-route.jsx"));
const AdminOrderDetailRoute = React.lazy(() => import("./routes/admin-order-detail-route.jsx"));
const AdminOrdersRoute = React.lazy(() => import("./routes/admin-orders-route.jsx"));
const AdminProductsRoute = React.lazy(() => import("./routes/admin-products-route.jsx"));
const AuthRoute = React.lazy(() => import("./routes/auth-route.jsx"));
const CartRoute = React.lazy(() => import("./routes/cart-route.jsx"));
const CatalogRoute = React.lazy(() => import("./routes/catalog-route.jsx"));
const CheckoutRoute = React.lazy(() => import("./routes/checkout-route.jsx"));
const ConstructorRoute = React.lazy(() => import("./routes/constructor-route.jsx"));
const HomeRoute = React.lazy(() => import("./routes/home-route.jsx"));
const OrdersRoute = React.lazy(() => import("./routes/orders-route.jsx"));
const OrderDetailRoute = React.lazy(() => import("./routes/order-detail-route.jsx"));
const ProductRoute = React.lazy(() => import("./routes/product-route.jsx"));

function AppBootstrap() {
  const pathname = window.location.pathname;
  const RouteComponent =
    pathname === "/about"
      ? AboutRoute
      : pathname === "/admin/login"
        ? AdminLoginRoute
        : pathname === "/admin/orders"
          ? AdminOrdersRoute
          : /^\/admin\/orders\/\d+$/.test(pathname)
            ? AdminOrderDetailRoute
            : pathname === "/admin/products"
              ? AdminProductsRoute
              : pathname === "/admin/constructor"
                ? AdminConstructorRoute
                : pathname === "/"
                  ? HomeRoute
                  : pathname === "/account"
                    ? AccountRoute
                    : pathname === "/auth"
                      ? AuthRoute
                      : pathname === "/cart"
                        ? CartRoute
                        : pathname === "/checkout"
                          ? CheckoutRoute
                          : pathname === "/catalog"
                            ? CatalogRoute
                            : pathname === "/constructor"
                              ? ConstructorRoute
                              : pathname === "/orders"
                                ? OrdersRoute
                                : /^\/orders\/\d+$/.test(pathname)
                                  ? OrderDetailRoute
                                  : pathname.startsWith("/products/")
                                    ? ProductRoute
                                    : NotFoundRoute;

  return (
    <Suspense fallback={<div className="route-loading" aria-label="Loading page" />}>
      <RouteComponent />
    </Suspense>
  );
}

function NotFoundRoute() {
  return (
    <main className="page-main">
      <section className="section">
        <div className="container empty-state-react">
          <h1>Aurora Atelier</h1>
          <p>Сторінку не знайдено.</p>
          <a className="button" href="/">На головну</a>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<AppBootstrap />);

// Файл запускає React-додаток, підключає lazy-маршрути та вибирає сторінку за поточним URL.
import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BRAND_LOGO_MARK } from "./content";

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
const OfertaRoute = React.lazy(() => import("./routes/oferta-route.jsx"));
const OrdersRoute = React.lazy(() => import("./routes/orders-route.jsx"));
const OrderDetailRoute = React.lazy(() => import("./routes/order-detail-route.jsx"));
const PaymentRoute = React.lazy(() => import("./routes/payment-route.jsx"));
const PrivacyPolicyRoute = React.lazy(() => import("./routes/privacy-policy-route.jsx"));
const ProductRoute = React.lazy(() => import("./routes/product-route.jsx"));
const ReturnsRoute = React.lazy(() => import("./routes/returns-route.jsx"));

const ROUTE_DEFINITIONS = [
  { matches: (pathname) => pathname === "/", component: HomeRoute },
  { matches: (pathname) => pathname === "/about", component: AboutRoute },
  { matches: (pathname) => pathname === "/account", component: AccountRoute },
  { matches: (pathname) => pathname === "/auth", component: AuthRoute },
  { matches: (pathname) => pathname === "/cart", component: CartRoute },
  { matches: (pathname) => pathname === "/catalog", component: CatalogRoute },
  { matches: (pathname) => pathname === "/checkout", component: CheckoutRoute },
  { matches: (pathname) => pathname === "/constructor", component: ConstructorRoute },
  { matches: (pathname) => pathname === "/oferta", component: OfertaRoute },
  { matches: (pathname) => pathname === "/orders", component: OrdersRoute },
  { matches: (pathname) => /^\/orders\/\d+$/.test(pathname), component: OrderDetailRoute },
  { matches: (pathname) => /^\/payment\/\d+$/.test(pathname), component: PaymentRoute },
  { matches: (pathname) => pathname === "/privacy-policy", component: PrivacyPolicyRoute },
  { matches: (pathname) => pathname.startsWith("/products/"), component: ProductRoute },
  { matches: (pathname) => pathname === "/returns", component: ReturnsRoute },
  { matches: (pathname) => pathname === "/admin/login", component: AdminLoginRoute },
  { matches: (pathname) => pathname === "/admin/orders", component: AdminOrdersRoute },
  { matches: (pathname) => /^\/admin\/orders\/\d+$/.test(pathname), component: AdminOrderDetailRoute },
  { matches: (pathname) => pathname === "/admin/products", component: AdminProductsRoute },
  { matches: (pathname) => pathname === "/admin/constructor", component: AdminConstructorRoute }
];

// Визначає React-компонент сторінки для поточного pathname.
function resolveRouteComponent(pathname) {
  return ROUTE_DEFINITIONS.find((route) => route.matches(pathname))?.component || NotFoundRoute;
}

// Монтує обраний route-компонент і показує fallback під час lazy-завантаження.
function AppBootstrap() {
  const RouteComponent = resolveRouteComponent(window.location.pathname);

  return (
    <Suspense fallback={<div className="route-loading" aria-label="Loading page" />}>
      <RouteComponent />
    </Suspense>
  );
}

// Рендерить просту сторінку для невідомих публічних URL.
function NotFoundRoute() {
  return (
    <main className="page-main">
      <section className="section">
        <div className="container empty-state-react">
          <img className="empty-state-brand-mark" src={BRAND_LOGO_MARK} alt="Aurora Atelier" />
          <h1>Aurora Atelier</h1>
          <p>Сторінку не знайдено.</p>
          <a className="button" href="/">На головну</a>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<AppBootstrap />);

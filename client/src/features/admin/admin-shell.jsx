import React from "react";
import { ADMIN_UI } from "../../i18n/admin-copy";

export function AdminShell({ children, title, subtitle }) {
  return (
    <main className="admin-react-page">
      <header className="admin-react-header">
        <div className="admin-react-inner admin-react-header-row">
          <div>
            <a className="admin-brand" href="/admin/orders">Aurora Atelier</a>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <nav className="admin-react-nav" aria-label={ADMIN_UI.shell.navAria}>
            <a href="/admin/orders">{ADMIN_UI.shell.orders}</a>
            <a href="/admin/products">{ADMIN_UI.shell.products}</a>
            <a href="/admin/constructor">{ADMIN_UI.shell.constructor}</a>
            <a href="/">{ADMIN_UI.shell.site}</a>
          </nav>
        </div>
      </header>
      <section className="admin-react-inner admin-react-content">
        {children}
      </section>
    </main>
  );
}

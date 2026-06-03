// Файл містить логіку адмін-панелі.
import React from "react";
import { BRAND_LOGO_MARK } from "../../content";
import { ADMIN_UI } from "../../i18n/admin-copy";

// Компонент рендерить блок admin shell і отримує потрібні дані через props або локальний state.
export function AdminShell({ children, title, subtitle }) {
  return (
    <main className="admin-react-page">
      <header className="admin-react-header">
        <div className="admin-react-inner admin-react-header-row">
          <div>
            <a className="admin-brand" href="/admin/orders" aria-label="Aurora Atelier admin">
              <img className="admin-brand-mark" src={BRAND_LOGO_MARK} alt="" aria-hidden="true" />
              <span className="admin-brand-text">Aurora Atelier</span>
            </a>
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

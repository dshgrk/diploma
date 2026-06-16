// Файл описує React-сторінку public-shell та її локальну UI-логіку.
﻿import React, { useEffect, useState } from "react";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import { authApi, cartApi } from "../api";
import { BRAND_LOGO, referenceCopy } from "../content";
import "../styles/public-footer.css";

const LOCAL_STORAGE_KEY = "aurora-locale";
const GUEST_CART_STORAGE_KEY = "aurora-guest-cart";

const NAV_LABELS = {
  uk: {
    account: "Акаунт",
    cart: "Кошик",
    toggleLanguage: "Змінити мову",
    toggleNavigation: "Відкрити меню"
  },
  en: {
    account: "Account",
    cart: "Cart",
    toggleLanguage: "Change language",
    toggleNavigation: "Open menu"
  }
};

export const LOCALE_FORMATS = {
  uk: "uk-UA",
  en: "en-US"
};

// Отримує get initial locale з поточного набору даних або конфігурації.
export function getInitialLocale() {
  const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  return stored === "en" ? "en" : "uk";
}

// Зчитує дані для read guest cart count з URL, localStorage, файлу або вхідного payload.
function readGuestCartCount() {
  try {
    const raw = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return (parsed?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  } catch {
    return 0;
  }
}

// Хук керує станом та side-effect'ами для use public locale.
export function usePublicLocale() {
  const [locale, setLocale] = useState(getInitialLocale);

  useEffect(() => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  return {
    locale,
    toggleLocale: () => setLocale((current) => (current === "uk" ? "en" : "uk"))
  };
}

// Компонент рендерить блок aurora background і отримує потрібні дані через props або локальний state.
export function AuroraBackground() {
  return (
    <div id="aurora-bg" aria-hidden="true">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <div className="orb orb-5" />
      <div className="orb orb-6" />
    </div>
  );
}

// Компонент рендерить блок header і отримує потрібні дані через props або локальний state.
export function Header({ locale, onToggleLocale }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [accountHref, setAccountHref] = useState("/auth");
  const [cartCelebrating, setCartCelebrating] = useState(false);
  const scrolledRef = React.useRef(false);
  const scrollFrameRef = React.useRef(0);
  const copy = referenceCopy(locale);
  const labels = NAV_LABELS[locale] || NAV_LABELS.en;

  useEffect(() => {
    // Обробляє дію користувача або системну подію для on scroll.
    function onScroll() {
      if (scrollFrameRef.current) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = 0;
        const nextScrolled = window.scrollY > 40;
        if (scrolledRef.current !== nextScrolled) {
          scrolledRef.current = nextScrolled;
          setScrolled(nextScrolled);
        }
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollFrameRef.current) window.cancelAnimationFrame(scrollFrameRef.current);
    };
  }, []);

  useEffect(() => {
    let active = true;
    // Виконує локальну логіку refresh session для модуля сторінки public-shell.
    async function refreshSession() {
      try {
        const session = await authApi.getSession();
        if (active) setAccountHref(session?.authenticated ? "/account" : "/auth");
      } catch {
        if (active) setAccountHref("/auth");
      }
    }

    refreshSession();
    window.addEventListener("focus", refreshSession);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshSession);
    };
  }, []);

  useEffect(() => {
    let active = true;
    // Виконує локальну логіку refresh cart count для модуля сторінки public-shell.
    async function refreshCartCount() {
      try {
        const cart = await cartApi.getCart();
        const count = (cart?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        if (active) setCartCount(count);
      } catch {
        if (active) setCartCount(readGuestCartCount());
      }
    }

    // Обробляє дію користувача або системну подію для handle cart updated.
    function handleCartUpdated(event) {
      if (!active) return;
      const nextCount = Number(event?.detail?.count);
      setCartCount(Number.isFinite(nextCount) ? nextCount : 0);
    }

    // Обробляє дію користувача або системну подію для handle item added.
    function handleItemAdded() {
      if (!active) return;
      setCartCelebrating(false);
      window.requestAnimationFrame(() => setCartCelebrating(true));
      window.setTimeout(() => {
        if (active) setCartCelebrating(false);
      }, 900);
    }

    refreshCartCount();
    window.addEventListener("aurora:cart-updated", handleCartUpdated);
    window.addEventListener("aurora:item-added", handleItemAdded);
    window.addEventListener("focus", refreshCartCount);
    return () => {
      active = false;
      window.removeEventListener("aurora:cart-updated", handleCartUpdated);
      window.removeEventListener("aurora:item-added", handleItemAdded);
      window.removeEventListener("focus", refreshCartCount);
    };
  }, []);

  const links = [
    [copy.navHome, "/"],
    [copy.navAbout, "/about"],
    [copy.navCollection, "/catalog"],
    [copy.navConstructor, "/constructor"]
  ];

  return (
    <header className={`site-nav${scrolled ? " scrolled" : ""}`}>
      <div className="nav-inner">
        <a className="nav-brand" href="/" aria-label="Aurora Atelier home">
          <img className="nav-brand-logo" src={BRAND_LOGO} alt="Aurora Atelier" />
        </a>
        <nav className="nav-links-desktop" aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <a className="nav-link" key={href} href={href}>{label}</a>
          ))}
        </nav>
        <div className="nav-actions">
          <button type="button" className="icon-button header-action" onClick={onToggleLocale} aria-label={labels.toggleLanguage}>
            <span className="lang-toggle">{locale === "uk" ? "EN" : "UK"}</span>
          </button>
          <a className={`icon-button header-action bag-button${cartCelebrating ? " is-celebrating" : ""}`} href="/cart" aria-label={labels.cart}>
            <ShoppingBag aria-hidden="true" />
            {cartCount > 0 ? <span className="cart-badge">{cartCount > 99 ? "99+" : cartCount}</span> : null}
          </a>
          <a className="icon-button header-action" href={accountHref} aria-label={labels.account}>
            <User aria-hidden="true" />
          </a>
          <button
            type="button"
            className="icon-button header-action nav-mobile-toggle"
            aria-label={labels.toggleNavigation}
            onClick={() => setMobileMenuOpen((value) => !value)}
          >
            {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen ? (
        <div className="nav-mobile-menu">
          {links.map(([label, href]) => (
            <a className="nav-mobile-link" key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
              {label}
            </a>
          ))}
        </div>
      ) : null}
    </header>
  );
}

// Компонент рендерить блок footer і отримує потрібні дані через props або локальний state.
export function Footer({ locale }) {
  const copy = referenceCopy(locale);
  const navigationTitle = locale === "uk" ? "Навігація" : "Navigation";
  const accountTitle = locale === "uk" ? "Акаунт" : "Account";
  const clientsTitle = locale === "uk" ? "Клієнтам" : "For clients";
  const ordersTitle = locale === "uk" ? "Мої замовлення" : "My orders";
  const atelierAddress =
    locale === "uk"
      ? "\u043c. \u0425\u0430\u0440\u043a\u0456\u0432, \u0432\u0443\u043b. \u0421\u0443\u043c\u0441\u044c\u043a\u0430, 10, \u0422\u0426 Ave Plaza"
      : "Kharkiv, 10 Sumska St., Ave Plaza Mall";
  const atelierPhone = "+38 (099) 000-00-00";
  const footerOriginLabel = locale === "uk" ? "Створено в Харкові" : "Made in Kharkiv";

  return (
    <footer className="site-footer">
      <div className="section-inner site-footer-inner">
        <div className="site-footer-brand">
          <img className="site-footer-mark site-footer-logo" src={BRAND_LOGO} alt="Aurora Atelier" />
          <p className="site-footer-tagline">{copy.footerText}</p>
        </div>
        <div className="site-footer-columns">
          <div className="site-footer-column">
            <h4 className="site-footer-title">{navigationTitle}</h4>
            <a className="site-footer-link" href="/">{copy.navHome}</a>
            <a className="site-footer-link" href="/about">{copy.navAbout}</a>
            <a className="site-footer-link" href="/catalog">{copy.navCollection}</a>
            <a className="site-footer-link" href="/constructor">{copy.navConstructor}</a>
          </div>
          <div className="site-footer-column">
            <h4 className="site-footer-title">{accountTitle}</h4>
            <a className="site-footer-link" href="/account/orders">{ordersTitle}</a>
            <a className="site-footer-link" href="/account">{accountTitle}</a>
          </div>
          <div className="site-footer-column">
            <h4 className="site-footer-title">{clientsTitle}</h4>
            <a className="site-footer-link" href="/oferta">{locale === "uk" ? "Публічна оферта" : "Public offer"}</a>
            <a className="site-footer-link" href="/returns">{locale === "uk" ? "Повернення та обмін" : "Returns & exchanges"}</a>
            <a className="site-footer-link" href="/privacy-policy">{locale === "uk" ? "Політика конфіденційності" : "Privacy policy"}</a>
          </div>
          <div className="site-footer-column">
            <h4 className="site-footer-title">{copy.contact}</h4>
            <span className="site-footer-text">{atelierAddress}</span>
            <a className="site-footer-link site-footer-email" href="mailto:auroraatelier.mail@gmail.com">
              auroraatelier.mail@gmail.com
            </a>
            <a className="site-footer-link" href="tel:+380990000000">
              {atelierPhone}
            </a>
          </div>
        </div>
      </div>
      <div className="section-inner site-footer-bottom">
        <span className="site-footer-meta">© 2026 Aurora Atelier</span>
        <span className="site-footer-meta">{footerOriginLabel}</span>
      </div>
    </footer>
  );
}

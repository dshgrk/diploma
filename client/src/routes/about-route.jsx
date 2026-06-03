// Файл описує React-сторінку about-route та її локальну UI-логіку.
﻿import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, Menu, ShoppingBag, User, X } from "lucide-react";
import { authApi, cartApi } from "../api";
import { ABOUT_PAGE_CONTENT, BRAND_LOGO, REFERENCE_IMAGES, referenceCopy } from "../content";
import { Footer as PublicFooter } from "./public-shell.jsx";
import "../styles.css";

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

// Отримує get initial locale з поточного набору даних або конфігурації.
function getInitialLocale() {
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

// Компонент рендерить блок header і отримує потрібні дані через props або локальний state.
function Header({ locale, onToggleLocale }) {
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
    // Виконує локальну логіку refresh session для модуля сторінки about-route.
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
    // Виконує локальну логіку refresh cart count для модуля сторінки about-route.
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

// Компонент рендерить блок aurora background і отримує потрібні дані через props або локальний state.
function AuroraBackground() {
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

// Компонент рендерить блок about visual і отримує потрібні дані через props або локальний state.
function AboutVisual({ src, alt, className = "", fallbackClassName = "" }) {
  const [hidden, setHidden] = useState(false);

  return (
    <div className={`${className}${hidden ? " is-fallback" : ""}`}>
      {!hidden && src ? <img src={src} alt={alt} loading="lazy" onError={() => setHidden(true)} /> : null}
      <div className={`about-visual-fallback ${fallbackClassName}`.trim()} aria-hidden={hidden ? "false" : "true"}>
        <span className="about-visual-fallback-line" />
        <span className="about-visual-fallback-line short" />
      </div>
    </div>
  );
}

// Компонент рендерить блок about page і отримує потрібні дані через props або локальний state.
function AboutPage({ locale }) {
  const copy = ABOUT_PAGE_CONTENT[locale] || ABOUT_PAGE_CONTENT.en;
  const [heroVideoUnavailable, setHeroVideoUnavailable] = useState(false);
  const [heroPosterHidden, setHeroPosterHidden] = useState(false);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const galleryItems = useMemo(
    () => [
      { ...copy.gallery.items[0], src: REFERENCE_IMAGES.about?.workshopOverview, className: "about-gallery-card is-large" },
      { ...copy.gallery.items[1], src: REFERENCE_IMAGES.about?.artisanDetail, className: "about-gallery-card is-medium" },
      { ...copy.gallery.items[2], src: REFERENCE_IMAGES.about?.materialsTable, className: "about-gallery-card is-medium" },
      { ...copy.gallery.items[3], src: REFERENCE_IMAGES.about?.packaging, className: "about-gallery-card is-tall" }
    ],
    [copy]
  );

  // Обробляє дію користувача або системну подію для handle about anchor click.
  function handleAboutAnchorClick(event, href) {
    if (!href?.startsWith("#")) return;
    event.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <main className="about-main" data-locale={locale}>
        <section className="about-hero section">
          <div className="section-inner about-hero-shell">
            <div className="about-hero-media-wrap">
              <div className={`about-hero-media${heroVideoUnavailable ? " is-video-fallback" : ""}`}>
                {!heroPosterHidden ? (
                  <img
                    className={`about-hero-poster${heroVideoReady ? " is-hidden" : ""}`}
                    src={REFERENCE_IMAGES.about?.heroPoster}
                    alt=""
                    aria-hidden="true"
                    onError={() => setHeroPosterHidden(true)}
                  />
                ) : null}
                {!heroVideoUnavailable ? (
                  <video
                    className="about-hero-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={REFERENCE_IMAGES.about?.heroPoster}
                    onLoadedData={() => setHeroVideoReady(true)}
                    onPlaying={() => setHeroVideoReady(true)}
                    onError={() => {
                      setHeroVideoUnavailable(true);
                      setHeroVideoReady(false);
                    }}
                  >
                    <source src={REFERENCE_IMAGES.about?.heroVideo} type="video/mp4" />
                  </video>
                ) : null}
                <div className="about-hero-overlay" />
                <div className="about-hero-atmosphere" aria-hidden="true">
                  <span>atelier</span>
                  <span>process</span>
                  <span>materials</span>
                </div>
              </div>
            </div>
            <div className="about-hero-panel">
              <p className="eyebrow">{copy.hero.eyebrow}</p>
              <h1 className="about-hero-title">{copy.hero.title}</h1>
              <p className="about-hero-text">{copy.hero.text}</p>
              <div className="about-hero-actions">
                <a className="button" href="/catalog">{copy.hero.primaryCta}</a>
                <a className="button button-ghost" href="/constructor">{copy.hero.secondaryCta}</a>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section section">
          <div className="section-inner about-story-grid">
            <div className="about-story-copy">
              <h2 className="section-title about-story-title">{copy.whoWeAre.title}</h2>
              {copy.whoWeAre.paragraphs.map((paragraph) => <p className="about-story-text" key={paragraph}>{paragraph}</p>)}
              <aside className="about-quote-card">
                <span className="about-quote-mark">“</span>
                <p>{copy.whoWeAre.quote}</p>
              </aside>
            </div>
            <div className="about-story-media-stack">
              <AboutVisual
                src={REFERENCE_IMAGES.about?.clientConsultation || REFERENCE_IMAGES.about?.workshopOverview}
                alt={copy.whoWeAre.title}
                className="about-story-media"
                fallbackClassName="is-warm"
              />
            </div>
          </div>
        </section>

        <section className="about-section section about-create-section">
          <div className="section-inner">
            <div className="section-heading about-section-heading">
              <h2 className="section-title">{copy.create.title}</h2>
            </div>
            <div className="about-create-grid" role="list" aria-label={copy.create.title}>
              {copy.create.cards.map((card, index) => (
                <article className="about-create-card" key={card.title} role="listitem">
                  <span className="about-create-index">{`0${index + 1}`}</span>
                  <h3 className="about-create-title">{card.title}</h3>
                  <p className="about-create-text">{card.text}</p>
                  <a className="about-inline-link" href={card.href} onClick={(event) => handleAboutAnchorClick(event, card.href)}>
                    <span>{card.cta}</span>
                    <ChevronRight aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-section section about-process-section" id="about-process">
          <div className="section-inner">
            <div className="section-heading about-process-heading">
              <p className="eyebrow">{copy.process.eyebrow}</p>
              <h2 className="section-title">{copy.process.title}</h2>
            </div>
            <div className="about-process-grid" role="list" aria-label={copy.process.title}>
              {copy.process.steps.map((step) => (
                <article className="about-process-card" key={step.number} role="listitem">
                  <div className="about-process-top">
                    <span className="about-process-number">{step.number}</span>
                    <span className="about-process-line" aria-hidden="true" />
                  </div>
                  <h3 className="about-process-title">{step.title}</h3>
                  <p className="about-process-text">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-section section about-gallery-section">
          <div className="section-inner">
            <div className="section-heading about-section-heading">
              <h2 className="section-title">{copy.gallery.title}</h2>
            </div>
            <div className="about-gallery-grid" role="list" aria-label={copy.gallery.title}>
              {galleryItems.map((item) => (
                <figure className={item.className} key={item.key} role="listitem">
                  <AboutVisual src={item.src} alt={item.caption} className="about-gallery-media" fallbackClassName="is-soft" />
                  <figcaption className="about-gallery-caption">{item.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="about-section section about-principles-section">
          <div className="section-inner">
            <div className="section-heading about-section-heading">
              <h2 className="section-title">{copy.principles.title}</h2>
            </div>
            <div className="about-principles-grid" role="list" aria-label={copy.principles.title}>
              {copy.principles.items.map((item) => (
                <article className="about-principle-card" key={item.number} role="listitem">
                  <span className="about-principle-number">{item.number}</span>
                  <h3 className="about-principle-title">{item.title}</h3>
                  <p className="about-principle-text">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-section section about-final-cta">
          <div className="section-inner">
            <div className="about-final-shell">
              <div className="about-final-copy">
                <h2 className="about-final-title">{copy.cta.title}</h2>
                <p className="about-final-text">{copy.cta.text}</p>
              </div>
              <div className="about-final-actions">
                <a className="button" href="/catalog">{copy.cta.primaryCta}</a>
                <a className="button button-ghost" href="/constructor">{copy.cta.secondaryCta}</a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default function AboutRoute() {
  const [locale, setLocale] = useState(getInitialLocale);

  useEffect(() => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <>
      <AuroraBackground />
      <div className="app-shell">
        <Header locale={locale} onToggleLocale={() => setLocale((current) => (current === "uk" ? "en" : "uk"))} />
        <AboutPage locale={locale} />
        <PublicFooter locale={locale} />
      </div>
    </>
  );
}

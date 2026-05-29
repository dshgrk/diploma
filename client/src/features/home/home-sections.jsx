import React, { useEffect, useMemo, useState } from "react";
import { Award, ChevronRight, Search, Truck, User } from "lucide-react";
import { constructorApi } from "../../api";
import {
  REFERENCE_IMAGES,
  localizeProductFilterValue,
  productDisplayImage,
  productTypeLabel,
  referenceCopy
} from "../../content";
import { buildStoneCodeMap, JewelryPreview } from "../../jewelry-preview";
import { formatCurrency } from "../../utils";
import { LOCALE_FORMATS } from "../../routes/public-shell.jsx";
import { buildConstructorShowcase } from "./constructor-showcase";

const HOME_HERO_VIDEO = "/assets/videos/home-hero-main.mp4";
const HOME_HERO_POSTER = "/assets/images/aurora-jewelry-hero.png";

const HOME_HERO_COPY = {
  uk: {
    eyebrow: "АВТОРСЬКА ЮВЕЛІРНА МАЙСТЕРНЯ",
    title: "Прикраси, створені навколо вашої історії",
    subtitle:
      "Оберіть готовий виріб із колекції або створіть власну прикрасу в конструкторі — з металом, каменем і деталями, що мають значення саме для вас.",
    primaryCta: "Переглянути колекцію",
    secondaryCta: "Створити прикрасу",
    note: "Готові вироби та персональні дизайни в одному просторі."
  },
  en: {
    eyebrow: "HANDCRAFTED JEWELRY ATELIER",
    title: "Jewelry shaped around your story",
    subtitle:
      "Choose a finished piece from the collection or create your own design in the constructor — with the metal, stone, and details that feel personal to you.",
    primaryCta: "Explore the collection",
    secondaryCta: "Create your piece",
    note: "Finished jewelry and personal designs in one refined space."
  }
};

export function Hero({ locale }) {
  const hero = HOME_HERO_COPY[locale] || HOME_HERO_COPY.uk;

  return (
    <section className="aurora-hero" aria-label="Aurora Atelier hero">
      <div className="aurora-hero-media" aria-hidden="true">
        <img className="aurora-hero-poster" src={HOME_HERO_POSTER} alt="" />
        <video
          className="aurora-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={HOME_HERO_POSTER}
        >
          <source src={HOME_HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="aurora-hero-overlay" />
        <div className="aurora-hero-glow" />
      </div>

      <div className="aurora-hero-shell">
        <div className="aurora-hero-copy">
          <span className="aurora-hero-eyebrow">{hero.eyebrow}</span>
          <h1 className="aurora-hero-title">{hero.title}</h1>
          <p className="aurora-hero-statement">{hero.subtitle}</p>
          <div className="aurora-hero-actions">
            <button type="button" className="button" onClick={() => { window.location.href = "/catalog"; }}>
              {hero.primaryCta}
            </button>
            <button type="button" className="button-ghost-light aurora-hero-secondary" onClick={() => { window.location.href = "/constructor"; }}>
              {hero.secondaryCta}
            </button>
          </div>
          <p className="aurora-hero-lead">{hero.note}</p>
        </div>
      </div>
    </section>
  );
}

export function TrustMetrics({ locale }) {
  const copy = referenceCopy(locale);
  const metrics = [
    { icon: Award, title: copy.trust[0] },
    { icon: Search, title: copy.trust[1] },
    { icon: User, title: copy.trust[2] },
    { icon: Truck, title: copy.trust[3] }
  ];

  return (
    <section className="trust-strip">
      {metrics.map(({ icon: Icon, title }) => (
        <article className="trust-item" key={title}>
          <div className="trust-icon">
            <Icon aria-hidden="true" />
          </div>
          <span className="trust-label" style={{ whiteSpace: "pre-line" }}>{title}</span>
        </article>
      ))}
    </section>
  );
}

export function HomeTwoPaths({ locale }) {
  const copy = referenceCopy(locale);
  const [hiddenImages, setHiddenImages] = useState({ collection: false, constructor: false });
  const cards = [
    { key: "collection", image: REFERENCE_IMAGES.homePaths?.collection, ...copy.twoPaths.collection },
    { key: "constructor", image: REFERENCE_IMAGES.homePaths?.constructor, ...copy.twoPaths.constructor }
  ];

  function handleImageError(key) {
    setHiddenImages((current) => (current[key] ? current : { ...current, [key]: true }));
  }

  return (
    <section className="home-paths-section section" data-locale={locale}>
      <div className="section-inner">
        <div className="home-paths-intro">
          <p className="home-paths-eyebrow">{copy.twoPaths.eyebrow}</p>
          <h2 className="home-paths-title">{copy.twoPaths.title}</h2>
        </div>
        <div className="home-paths-grid" role="list">
          {cards.map((card) => (
            <a key={card.key} className={`home-path-card home-path-card-${card.key}`} href={card.href}>
              <div className="home-path-media">
                {card.image && !hiddenImages[card.key] ? <img src={card.image} alt="" loading="lazy" decoding="async" onError={() => handleImageError(card.key)} /> : null}
                <div className="home-path-overlay" />
              </div>
              <div className="home-path-body">
                <span className="home-path-label">{card.label}</span>
                <div className="home-path-copy">
                  <h3 className="home-path-card-title">{card.title}</h3>
                  <p className="home-path-text">{card.text}</p>
                </div>
                <div className="home-path-tags">
                  {card.tags.map((tag) => <span key={tag} className="home-path-tag">{tag}</span>)}
                </div>
                <span className="home-path-cta">
                  <span>{card.cta}</span>
                  <ChevronRight aria-hidden="true" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeCategories({ locale }) {
  const copy = referenceCopy(locale);
  const [hiddenImages, setHiddenImages] = useState({ rings: false, earrings: false, bracelets: false, pendants: false });
  const categories = [
    { key: "rings", image: REFERENCE_IMAGES.homeCategories?.rings, ...copy.homeCategories.rings },
    { key: "earrings", image: REFERENCE_IMAGES.homeCategories?.earrings, ...copy.homeCategories.earrings },
    { key: "bracelets", image: REFERENCE_IMAGES.homeCategories?.bracelets, ...copy.homeCategories.bracelets },
    { key: "pendants", image: REFERENCE_IMAGES.homeCategories?.pendants, ...copy.homeCategories.pendants }
  ];

  function handleImageError(key) {
    setHiddenImages((current) => (current[key] ? current : { ...current, [key]: true }));
  }

  return (
    <section className="home-categories-section section" data-locale={locale}>
      <div className="section-inner">
        <div className="home-categories-heading">
          <p className="home-categories-eyebrow">{copy.homeCategories.eyebrow}</p>
          <h2 className="home-categories-title">{copy.homeCategories.title}</h2>
          <p className="home-categories-subtitle">{copy.homeCategories.subtitle}</p>
        </div>
        <div className="home-categories-grid" role="list">
          {categories.map((category) => (
            <a key={category.key} className={`home-category-card home-category-card-${category.key}`} href={category.href}>
              <div className="home-category-media">
                {category.image && !hiddenImages[category.key] ? <img src={category.image} alt="" loading="lazy" decoding="async" onError={() => handleImageError(category.key)} /> : null}
                <div className="home-category-overlay" />
              </div>
              <div className="home-category-copy">
                <h3 className="home-category-title-card">{category.title}</h3>
                <p className="home-category-text">{category.text}</p>
                <span className="home-category-cta">
                  <span>{category.cta}</span>
                  <ChevronRight aria-hidden="true" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function normalizeFeaturedProductPrice(product) {
  const value = Number(product?.price);
  return Number.isFinite(value) ? value : null;
}

function selectFeaturedProducts(products = []) {
  return [...(products || [])]
    .sort((left, right) => {
      const leftPrice = normalizeFeaturedProductPrice(left);
      const rightPrice = normalizeFeaturedProductPrice(right);

      if (rightPrice !== null && leftPrice === null) return 1;
      if (leftPrice !== null && rightPrice === null) return -1;
      if (rightPrice !== null && leftPrice !== null && rightPrice !== leftPrice) return rightPrice - leftPrice;
      return 0;
    })
    .slice(0, 4);
}

function FeaturedProductCard({ product, locale, index }) {
  const copy = referenceCopy(locale);
  const typeLabel = productTypeLabel(product, locale);
  const metalLabel = localizeProductFilterValue(product?.filters?.metal, locale);

  return (
    <a className="featured-card" href={`/products/${product.slug}`}>
      <div className="featured-card-media">
        <img src={productDisplayImage(product, index)} alt={product.name} loading={index === 0 ? "eager" : "lazy"} decoding="async" />
        <div className="featured-card-topline">
          <span className="featured-card-badge">{copy.featuredCardBadge}</span>
          <span className="featured-card-type">{typeLabel}</span>
        </div>
        <div className="featured-card-overlay">
          <span className="featured-card-cta">
            <span>{copy.viewPiece}</span>
            <ChevronRight aria-hidden="true" />
          </span>
        </div>
      </div>
      <div className="featured-card-info">
        <div className="featured-card-name">{product.name}</div>
        <div className="featured-card-meta">
          <span>{typeLabel}</span>
          {metalLabel ? <span>{metalLabel}</span> : null}
        </div>
        <div className="featured-card-price">{formatCurrency(product.price, product.currency, LOCALE_FORMATS[locale])}</div>
      </div>
    </a>
  );
}

export function FeaturedCollections({ products, locale }) {
  const featured = useMemo(() => selectFeaturedProducts(products), [products]);
  const copy = referenceCopy(locale);

  return (
    <section className="section featured-section" id="collections">
      <div className="section-inner">
        <div className="featured-layout">
          <div className="featured-intro">
            <p className="featured-eyebrow">{copy.featuredEyebrow}</p>
            <h2 className="featured-title">{copy.featuredTitle}</h2>
            <p className="featured-subtitle">{copy.featuredSubtitle}</p>
            <div className="featured-section-footer">
              <a className="button" href="/catalog">{copy.catalogButton}</a>
            </div>
          </div>
          {featured.length ? (
            <div className="featured-grid">
              {featured.map((product, index) => (
                <FeaturedProductCard key={product.id || product.slug} product={product} locale={locale} index={index} />
              ))}
            </div>
          ) : (
            <div className="empty-state-react featured-empty-state">
              <h3>{copy.featuredTitle}</h3>
              <p>{copy.featuredEmptyText}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function Bespoke({ locale }) {
  const copy = referenceCopy(locale);
  const [config, setConfig] = useState(null);
  const showcase = useMemo(() => buildConstructorShowcase(config, locale), [config, locale]);
  const stonesByCode = useMemo(() => buildStoneCodeMap(showcase?.availableStones || []), [showcase]);

  useEffect(() => {
    let active = true;
    constructorApi
      .getConfig()
      .then((data) => {
        if (active) setConfig(data || null);
      })
      .catch(() => {
        if (active) setConfig(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const previewChips = [
    showcase?.display?.type,
    showcase?.display?.material,
    showcase?.display?.stone,
    showcase?.type?.engraving?.enabled ? copy.bespokePreviewChipEngraving : ""
  ].filter(Boolean);

  return (
    <section className="section bespoke-section" id="bespoke">
      <div className="section-inner">
        <div className="bespoke-shell">
          <div className="bespoke-top">
            <div className="bespoke-intro">
              <p className="bespoke-eyebrow">{copy.bespokeEyebrow}</p>
              <h2 className="bespoke-title" style={{ whiteSpace: "pre-line" }}>{copy.bespokeTitle}</h2>
              <p className="bespoke-sub">{copy.bespokeSubtitle}</p>
              <div className="bespoke-actions">
                <a className="button bespoke-cta" href="/constructor">
                  <span>{copy.bespokeCta}</span>
                  <ChevronRight aria-hidden="true" />
                </a>
                <p className="bespoke-note">{copy.bespokeNote}</p>
              </div>
            </div>
            <aside className="bespoke-preview-card" aria-label={copy.bespokePreviewTitle}>
              <div className="bespoke-preview-head">
                <div className="bespoke-preview-copy">
                  <p className="bespoke-preview-eyebrow">{copy.bespokePreviewEyebrow}</p>
                  <h3 className="bespoke-preview-title">{copy.bespokePreviewTitle}</h3>
                </div>
                <span className="bespoke-preview-live">{copy.bespokePreviewLive}</span>
              </div>
              <div className="bespoke-preview-stage">
                {showcase?.variant ? (
                  <div className="bespoke-preview-art">
                    <JewelryPreview
                      variant={showcase.variant}
                      slots={showcase.slots}
                      stonesByCode={stonesByCode}
                      selections={showcase.selections}
                      engraving={showcase.engraving}
                      materialCode={showcase.material?.code || ""}
                    />
                  </div>
                ) : (
                  <div className="bespoke-preview-fallback">
                    <img src={REFERENCE_IMAGES.bespoke} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                  </div>
                )}
              </div>
              <div className="bespoke-preview-meta">
                <p className="bespoke-preview-note">{copy.bespokePreviewNote}</p>
                {previewChips.length ? (
                  <div className="bespoke-preview-chips" role="list" aria-label={copy.bespokePreviewTitle}>
                    {previewChips.map((chip) => <span className="bespoke-preview-chip" key={chip} role="listitem">{chip}</span>)}
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
          <div className="bespoke-steps" role="list" aria-label={copy.bespokeTitle.replace("\n", " ")}>
            {copy.bespokeSteps.map((step) => (
              <article className="bespoke-step-card" key={step.number} role="listitem">
                <span className="bespoke-step-number">{step.number}</span>
                <h3 className="bespoke-step-title">{step.title}</h3>
                <p className="bespoke-step-text">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Editorial({ locale }) {
  const copy = referenceCopy(locale);
  const sectionRef = React.useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={`section editorial-section${isVisible ? " is-visible" : ""}`} ref={sectionRef}>
      <div className="section-inner">
        <div className="editorial-shell">
          <div className="editorial-intro">
            <p className="editorial-eyebrow">{copy.editorialEyebrow}</p>
            <h2 className="editorial-title">{copy.editorialTitle}</h2>
            <p className="editorial-subtitle">{copy.editorialSubtitle}</p>
          </div>
          <div className="editorial-divider" aria-hidden="true" />
          <div className="editorial-grid" role="list" aria-label={copy.editorialTitle}>
            {copy.editorialCards.map((card, index) => (
              <article className="editorial-card" key={card.title} role="listitem" style={{ "--editorial-delay": `${index * 140}ms` }}>
                <div className="editorial-card-topline">
                  <span className="editorial-card-number">{card.number}</span>
                  <span className="editorial-card-dot" aria-hidden="true" />
                </div>
                <div className="editorial-card-body">
                  <h3 className="editorial-card-title">{card.title}</h3>
                  <p className="editorial-card-text">{card.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CareAndFaq({ locale }) {
  const copy = referenceCopy(locale);
  const [open, setOpen] = useState(null);

  return (
    <section className="section faq-section" id="faq">
      <div className="section-inner">
        <div className="section-heading">
          <p className="eyebrow">{copy.faqEyebrow}</p>
          <h2 className="section-title">{copy.faqTitle}</h2>
        </div>
        <div className="faq-list">
          {copy.faqs.map((item, index) => (
            <div className={`faq-item${open === index ? " open" : ""}`} key={item.q}>
              <button className="faq-question" type="button" onClick={() => setOpen(open === index ? null : index)}>
                <span>{item.q}</span>
                <span className="faq-arrow">{open === index ? "−" : "+"}</span>
              </button>
              {open === index ? <div className="faq-answer">{item.a}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

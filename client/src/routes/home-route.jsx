import React, { useEffect, useState } from "react";
import { catalogApi } from "../api";
import { referenceCopy } from "../content";
import {
  Bespoke,
  CareAndFaq,
  Editorial,
  FeaturedCollections,
  Hero,
  HomeCategories,
  HomeTwoPaths,
  TrustMetrics
} from "../features/home/home-sections.jsx";
import { AuroraBackground, Footer, Header, usePublicLocale } from "./public-shell.jsx";
import "../styles.css";

export default function HomeRoute() {
  const { locale, toggleLocale } = usePublicLocale();
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const copy = referenceCopy(locale);

  useEffect(() => {
    let active = true;

    catalogApi
      .listProducts({ page: 1, limit: 8 })
      .then((result) => {
        if (!active) return;
        setProducts(Array.isArray(result) ? result : result?.items || []);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <AuroraBackground />
      <div className="app-shell">
        <Header locale={locale} onToggleLocale={toggleLocale} />
        <main className="home-main">
          <Hero locale={locale} />
          <TrustMetrics locale={locale} />
          <HomeTwoPaths locale={locale} />
          <HomeCategories locale={locale} />
          {loadError ? <p className="load-error">{loadError}</p> : null}
          <FeaturedCollections products={products} locale={locale} />
          <Bespoke locale={locale} />
          <Editorial locale={locale} />
          <CareAndFaq locale={locale} />
          <section className="final-cta-section">
            <div className="final-cta-inner">
              <h2 className="final-cta-title">{copy.finalTitle}</h2>
              <p className="final-cta-sub">{copy.finalSubtitle}</p>
              <div className="final-cta-actions">
                <a className="button" href="/catalog">
                  {copy.finalPrimary}
                </a>
                <a className="button button-ghost" href="/constructor" style={{ color: "#fff", borderColor: "#fff" }}>
                  {copy.finalSecondary}
                </a>
              </div>
            </div>
          </section>
        </main>
        <Footer locale={locale} />
      </div>
    </>
  );
}

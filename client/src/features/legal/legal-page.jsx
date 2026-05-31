import React from "react";
import { AuroraBackground, Footer, Header, usePublicLocale } from "../../routes/public-shell.jsx";
import { getLegalPage } from "./legal-content.js";
import "../../styles.css";

function LegalSection({ section }) {
  return (
    <section className="legal-article-card">
      <h2>{section.title}</h2>
      {(section.paragraphs || []).map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {section.list?.length ? (
        <ul className="legal-article-list">
          {section.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {section.contacts?.length ? (
        <div className="legal-article-contacts">
          {section.contacts.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function LegalPage({ pageKey }) {
  const { locale, toggleLocale } = usePublicLocale();
  const page = getLegalPage(pageKey, locale);

  if (!page) {
    return null;
  }

  return (
    <>
      <AuroraBackground />
      <div className="app-shell">
        <Header locale={locale} onToggleLocale={toggleLocale} />
        <main className="page-main">
          <section className="orders-react-hero legal-hero">
            <div className="container orders-react-heading legal-hero-heading">
              <span className="badge">{locale === "uk" ? "Юридична інформація" : "Legal information"}</span>
              <h1>{page.title}</h1>
              <p>{page.intro}</p>
            </div>
          </section>

          <section className="legal-page-section">
            <div className="container legal-page-grid">
              <aside className="legal-meta-card">
                <span className="badge subtle">{locale === "uk" ? "Актуальна редакція" : "Current version"}</span>
                <h2>{page.updatedAt}</h2>
                {page.outro ? <p>{page.outro}</p> : null}
              </aside>

              <div className="legal-article-stack">
                {page.sections.map((section) => (
                  <LegalSection key={section.title} section={section} />
                ))}
              </div>
            </div>
          </section>
        </main>
        <Footer locale={locale} />
      </div>
    </>
  );
}

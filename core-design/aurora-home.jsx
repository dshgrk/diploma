// Файл містить дизайн-макет aurora-home для демонстрації інтерфейсу Aurora Atelier.
// aurora-home.jsx — Home page

const HERO_SLIDES = [
{
  image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1920&q=80',
  titleKey: 'hero_slide1_title',
  subKey: 'hero_slide1_sub'
},
{
  image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1920&q=80',
  titleKey: 'hero_slide2_title',
  subKey: 'hero_slide2_sub'
},
{
  image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1920&q=80',
  titleKey: 'hero_slide3_title',
  subKey: 'hero_slide3_sub'
}];


// Компонент рендерить блок hero slider у дизайн-макеті.
function HeroSlider({ lang, setPage, accentColor }) {
  const t = window.useT(lang);
  const [current, setCurrent] = React.useState(0);
  const [animating, setAnimating] = React.useState(false);

  React.useEffect(() => {
    const id = setInterval(() => goTo((current + 1) % HERO_SLIDES.length), 5500);
    return () => clearInterval(id);
  }, [current]);

  // Допоміжна функція виконує дію go to у дизайн-макеті.
  function goTo(idx) {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {setCurrent(idx);setAnimating(false);}, 400);
  }

  const slide = HERO_SLIDES[current];

  return (
    <section className="aurora-hero">
      <div className={`hero-slide${animating ? ' fade-out' : ' fade-in'}`}>
        <div className="hero-bg" style={{ backgroundImage: `url(${slide.image})` }} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-eyebrow">{t(slide.subKey)}</p>
          <h1 className="hero-title" style={{ whiteSpace: 'pre-line' }}>{t(slide.titleKey)}</h1>
          <div className="hero-actions">
            <button className="button button-light" onClick={() => {setPage('catalog');window.scrollTo(0, 0);}}>
              {t('hero_cta1')}
            </button>
            <button className="button-ghost-light" onClick={() => {setPage('constructor');window.scrollTo(0, 0);}}>
              {t('hero_cta2')}
            </button>
          </div>
        </div>
      </div>
      <div className="hero-controls">
        {HERO_SLIDES.map((_, i) =>
        <button
          key={i}
          className={`hero-dot${i === current ? ' active' : ''}`}
          onClick={() => goTo(i)}
          aria-label={`Slide ${i + 1}`} />

        )}
      </div>
      <div className="hero-scroll-hint">
        <div className="scroll-line" />
      </div>
    </section>);

}

// Компонент рендерить блок trust strip у дизайн-макеті.
function TrustStrip({ lang }) {
  const t = window.useT(lang);
  const items = [
  { key: 'trust1', icon:
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
  },
  { key: 'trust2', icon:
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
  },
  { key: 'trust3', icon:
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
  },
  { key: 'trust4', icon:
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
  }];

  return (
    <div className="trust-strip">
      {items.map((item) =>
      <div key={item.key} className="trust-item">
          <div className="trust-icon">{item.icon}</div>
          <span className="trust-label" style={{ whiteSpace: 'pre-line' }}>{t(item.key)}</span>
        </div>
      )}
    </div>);

}

// Компонент рендерить блок featured section у дизайн-макеті.
function FeaturedSection({ lang, setPage, addToCart, accentColor }) {
  const t = window.useT(lang);
  const products = window.AURORA_PRODUCTS.slice(0, 4);

  return (
    <section className="section featured-section">
      <div className="section-inner">
        <div className="section-heading">
          <p className="eyebrow">{t('featured_eyebrow')}</p>
          <h2 className="section-title">{t('featured_title')}</h2>
          <p className="section-sub">{t('featured_sub')}</p>
        </div>
        <div className="featured-grid">
          {products.map((p) =>
          <div
            key={p.id}
            className="featured-card"
            onClick={() => {window.__selectedProduct = p;setPage('product');window.scrollTo(0, 0);}}>
            
              <div className="featured-card-img">
                <img src={p.image} alt={lang === 'uk' ? p.name_uk : p.name_en} loading="lazy" />
                <div className="featured-card-overlay">
                  <button
                  className="button-ghost-light btn-sm"
                  onClick={(e) => {e.stopPropagation();addToCart(p);}}>
                  
                    {t('add_to_cart')}
                  </button>
                </div>
              </div>
              <div className="featured-card-info">
                <div className="featured-card-name">{lang === 'uk' ? p.name_uk : p.name_en}</div>
                <div className="featured-card-meta">{lang === 'uk' ? p.material_uk : p.material_en}</div>
                <div className="featured-card-price">{p.price.toLocaleString()} ₴</div>
              </div>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <button className="button" onClick={() => {setPage('catalog');window.scrollTo(0, 0);}}>
            {t('nav_collection')} →
          </button>
        </div>
      </div>
    </section>);

}

// Компонент рендерить блок bespoke section у дизайн-макеті.
function BespokeSection({ lang, setPage }) {
  const t = window.useT(lang);
  return (
    <section className="bespoke-section">
      <div className="bespoke-bg">
        <img src="https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=1920&q=80" alt="" />
        <div className="bespoke-overlay" />
      </div>
      <div className="bespoke-content">
        <p className="eyebrow eyebrow-light">{t('bespoke_eyebrow')}</p>
        <h2 className="bespoke-title" style={{ whiteSpace: 'pre-line' }}>{t('bespoke_title')}</h2>
        <p className="bespoke-sub">{t('bespoke_sub')}</p>
        <button className="button button-light" onClick={() => {setPage('constructor');window.scrollTo(0, 0);}}>
          {t('bespoke_cta')}
        </button>
      </div>
    </section>);

}

// Компонент рендерить блок editorial section у дизайн-макеті.
function EditorialSection({ lang }) {
  const t = window.useT(lang);
  const cards = [
  {
    titleKey: 'ed1_title', textKey: 'ed1_text',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80'
  },
  {
    titleKey: 'ed2_title', textKey: 'ed2_text',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=600&q=80'
  },
  {
    titleKey: 'ed3_title', textKey: 'ed3_text',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&q=80'
  }];


  return (
    <section className="section editorial-section">
      <div className="section-inner">
        <div className="section-heading section-heading-center">
          <p className="eyebrow">{t('editorial_eyebrow')}</p>
          <h2 className="section-title">{t('editorial_title')}</h2>
        </div>
        <div className="editorial-grid">
          {cards.map((c) =>
          <div key={c.titleKey} className="editorial-card">
              <div className="editorial-card-img">
                <img src={c.image} alt={t(c.titleKey)} loading="lazy" />
              </div>
              <div className="editorial-card-body">
                <h3 className="editorial-card-title">{t(c.titleKey)}</h3>
                <p className="editorial-card-text">{t(c.textKey)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>);

}

// Компонент рендерить блок faq section у дизайн-макеті.
function FaqSection({ lang }) {
  const t = window.useT(lang);
  const [open, setOpen] = React.useState(null);
  const faqs = [
  { q: t('faq1_q'), a: t('faq1_a') },
  { q: t('faq2_q'), a: t('faq2_a') },
  { q: t('faq3_q'), a: t('faq3_a') },
  { q: t('faq4_q'), a: t('faq4_a') }];

  return (
    <section className="section faq-section">
      <div className="section-inner">
        <div className="section-heading">
          <p className="eyebrow">{t('faq_eyebrow')}</p>
          <h2 className="section-title">{t('faq_title')}</h2>
        </div>
        <div className="faq-list">
          {faqs.map((f, i) =>
          <div key={i} className={`faq-item${open === i ? ' open' : ''}`}>
              <button className="faq-question" onClick={() => setOpen(open === i ? null : i)}>
                <span>{f.q}</span>
                <span className="faq-arrow">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && <div className="faq-answer">{f.a}</div>}
            </div>
          )}
        </div>
      </div>
    </section>);

}

// Компонент рендерить блок final cta у дизайн-макеті.
function FinalCta({ lang, setPage }) {
  const t = window.useT(lang);
  return (
    <section className="final-cta-section">
      <div className="final-cta-inner">
        <h2 className="final-cta-title">{t('final_cta_title')}</h2>
        <p className="final-cta-sub">{t('final_cta_sub')}</p>
        <div className="final-cta-actions">
          <button className="button" onClick={() => {setPage('catalog');window.scrollTo(0, 0);}}>
            {t('final_cta_btn1')}
          </button>
          <button className="button button-ghost" onClick={() => {setPage('constructor');window.scrollTo(0, 0);}} style={{ color: "rgb(255, 255, 255)", borderColor: "rgb(255, 255, 255)" }}>
            {t('final_cta_btn2')}
          </button>
        </div>
      </div>
    </section>);

}

// Компонент рендерить блок home page у дизайн-макеті.
function HomePage({ lang, setPage, addToCart, accentColor }) {
  const t = window.useT(lang);
  return (
    <div className="home-main">
      <HeroSlider lang={lang} setPage={setPage} accentColor={accentColor} />
      <TrustStrip lang={lang} />
      <FeaturedSection lang={lang} setPage={setPage} addToCart={addToCart} accentColor={accentColor} />
      <BespokeSection lang={lang} setPage={setPage} />
      <EditorialSection lang={lang} />
      <FaqSection lang={lang} />
      <FinalCta lang={lang} setPage={setPage} />
    </div>);

}

window.HomePage = HomePage;
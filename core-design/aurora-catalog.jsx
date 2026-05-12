// aurora-catalog.jsx — Catalog + Product Detail pages

function CatalogPage({ lang, setPage, addToCart }) {
  const t = window.useT(lang);
  const [filter, setFilter] = React.useState('all');
  const [hoveredId, setHoveredId] = React.useState(null);

  const filters = [
    { id: 'all', labelKey: 'catalog_filter_all' },
    { id: 'ring', labelKey: 'catalog_filter_rings' },
    { id: 'necklace', labelKey: 'catalog_filter_necklaces' },
    { id: 'bracelet', labelKey: 'catalog_filter_bracelets' },
    { id: 'earrings', labelKey: 'catalog_filter_earrings' },
  ];

  const products = filter === 'all'
    ? window.AURORA_PRODUCTS
    : window.AURORA_PRODUCTS.filter(p => p.type === filter);

  return (
    <div className="page-main">
      <div className="page-header">
        <div className="section-inner">
          <p className="eyebrow">{t('catalog_eyebrow')}</p>
          <h1 className="page-title">{t('catalog_title')}</h1>
        </div>
      </div>

      <div className="catalog-trust-strip">
        <div className="section-inner">
          <div className="catalog-trust-items">
            {['Ручна відділка', 'Прозора ціна', 'Персональний підхід'].map(item => (
              <div key={item} className="catalog-trust-item">
                <span className="catalog-trust-dot" />
                <span>{lang === 'uk' ? item : { 'Ручна відділка': 'Handcrafted Finish', 'Прозора ціна': 'Transparent Pricing', 'Персональний підхід': 'Personal Approach' }[item]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-inner" style={{ paddingTop: '2rem' }}>
        <div className="filter-bar">
          {filters.map(f => (
            <button
              key={f.id}
              className={`filter-pill${filter === f.id ? ' active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {products.map(p => (
            <div
              key={p.id}
              className="product-card"
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => { window.__selectedProduct = p; setPage('product'); window.scrollTo(0,0); }}
            >
              <div className="product-card-img">
                <img src={p.image} alt={lang === 'uk' ? p.name_uk : p.name_en} loading="lazy" />
                {hoveredId === p.id && (
                  <div className="product-card-hover">
                    <button
                      className="button btn-sm"
                      onClick={e => { e.stopPropagation(); addToCart(p); }}
                    >
                      {t('add_to_cart')}
                    </button>
                  </div>
                )}
              </div>
              <div className="product-card-body">
                <div className="product-card-type">{lang === 'uk'
                  ? { ring: 'Каблучка', necklace: 'Намисто', bracelet: 'Браслет', earrings: 'Сережки' }[p.type]
                  : { ring: 'Ring', necklace: 'Necklace', bracelet: 'Bracelet', earrings: 'Earrings' }[p.type]
                }</div>
                <div className="product-card-name">{lang === 'uk' ? p.name_uk : p.name_en}</div>
                <div className="product-card-material">{lang === 'uk' ? p.material_uk : p.material_en}</div>
                <div className="product-card-price">{p.price.toLocaleString()} ₴</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductPage({ lang, setPage, addToCart }) {
  const t = window.useT(lang);
  const p = window.__selectedProduct;
  const [qty, setQty] = React.useState(1);
  const [size, setSize] = React.useState('');
  const [added, setAdded] = React.useState(false);

  if (!p) { setPage('catalog'); return null; }

  const sizes = p.type === 'ring' ? ['15', '16', '17', '18', '19', '20'] :
                p.type === 'bracelet' ? ['16 cm', '17 cm', '18 cm', '19 cm'] :
                p.type === 'necklace' ? ['40 cm', '42 cm', '45 cm'] : null;

  function handleAdd() {
    addToCart({ ...p, qty, size });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="page-main">
      <div className="section-inner" style={{ paddingTop: '2rem' }}>
        <button className="back-btn" onClick={() => setPage('catalog')}>
          {t('product_back')}
        </button>
        <div className="product-layout">
          <div className="product-gallery">
            <div className="product-main-img">
              <img src={p.image} alt={lang === 'uk' ? p.name_uk : p.name_en} />
            </div>
          </div>
          <div className="product-info">
            <p className="product-type-label">{lang === 'uk'
              ? { ring: 'Каблучка', necklace: 'Намисто', bracelet: 'Браслет', earrings: 'Сережки' }[p.type]
              : { ring: 'Ring', necklace: 'Necklace', bracelet: 'Bracelet', earrings: 'Earrings' }[p.type]
            }</p>
            <h1 className="product-name">{lang === 'uk' ? p.name_uk : p.name_en}</h1>
            <div className="product-price-row">
              <span className="product-price">{p.price.toLocaleString()} ₴</span>
            </div>

            <div className="product-attrs">
              <div className="product-attr">
                <span className="product-attr-label">{t('product_material')}</span>
                <span className="product-attr-val">{lang === 'uk' ? p.material_uk : p.material_en}</span>
              </div>
              <div className="product-attr">
                <span className="product-attr-label">{t('product_stone')}</span>
                <span className="product-attr-val">{lang === 'uk' ? p.stone_uk : p.stone_en}</span>
              </div>
            </div>

            {sizes && (
              <div className="product-sizes">
                <p className="product-attr-label" style={{ marginBottom: '0.75rem' }}>{t('product_size')}</p>
                <div className="size-grid">
                  {sizes.map(s => (
                    <button
                      key={s}
                      className={`size-btn${size === s ? ' active' : ''}`}
                      onClick={() => setSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="product-desc">
              <p className="product-attr-label" style={{ marginBottom: '0.5rem' }}>{t('product_description')}</p>
              <p className="product-desc-text">{lang === 'uk' ? p.desc_uk : p.desc_en}</p>
            </div>

            <div className="product-actions">
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span className="qty-val">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(qty + 1)}>+</button>
              </div>
              <button
                className={`button product-add-btn${added ? ' added' : ''}`}
                onClick={handleAdd}
              >
                {added ? <><window.IconCheck size={16} /> {lang === 'uk' ? 'Додано!' : 'Added!'}</> : t('add_to_cart')}
              </button>
            </div>

            <div className="product-trust">
              {[
                lang === 'uk' ? 'Ручна робота' : 'Handcrafted',
                lang === 'uk' ? 'Гарантія 12 місяців' : '12-month warranty',
                lang === 'uk' ? 'Безкоштовна доставка' : 'Free shipping',
              ].map(item => (
                <div key={item} className="product-trust-item">
                  <window.IconCheck size={14} /> <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.CatalogPage = CatalogPage;
window.ProductPage = ProductPage;

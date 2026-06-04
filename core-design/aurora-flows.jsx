// Файл містить дизайн-макет aurora-flows для демонстрації інтерфейсу Aurora Atelier.
// aurora-flows.jsx — Cart, Checkout, Auth, Orders, Admin pages

// ── CartPage ─────────────────────────────────────────────────────────────────
function CartPage({ lang, cart, setCart, setPage }) {
  const t = window.useT(lang);

  // Допоміжна функція виконує дію remove у дизайн-макеті.
  function remove(idx) { setCart(c => c.filter((_, i) => i !== idx)); }
  // Допоміжна функція виконує дію update qty у дизайн-макеті.
  function updateQty(idx, delta) {
    setCart(c => c.map((item, i) => i === idx ? { ...item, qty: Math.max(1, (item.qty || 1) + delta) } : item));
  }

  const subtotal = cart.reduce((s, item) => s + item.price * (item.qty || 1), 0);

  if (cart.length === 0) return (
    <div className="page-main">
      <div className="section-inner" style={{ paddingTop: '4rem' }}>
        <h1 className="page-title">{t('cart_title')}</h1>
        <div className="empty-state">
          <div className="empty-icon">
            <window.IconCart size={40} color="var(--ink-soft)" />
          </div>
          <p className="empty-title">{t('cart_empty')}</p>
          <p className="empty-sub">{t('cart_empty_sub')}</p>
          <button className="button" onClick={() => { setPage('catalog'); window.scrollTo(0,0); }}>
            {t('nav_collection')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-main">
      <div className="section-inner" style={{ paddingTop: '2.5rem' }}>
        <h1 className="page-title">{t('cart_title')}</h1>
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((item, idx) => (
              <div key={idx} className="cart-item">
                <div className="cart-item-img">
                  {item.image
                    ? <img src={item.image} alt={lang === 'uk' ? item.name_uk : item.name_en} />
                    : <div className="cart-item-placeholder">
                        <window.IconCart size={24} color="var(--ink-soft)" />
                      </div>
                  }
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{lang === 'uk' ? item.name_uk : item.name_en}</div>
                  {item.isCustom && (
                    <div className="cart-item-custom">
                      <span className="pill">{lang === 'uk' ? 'Bespoke' : 'Bespoke'}</span>
                      {item.size && <span className="cart-item-meta">{lang === 'uk' ? 'Розмір' : 'Size'}: {item.size}</span>}
                      {item.engraving && <span className="cart-item-meta">"{item.engraving}"</span>}
                    </div>
                  )}
                  {item.size && !item.isCustom && (
                    <div className="cart-item-meta">{lang === 'uk' ? 'Розмір' : 'Size'}: {item.size}</div>
                  )}
                  <div className="cart-item-price">{(item.price * (item.qty || 1)).toLocaleString()} ₴</div>
                </div>
                <div className="cart-item-actions">
                  {!item.isCustom && (
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => updateQty(idx, -1)}>−</button>
                      <span className="qty-val">{item.qty || 1}</span>
                      <button className="qty-btn" onClick={() => updateQty(idx, 1)}>+</button>
                    </div>
                  )}
                  <button className="remove-btn" onClick={() => remove(idx)} aria-label={t('cart_remove')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              <h3 className="summary-heading">{lang === 'uk' ? 'Підсумок' : 'Summary'}</h3>
              <div className="summary-row">
                <span>{t('cart_subtotal')}</span>
                <span>{subtotal.toLocaleString()} ₴</span>
              </div>
              <div className="summary-row">
                <span>{t('cart_shipping')}</span>
                <span className="summary-free">{t('cart_free')}</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-row summary-total">
                <span>{t('cart_total')}</span>
                <span>{subtotal.toLocaleString()} ₴</span>
              </div>
              <button className="button" style={{ width: '100%', marginTop: '1.25rem' }}
                onClick={() => { setPage('checkout'); window.scrollTo(0,0); }}>
                {t('cart_checkout')}
              </button>
              <button className="button button-ghost" style={{ width: '100%', marginTop: '0.75rem' }}
                onClick={() => { setPage('catalog'); window.scrollTo(0,0); }}>
                {t('cart_continue')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CheckoutPage ──────────────────────────────────────────────────────────────
function CheckoutPage({ lang, cart, setCart, setPage, setIsLoggedIn }) {
  const t = window.useT(lang);
  const [form, setForm] = React.useState({ name: '', email: '', phone: '', address: '', city: '', zip: '' });
  const [agreed, setAgreed] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const total = cart.reduce((s, item) => s + item.price * (item.qty || 1), 0);

  // Допоміжна функція виконує дію validate у дизайн-макеті.
  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = lang === 'uk' ? "Вкажіть ім'я" : 'Enter name';
    if (!form.email.includes('@')) e.email = lang === 'uk' ? 'Невірний email' : 'Invalid email';
    if (!form.phone.trim()) e.phone = lang === 'uk' ? 'Вкажіть телефон' : 'Enter phone';
    if (!form.address.trim()) e.address = lang === 'uk' ? 'Вкажіть адресу' : 'Enter address';
    if (!form.city.trim()) e.city = lang === 'uk' ? 'Вкажіть місто' : 'Enter city';
    if (!agreed) e.agreed = lang === 'uk' ? 'Потрібна згода' : 'Agreement required';
    return e;
  }

  // Допоміжна функція виконує дію handle submit у дизайн-макеті.
  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setSuccess(true); setCart([]); }, 1500);
  }

  if (success) return (
    <div className="page-main">
      <div className="section-inner" style={{ paddingTop: '6rem', textAlign: 'center' }}>
        <div className="success-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="var(--sage)" strokeWidth="2"/>
            <polyline points="20,33 28,41 44,24" stroke="var(--sage)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="page-title" style={{ marginTop: '1.5rem' }}>{t('checkout_success_title')}</h1>
        <p className="section-sub">{t('checkout_success_sub')}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <button className="button" onClick={() => { setPage('orders'); window.scrollTo(0,0); }}>{t('checkout_to_orders')}</button>
          <button className="button button-ghost" onClick={() => { setPage('home'); window.scrollTo(0,0); }}>{lang === 'uk' ? 'На головну' : 'Home'}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-main">
      <div className="section-inner" style={{ paddingTop: '2.5rem' }}>
        <h1 className="page-title">{t('checkout_title')}</h1>
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit} noValidate>
            <div className="form-section">
              <h3 className="form-section-title">{t('checkout_contact')}</h3>
              <div className="form-grid">
                <div className={`field${errors.name ? ' has-error' : ''}`}>
                  <label className="field-label">{t('checkout_name')}</label>
                  <input className="field-input" type="text" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </div>
                <div className={`field${errors.email ? ' has-error' : ''}`}>
                  <label className="field-label">{t('checkout_email')}</label>
                  <input className="field-input" type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
                <div className={`field${errors.phone ? ' has-error' : ''}`} style={{ gridColumn: '1 / -1' }}>
                  <label className="field-label">{t('checkout_phone')}</label>
                  <input className="field-input" type="tel" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">{t('checkout_delivery')}</h3>
              <div className="form-grid">
                <div className={`field${errors.address ? ' has-error' : ''}`} style={{ gridColumn: '1 / -1' }}>
                  <label className="field-label">{t('checkout_address')}</label>
                  <input className="field-input" type="text" value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  {errors.address && <span className="field-error">{errors.address}</span>}
                </div>
                <div className={`field${errors.city ? ' has-error' : ''}`}>
                  <label className="field-label">{t('checkout_city')}</label>
                  <input className="field-input" type="text" value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                  {errors.city && <span className="field-error">{errors.city}</span>}
                </div>
                <div className="field">
                  <label className="field-label">{t('checkout_zip')}</label>
                  <input className="field-input" type="text" value={form.zip}
                    onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className={`checkbox-row${errors.agreed ? ' has-error' : ''}`}>
              <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <label htmlFor="agree">{t('checkout_agree')}</label>
              {errors.agreed && <span className="field-error" style={{ display: 'block', marginTop: '0.25rem' }}>{errors.agreed}</span>}
            </div>

            <button className="button" type="submit" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loading}>
              {loading ? (lang === 'uk' ? 'Обробка...' : 'Processing...') : t('checkout_submit')}
            </button>
          </form>

          <div className="checkout-summary">
            <div className="summary-card">
              <h3 className="summary-heading">{lang === 'uk' ? 'Ваше замовлення' : 'Your Order'}</h3>
              {cart.map((item, i) => (
                <div key={i} className="checkout-item-row">
                  <span className="checkout-item-name">{lang === 'uk' ? item.name_uk : item.name_en} {(item.qty || 1) > 1 && `×${item.qty}`}</span>
                  <span>{(item.price * (item.qty || 1)).toLocaleString()} ₴</span>
                </div>
              ))}
              <div className="summary-divider" />
              <div className="summary-row summary-total">
                <span>{t('cart_total')}</span>
                <span>{total.toLocaleString()} ₴</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AuthPage ──────────────────────────────────────────────────────────────────
function AuthPage({ lang, setPage, setIsLoggedIn }) {
  const t = window.useT(lang);
  const [mode, setMode] = React.useState('login');
  const [form, setForm] = React.useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  // Допоміжна функція виконує дію handle submit у дизайн-макеті.
  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.email.includes('@')) errs.email = lang === 'uk' ? 'Невірний email' : 'Invalid email';
    if (form.password.length < 6) errs.password = lang === 'uk' ? 'Мінімум 6 символів' : 'Min 6 characters';
    if (mode === 'register' && !form.name.trim()) errs.name = lang === 'uk' ? "Вкажіть ім'я" : 'Enter name';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setIsLoggedIn(true); setPage('orders'); window.scrollTo(0,0); }, 1200);
  }

  const benefits = [t('auth_aside_b1'), t('auth_aside_b2'), t('auth_aside_b3'), t('auth_aside_b4')];

  return (
    <div className="page-main auth-bg">
      <div className="auth-experience">
        <div className="auth-card">
          <div className="auth-brand">Aurora Atelier</div>
          <div className="auth-tabs">
            <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => setMode('login')}>{t('auth_login')}</button>
            <button className={`auth-tab${mode === 'register' ? ' active' : ''}`} onClick={() => setMode('register')}>{t('auth_register')}</button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <div className={`field${errors.name ? ' has-error' : ''}`}>
                <label className="field-label">{t('auth_name')}</label>
                <input className="field-input" type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
            )}
            <div className={`field${errors.email ? ' has-error' : ''}`}>
              <label className="field-label">{t('auth_email')}</label>
              <input className="field-input" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className={`field${errors.password ? ' has-error' : ''}`}>
              <label className="field-label">{t('auth_password')}</label>
              <input className="field-input" type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>
            <button className="button" type="submit" style={{ width: '100%', marginTop: '1.25rem' }} disabled={loading}>
              {loading ? '...' : (mode === 'login' ? t('auth_submit_login') : t('auth_submit_register'))}
            </button>
          </form>
        </div>

        <div className="auth-aside">
          <div className="auth-aside-bg">
            <img src="https://images.unsplash.com/photo-1573408301185-9519f94815b1?auto=format&fit=crop&w=800&q=80" alt="" />
            <div className="auth-aside-overlay" />
          </div>
          <div className="auth-aside-content">
            <h2 className="auth-aside-title">{t('auth_aside_title')}</h2>
            <ul className="auth-benefits">
              {benefits.map(b => (
                <li key={b} className="auth-benefit-item">
                  <window.IconCheck size={16} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── OrdersPage ────────────────────────────────────────────────────────────────
function OrdersPage({ lang, setPage }) {
  const t = window.useT(lang);
  const orders = window.AURORA_ORDERS;

  const statusColors = {
    pending: { bg: 'var(--clay)', label: t('status_pending') },
    confirmed: { bg: 'var(--success)', label: t('status_confirmed') },
    progress: { bg: 'var(--warning)', label: t('status_progress') },
    completed: { bg: 'var(--ink-muted)', label: t('status_completed') },
    overdue: { bg: 'var(--danger)', label: t('status_overdue') },
  };

  return (
    <div className="page-main">
      <div className="section-inner" style={{ paddingTop: '2.5rem' }}>
        <h1 className="page-title">{t('orders_title')}</h1>
        <div className="orders-list">
          {orders.map(o => {
            const sc = statusColors[o.status] || statusColors.pending;
            return (
              <div key={o.id} className="order-card">
                <div className="order-card-top">
                  <div>
                    <div className="order-id">{t('orders_num')}{o.id}</div>
                    <div className="order-date">{o.date}</div>
                  </div>
                  <span className="status-badge" style={{ '--status-color': sc.bg }}>
                    {sc.label}
                  </span>
                </div>
                <div className="order-items">
                  {o.items.map(item => <div key={item} className="order-item-name">{item}</div>)}
                </div>
                <div className="order-card-bottom">
                  <span className="order-total">{o.total.toLocaleString()} ₴</span>
                  <button className="button-ghost btn-sm">{t('orders_detail')}</button>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: '2rem' }}>
          <button className="button button-ghost" onClick={() => { setPage('catalog'); window.scrollTo(0,0); }}>
            {lang === 'uk' ? '← До колекції' : '← To Collection'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AdminPage ─────────────────────────────────────────────────────────────────
function AdminPage({ lang, setPage }) {
  const t = window.useT(lang);
  const [activeTab, setActiveTab] = React.useState('orders');
  const orders = window.AURORA_ORDERS;
  const products = window.AURORA_PRODUCTS;

  const metrics = [
    { label: t('admin_metrics_orders'), value: 38 },
    { label: t('admin_metrics_revenue'), value: '182 400 ₴' },
    { label: t('admin_metrics_avg'), value: '4 800 ₴' },
  ];

  const statusMap = { pending: t('status_pending'), confirmed: t('status_confirmed'), progress: t('status_progress'), completed: t('status_completed') };

  return (
    <div className="page-main admin-main">
      <div className="admin-header">
        <div className="admin-inner">
          <h1 className="admin-title">{t('admin_title')}</h1>
          <button className="button button-ghost btn-sm" onClick={() => { setPage('home'); window.scrollTo(0,0); }}>
            {lang === 'uk' ? '← Сайт' : '← Site'}
          </button>
        </div>
      </div>

      <div className="admin-inner" style={{ paddingTop: '1.5rem' }}>
        <div className="admin-metric-grid">
          {metrics.map(m => (
            <div key={m.label} className="admin-metric-card">
              <div className="admin-metric-val">{m.value}</div>
              <div className="admin-metric-label">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="admin-tabs">
          <button className={`admin-tab${activeTab === 'orders' ? ' active' : ''}`} onClick={() => setActiveTab('orders')}>
            {t('admin_orders')}
          </button>
          <button className={`admin-tab${activeTab === 'products' ? ' active' : ''}`} onClick={() => setActiveTab('products')}>
            {t('admin_products')}
          </button>
        </div>

        {activeTab === 'orders' && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('orders_num')}</th>
                  <th>{t('orders_date')}</th>
                  <th>{lang === 'uk' ? 'Позиції' : 'Items'}</th>
                  <th>{t('orders_status')}</th>
                  <th>{t('orders_total')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="admin-order-id">{o.id}</td>
                    <td>{o.date}</td>
                    <td>{o.items.join(', ')}</td>
                    <td><span className="status-badge" style={{ '--status-color': { completed: 'var(--ink-muted)', progress: 'var(--warning)', confirmed: 'var(--success)' }[o.status] }}>{statusMap[o.status]}</span></td>
                    <td><strong>{o.total.toLocaleString()} ₴</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="admin-products-grid">
            {products.map(p => (
              <div key={p.id} className="admin-product-card">
                <img src={p.image} alt={p.name_uk} />
                <div className="admin-product-info">
                  <div className="admin-product-name">{lang === 'uk' ? p.name_uk : p.name_en}</div>
                  <div className="admin-product-meta">{lang === 'uk' ? p.material_uk : p.material_en}</div>
                  <div className="admin-product-price">{p.price.toLocaleString()} ₴</div>
                </div>
                <span className="pill pill-success">{lang === 'uk' ? 'Активний' : 'Active'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

window.CartPage = CartPage;
window.CheckoutPage = CheckoutPage;
window.AuthPage = AuthPage;
window.OrdersPage = OrdersPage;
window.AdminPage = AdminPage;

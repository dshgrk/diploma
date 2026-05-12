// aurora-constructor.jsx — Full jewelry crafting constructor with stone slots

const JEWELRY_TYPES = [
  { id: 'ring',     uk: 'Каблучка',  en: 'Ring' },
  { id: 'necklace', uk: 'Намисто',   en: 'Necklace' },
  { id: 'bracelet', uk: 'Браслет',   en: 'Bracelet' },
  { id: 'earrings', uk: 'Сережки',   en: 'Earrings' },
];

const MATERIALS = [
  { id: 'yellow_gold_14', uk: 'Жовте золото 14к',  en: 'Yellow Gold 14k',  color: '#c9963f', mult: 1.0,  base: 3500 },
  { id: 'white_gold_14',  uk: 'Біле золото 14к',   en: 'White Gold 14k',   color: '#d4d4d4', mult: 1.05, base: 3500 },
  { id: 'rose_gold_14',   uk: 'Рожеве золото 14к', en: 'Rose Gold 14k',    color: '#d4956a', mult: 1.0,  base: 3500 },
  { id: 'yellow_gold_18', uk: 'Жовте золото 18к',  en: 'Yellow Gold 18k',  color: '#c9963f', mult: 1.4,  base: 3500 },
  { id: 'silver_925',     uk: 'Срібло 925',         en: 'Silver 925',       color: '#b0b8c1', mult: 0.35, base: 3500 },
];

const STONES = [
  { id: 'diamond',  uk: 'Діамант',  en: 'Diamond',  color: '#cce8ff', border: '#99ccee', price: 2800 },
  { id: 'ruby',     uk: 'Рубін',    en: 'Ruby',     color: '#c0392b', border: '#922b21', price: 1600 },
  { id: 'sapphire', uk: 'Сапфір',   en: 'Sapphire', color: '#2471a3', border: '#1a5276', price: 1900 },
  { id: 'emerald',  uk: 'Смарагд',  en: 'Emerald',  color: '#1e8449', border: '#145a32', price: 2200 },
  { id: 'pearl',    uk: 'Перлина',  en: 'Pearl',    color: '#f5f0e8', border: '#d4c9b0', price: 800  },
  { id: 'amethyst', uk: 'Аметист',  en: 'Amethyst', color: '#7d3c98', border: '#5b2c6f', price: 1200 },
  { id: 'topaz',    uk: 'Топаз',    en: 'Topaz',    color: '#f0a500', border: '#d68910', price: 1000 },
  { id: 'opal',     uk: 'Опал',     en: 'Opal',     color: '#e8d5f0', border: '#c39bd3', price: 1500 },
];

// Stone slots config per jewelry type
const SLOT_CONFIGS = {
  ring: [
    { id: 'center', uk: 'Центр',     en: 'Center',  size: 'lg' },
    { id: 'left',   uk: 'Ліворуч',   en: 'Left',    size: 'sm' },
    { id: 'right',  uk: 'Праворуч',  en: 'Right',   size: 'sm' },
  ],
  necklace: [
    { id: 'pendant', uk: 'Кулон',    en: 'Pendant', size: 'lg' },
  ],
  bracelet: [
    { id: 's1', uk: 'Камінь 1', en: 'Stone 1', size: 'sm' },
    { id: 's2', uk: 'Камінь 2', en: 'Stone 2', size: 'sm' },
    { id: 's3', uk: 'Камінь 3', en: 'Stone 3', size: 'sm' },
    { id: 's4', uk: 'Камінь 4', en: 'Stone 4', size: 'sm' },
    { id: 's5', uk: 'Камінь 5', en: 'Stone 5', size: 'sm' },
    { id: 's6', uk: 'Камінь 6', en: 'Stone 6', size: 'sm' },
    { id: 's7', uk: 'Камінь 7', en: 'Stone 7', size: 'sm' },
  ],
  earrings: [
    { id: 'left',  uk: 'Ліва',   en: 'Left',  size: 'lg' },
    { id: 'right', uk: 'Права',  en: 'Right', size: 'lg' },
  ],
};

// Sizes with price delta and default (medium) index
const SIZES = {
  ring:     [
    { val: '15', price: -200 },
    { val: '16', price: -100 },
    { val: '17', price:    0, default: true },
    { val: '18', price: +150 },
    { val: '19', price: +300 },
    { val: '20', price: +450 },
  ],
  necklace: [
    { val: '40 cm', price:    0 },
    { val: '42 cm', price: +150, default: true },
    { val: '45 cm', price: +300 },
    { val: '50 cm', price: +500 },
  ],
  bracelet: [
    { val: '16 cm', price:    0 },
    { val: '17 cm', price: +100, default: true },
    { val: '18 cm', price: +200 },
    { val: '19 cm', price: +350 },
  ],
  earrings: [
    { val: lang => lang === 'uk' ? 'Стандарт' : 'Standard', price: 0, default: true },
  ],
};

function getDefaultSize(type) {
  const s = SIZES[type]?.find(s => s.default) || SIZES[type]?.[0];
  return s ? (typeof s.val === 'function' ? s.val('uk') : s.val) : '';
}
function getSizePrice(type, sizeVal) {
  const s = SIZES[type]?.find(s => (typeof s.val === 'function' ? s.val('uk') : s.val) === sizeVal ||
    (typeof s.val === 'function' ? s.val('en') : s.val) === sizeVal);
  return s ? s.price : 0;
}

function calcPrice(type, materialId, stonesMap, sizeVal) {
  const mat = MATERIALS.find(m => m.id === materialId) || MATERIALS[0];
  const typeBase = { ring: 3500, necklace: 4200, bracelet: 2800, earrings: 3000 }[type] || 3500;
  const stoneTotal = Object.values(stonesMap).reduce((sum, sid) => {
    const s = STONES.find(s => s.id === sid);
    return sum + (s ? s.price : 0);
  }, 0);
  const sizeAdj = getSizePrice(type, sizeVal);
  return Math.round(typeBase * mat.mult + stoneTotal + sizeAdj);
}

// ── Stone Slot UI ─────────────────────────────────────────────────────────────
function StoneSlots({ type, stonesMap, setStones, lang }) {
  const [activeSlot, setActiveSlot] = React.useState(null);
  const slots = SLOT_CONFIGS[type] || [];

  function pickStone(slotId, stoneId) {
    setStones(prev => ({ ...prev, [slotId]: stoneId }));
    setActiveSlot(null);
  }
  function removeStone(slotId, e) {
    e.stopPropagation();
    setStones(prev => { const n = { ...prev }; delete n[slotId]; return n; });
    if (activeSlot === slotId) setActiveSlot(null);
  }
  function toggleSlot(slotId) {
    setActiveSlot(a => a === slotId ? null : slotId);
  }

  // Reset activeSlot when type changes
  React.useEffect(() => { setActiveSlot(null); }, [type]);

  return (
    <div className="stone-slots-wrap">
      <div className="slots-row">
        {slots.map(slot => {
          const stoneId = stonesMap[slot.id];
          const stone = stoneId ? STONES.find(s => s.id === stoneId) : null;
          const isActive = activeSlot === slot.id;
          const isLg = slot.size === 'lg';
          return (
            <div key={slot.id} className="slot-container">
              <button
                className={`stone-slot${isLg ? ' slot-lg' : ' slot-sm'}${stone ? ' slot-filled' : ' slot-empty'}${isActive ? ' slot-active' : ''}`}
                onClick={() => toggleSlot(slot.id)}
                title={lang === 'uk' ? slot.uk : slot.en}
              >
                {stone ? (
                  <>
                    <span
                      className="slot-stone-gem"
                      style={{ background: `radial-gradient(circle at 35% 30%, white 0%, ${stone.color} 40%, ${stone.border} 100%)` }}
                    />
                    <button
                      className="slot-remove"
                      onClick={e => removeStone(slot.id, e)}
                      aria-label="Remove stone"
                    >×</button>
                  </>
                ) : (
                  <span className="slot-add-icon">+</span>
                )}
              </button>
              <span className="slot-label">{lang === 'uk' ? slot.uk : slot.en}</span>
              {stone && (
                <span className="slot-stone-name">{lang === 'uk' ? stone.uk : stone.en}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Stone picker dropdown */}
      {activeSlot && (
        <div className="stone-picker-panel">
          <p className="stone-picker-title">
            {lang === 'uk' ? 'Оберіть камінь для' : 'Choose stone for'}{' '}
            <strong>{lang === 'uk' ? slots.find(s=>s.id===activeSlot)?.uk : slots.find(s=>s.id===activeSlot)?.en}</strong>
          </p>
          <div className="stone-picker-grid">
            {STONES.map(s => {
              const isCurrent = stonesMap[activeSlot] === s.id;
              return (
                <button
                  key={s.id}
                  className={`stone-pick-btn${isCurrent ? ' current' : ''}`}
                  onClick={() => pickStone(activeSlot, s.id)}
                >
                  <span
                    className="stone-pick-gem"
                    style={{ background: `radial-gradient(circle at 35% 30%, white 0%, ${s.color} 45%, ${s.border} 100%)` }}
                  />
                  <span className="stone-pick-name">{lang === 'uk' ? s.uk : s.en}</span>
                  <span className="stone-pick-price">+{s.price.toLocaleString()} ₴</span>
                  {isCurrent && <span className="stone-pick-check"><window.IconCheck size={12} /></span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SVG Preview ───────────────────────────────────────────────────────────────
function JewelryPreview({ type, material, stonesMap, engraving }) {
  const mat = MATERIALS.find(m => m.id === material) || MATERIALS[0];
  const mc = mat.color;

  function GemDot({ slotId, cx, cy, r }) {
    const stoneId = stonesMap[slotId];
    const stone = stoneId ? STONES.find(s => s.id === stoneId) : null;
    if (!stone) return (
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={mc} strokeWidth="1.5" strokeDasharray="3,2" opacity="0.4"/>
    );
    return (
      <>
        <circle cx={cx} cy={cy} r={r + 2} fill={mc} opacity="0.7"/>
        <circle cx={cx} cy={cy} r={r}
          fill={`url(#gem-${slotId})`} stroke={stone.border} strokeWidth="1"/>
        <circle cx={cx - r*0.3} cy={cy - r*0.35} r={r * 0.28} fill="white" opacity="0.65"/>
        <defs>
          <radialGradient id={`gem-${slotId}`} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="0.8"/>
            <stop offset="40%" stopColor={stone.color} stopOpacity="1"/>
            <stop offset="100%" stopColor={stone.border} stopOpacity="1"/>
          </radialGradient>
        </defs>
      </>
    );
  }

  if (type === 'ring') return (
    <svg viewBox="0 0 200 200" width="180" height="180">
      <defs>
        <radialGradient id="rg" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor={mc} stopOpacity="1"/><stop offset="100%" stopColor={mc} stopOpacity="0.4"/>
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="130" rx="55" ry="22" fill="none" stroke={mc} strokeWidth="14" opacity="0.85"/>
      <path d="M 45 130 Q 45 68 100 68 Q 155 68 155 130" fill="none" stroke={mc} strokeWidth="14" strokeLinecap="round"/>
      <ellipse cx="100" cy="65" rx="26" ry="24" fill={mc} opacity="0.75"/>
      <GemDot slotId="center" cx={100} cy={63} r={12} />
      <GemDot slotId="left"   cx={78}  cy={73} r={7}  />
      <GemDot slotId="right"  cx={122} cy={73} r={7}  />
      {engraving && <text x="100" y="158" textAnchor="middle" fontSize="8" fill={mc} opacity="0.65" fontFamily="serif" fontStyle="italic">{engraving.slice(0,14)}</text>}
    </svg>
  );

  if (type === 'necklace') return (
    <svg viewBox="0 0 200 200" width="180" height="180">
      <path d="M 30 55 Q 100 28 170 55 Q 165 80 150 100 Q 128 132 100 145 Q 72 132 50 100 Q 35 80 30 55"
        fill="none" stroke={mc} strokeWidth="2.5" strokeDasharray="7,4" opacity="0.75"/>
      <circle cx="30" cy="55" r="4" fill={mc} opacity="0.7"/>
      <circle cx="170" cy="55" r="4" fill={mc} opacity="0.7"/>
      <ellipse cx="100" cy="148" rx="20" ry="24" fill={mc} opacity="0.75"/>
      <GemDot slotId="pendant" cx={100} cy={146} r={13} />
    </svg>
  );

  if (type === 'bracelet') return (
    <svg viewBox="0 0 200 200" width="180" height="180">
      <ellipse cx="100" cy="110" rx="70" ry="36" fill="none" stroke={mc} strokeWidth="13" opacity="0.8"/>
      <ellipse cx="100" cy="107" rx="70" ry="36" fill="none" stroke="white" strokeWidth="2.5" opacity="0.2"/>
      {SLOT_CONFIGS.bracelet.map((slot, i) => {
        const total = SLOT_CONFIGS.bracelet.length;
        const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
        const cx = 100 + 70 * Math.cos(angle);
        const cy = 110 + 36 * Math.sin(angle);
        return <GemDot key={slot.id} slotId={slot.id} cx={cx} cy={cy} r={6} />;
      })}
    </svg>
  );

  if (type === 'earrings') return (
    <svg viewBox="0 0 200 200" width="180" height="180">
      {/* Left earring */}
      <circle cx="60" cy="48" r="9" fill="none" stroke={mc} strokeWidth="2.5"/>
      <line x1="60" y1="57" x2="60" y2="80" stroke={mc} strokeWidth="2.5"/>
      <ellipse cx="60" cy="100" rx="18" ry="24" fill={mc} opacity="0.75"/>
      <GemDot slotId="left" cx={60} cy={98} r={12} />
      {/* Right earring */}
      <circle cx="140" cy="48" r="9" fill="none" stroke={mc} strokeWidth="2.5"/>
      <line x1="140" y1="57" x2="140" y2="80" stroke={mc} strokeWidth="2.5"/>
      <ellipse cx="140" cy="100" rx="18" ry="24" fill={mc} opacity="0.75"/>
      <GemDot slotId="right" cx={140} cy={98} r={12} />
    </svg>
  );

  return null;
}

// ── ConstructorPage ───────────────────────────────────────────────────────────
function ConstructorPage({ lang, addToCart, setPage }) {
  const t = window.useT(lang);
  const [type, setType] = React.useState('ring');
  const [material, setMaterial] = React.useState('yellow_gold_14');
  const [stonesMap, setStonesMap] = React.useState({});
  const [size, setSize] = React.useState('');
  const [engraving, setEngraving] = React.useState('');
  const [added, setAdded] = React.useState(false);

  React.useEffect(() => { setStonesMap({}); setSize(getDefaultSize(type)); }, [type]);

  const price = calcPrice(type, material, stonesMap, size);
  const sizeOk = !!size;
  const mat = MATERIALS.find(m => m.id === material);
  const sizeOpts = SIZES[type] || [];
  const filledSlots = Object.entries(stonesMap).filter(([,v]) => v);

  function handleAdd() {
    const item = {
      id: `custom-${Date.now()}`,
      isCustom: true,
      name_uk: `Bespoke ${JEWELRY_TYPES.find(j=>j.id===type)?.uk}`,
      name_en: `Bespoke ${JEWELRY_TYPES.find(j=>j.id===type)?.en}`,
      price, type, material, stonesMap, size, engraving, image: null,
    };
    addToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  return (
    <div className="page-main">
      <div className="page-header">
        <div className="section-inner">
          <p className="eyebrow">Bespoke</p>
          <h1 className="page-title">{t('constructor_title')}</h1>
        </div>
      </div>

      <div className="section-inner constructor-wrap">
        <div className="constructor-layout">

          {/* ── Options Panel ── */}
          <div className="constructor-options">

            {/* Type */}
            <div className="constructor-section">
              <p className="constructor-label">{t('constructor_type')}</p>
              <div className="type-grid">
                {JEWELRY_TYPES.map(jt => (
                  <button key={jt.id} className={`type-btn${type === jt.id ? ' active' : ''}`} onClick={() => setType(jt.id)}>
                    <TypeIcon type={jt.id} active={type === jt.id} />
                    <span>{lang === 'uk' ? jt.uk : jt.en}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Material */}
            <div className="constructor-section">
              <p className="constructor-label">{t('constructor_material')}</p>
              <div className="material-list">
                {MATERIALS.map(m => (
                  <button key={m.id} className={`material-btn${material === m.id ? ' active' : ''}`} onClick={() => setMaterial(m.id)}>
                    <span className="material-swatch" style={{ background: m.color }}/>
                    <span className="material-name">{lang === 'uk' ? m.uk : m.en}</span>
                    {material === m.id && <window.IconCheck size={14}/>}
                  </button>
                ))}
              </div>
            </div>

            {/* Stone Slots */}
            <div className="constructor-section">
              <div className="stone-slots-header">
                <p className="constructor-label">{t('constructor_stone')}</p>
                <span className="stone-count-badge">
                  {filledSlots.length}/{SLOT_CONFIGS[type]?.length || 0} {lang === 'uk' ? 'слотів' : 'slots'}
                </span>
              </div>
              <StoneSlots type={type} stonesMap={stonesMap} setStones={setStonesMap} lang={lang}/>
            </div>

            {/* Size — mandatory */}
            {sizeOpts.length > 0 && (
              <div className="constructor-section">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
                  <p className="constructor-label" style={{ margin:0 }}>{t('constructor_size')}</p>
                  <span className="required-badge">{lang === 'uk' ? '* обов\'язково' : '* required'}</span>
                </div>
                <div className="size-grid">
                  {sizeOpts.map(s => {
                    const val = typeof s.val === 'function' ? s.val(lang) : s.val;
                    const isDefault = s.default;
                    return (
                      <button
                        key={val}
                        className={`size-btn${size === val ? ' active' : ''}${isDefault && size === val ? ' size-default' : ''}`}
                        onClick={() => setSize(val)}
                      >
                        <span className="size-val">{val}</span>
                        {s.price !== 0 && (
                          <span className={`size-price-delta${s.price > 0 ? ' pos' : ' neg'}`}>
                            {s.price > 0 ? `+${s.price.toLocaleString()}` : s.price.toLocaleString()}
                          </span>
                        )}
                        {isDefault && <span className="size-default-dot" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Engraving */}
            <div className="constructor-section">
              <p className="constructor-label">{t('constructor_engraving')}</p>
              <div className="field">
                <input type="text" className="field-input" placeholder={t('constructor_engraving_placeholder')}
                  maxLength={30} value={engraving} onChange={e => setEngraving(e.target.value)}/>
                <span className="field-counter">{engraving.length}/30</span>
              </div>
            </div>
          </div>

          {/* ── Preview + Summary ── */}
          <div className="constructor-preview-wrap">
            <div className="constructor-preview-sticky">
              <div className="preview-stage">
                <p className="constructor-label" style={{ marginBottom:'1.5rem', textAlign:'center' }}>{t('constructor_preview')}</p>
                <div className="preview-canvas">
                  <JewelryPreview type={type} material={material} stonesMap={stonesMap} engraving={engraving}/>
                </div>
                <div className="preview-material-tag">
                  <span className="material-swatch-sm" style={{ background: mat?.color }}/>
                  {lang === 'uk' ? mat?.uk : mat?.en}
                </div>
                {filledSlots.length > 0 && (
                  <div className="preview-stones-list">
                    {filledSlots.map(([slotId, stoneId]) => {
                      const stone = STONES.find(s => s.id === stoneId);
                      const slot = SLOT_CONFIGS[type]?.find(s => s.id === slotId);
                      return (
                        <span key={slotId} className="preview-stone-tag" style={{ borderColor: stone?.border, background: `${stone?.color}22` }}>
                          <span className="preview-stone-dot" style={{ background: stone?.color }}/>
                          {lang === 'uk' ? slot?.uk : slot?.en}: {lang === 'uk' ? stone?.uk : stone?.en}
                        </span>
                      );
                    })}
                  </div>
                )}
                {engraving && <div className="preview-engraving">"{engraving}"</div>}
              </div>

              <div className="summary-card">
                <div className="summary-row">
                  <span className="summary-label">{t('constructor_price')}</span>
                  <span className="summary-price">{price.toLocaleString()} ₴</span>
                </div>
                {/* Breakdown */}
                <div className="summary-breakdown">
                  <span>{lang === 'uk' ? 'Основа + матеріал' : 'Base + material'}</span>
                  <span>{Math.round({ ring:3500,necklace:4200,bracelet:2800,earrings:3000 }[type] * (mat?.mult||1)).toLocaleString()} ₴</span>
                </div>
                {size && getSizePrice(type, size) !== 0 && (
                  <div className="summary-breakdown">
                    <span>{lang === 'uk' ? 'Розмір' : 'Size'}: {size}</span>
                    <span>{getSizePrice(type, size) > 0 ? '+' : ''}{getSizePrice(type, size).toLocaleString()} ₴</span>
                  </div>
                )}
                {filledSlots.map(([slotId, stoneId]) => {
                  const stone = STONES.find(s => s.id === stoneId);
                  const slot = SLOT_CONFIGS[type]?.find(s => s.id === slotId);
                  return (
                    <div key={slotId} className="summary-breakdown summary-stone-row">
                      <span style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background: stone?.color, display:'inline-block', flexShrink:0 }}/>
                        {lang === 'uk' ? slot?.uk : slot?.en} — {lang === 'uk' ? stone?.uk : stone?.en}
                      </span>
                      <span>+{stone?.price.toLocaleString()} ₴</span>
                    </div>
                  );
                })}
                <div className="summary-divider"/>
                <button
                  className={`button constructor-add-btn${added ? ' added' : ''}${!sizeOk ? ' disabled-btn' : ''}`}
                  onClick={sizeOk ? handleAdd : undefined}
                  disabled={!sizeOk}
                  title={!sizeOk ? (lang === 'uk' ? 'Оберіть розмір' : 'Select a size') : ''}
                >
                  {added ? (lang === 'uk' ? 'Додано!' : 'Added!') : !sizeOk ? (lang === 'uk' ? 'Оберіть розмір' : 'Select size') : t('constructor_add')}
                </button>
                <div className="constructor-trust">
                  <span>{lang === 'uk' ? '10–21 день виготовлення' : '10–21 day production'}</span>
                  <span>{lang === 'uk' ? 'Безкоштовна доставка' : 'Free shipping'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypeIcon({ type, active }) {
  const color = active ? 'var(--accent)' : 'var(--ink-muted)';
  if (type === 'ring') return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <ellipse cx="16" cy="20" rx="12" ry="5"/><path d="M4 20 Q4 8 16 8 Q28 8 28 20"/>
    </svg>
  );
  if (type === 'necklace') return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M4 8 Q16 4 28 8 Q28 16 20 22 Q16 25 12 22 Q4 16 4 8"/><circle cx="16" cy="26" r="3" fill={color} opacity="0.5"/>
    </svg>
  );
  if (type === 'bracelet') return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <ellipse cx="16" cy="16" rx="12" ry="8"/><ellipse cx="16" cy="14" rx="12" ry="8"/>
    </svg>
  );
  if (type === 'earrings') return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="10" cy="7" r="3"/><line x1="10" y1="10" x2="10" y2="17"/><ellipse cx="10" cy="22" rx="4" ry="5"/>
      <circle cx="22" cy="7" r="3"/><line x1="22" y1="10" x2="22" y2="17"/><ellipse cx="22" cy="22" rx="4" ry="5"/>
    </svg>
  );
  return null;
}

window.ConstructorPage = ConstructorPage;

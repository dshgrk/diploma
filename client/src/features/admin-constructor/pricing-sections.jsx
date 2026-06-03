// Файл містить секції цін і матриці доступних каменів admin-конструктора.
import React from "react";

// Компонент рендерить блок pricing matrix section і отримує потрібні дані через props або локальний state.
export function PricingMatrixSection({
  currentVariant,
  stones,
  matrix,
  onUpdate,
  onOpenStones,
  onOpenPricing,
  getStoneName
}) {
  if (!currentVariant) return null;

  return (
    <>
      <div className="admin-panel-head">
        <div>
          <h2>Дозволені камені</h2>
          <p className="admin-panel-copy">Які камені доступні для цього варіанта і скільки коштує кожен.</p>
        </div>
        <div className="admin-chip-row">
          <button type="button" className="small-button button-secondary-strong" onClick={onOpenStones}>Відкрити бібліотеку каменів</button>
          <button type="button" className="small-button button-secondary-strong" onClick={onOpenPricing}>Перейти до розділу цін</button>
        </div>
      </div>
      <div className="admin-list-stack">
        {stones.map((stone) => {
          const entry = matrix.find((item) => String(item.stone_id) === String(stone.id)) || {
            variant_id: currentVariant.id,
            stone_id: stone.id,
            price_delta: 0,
            is_default: false,
            is_enabled: false,
            sort_order: stone.sort_order || stone.id
          };
          return (
            <div className="admin-layout-row" key={`matrix-${stone.id}`}>
              <div className="admin-stone-row is-active" style={{ gridTemplateColumns: "56px 1fr", border: 0, padding: 0, background: "transparent" }}>
                <span className="admin-stone-thumb" style={stone.asset_url ? { backgroundImage: `url(${stone.asset_url})`, backgroundSize: "90%", backgroundPosition: "center center", backgroundRepeat: "no-repeat" } : undefined} />
                <div><strong>{getStoneName(stone, stone.code)}</strong><span>{stone.code}</span></div>
              </div>
              <div className="admin-layout-inputs">
                <label><span>Увімкнено</span><input type="checkbox" checked={entry.is_enabled} onChange={(e) => onUpdate(entry, { is_enabled: e.target.checked })} /></label>
                <label><span>За замовчуванням</span><input type="checkbox" checked={entry.is_default} onChange={(e) => onUpdate(entry, { is_default: e.target.checked, is_enabled: true })} /></label>
                <label><span>Ціна</span><input type="number" value={entry.price_delta} onChange={(e) => onUpdate(entry, { price_delta: Number(e.target.value), is_enabled: true })} /></label>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// Компонент рендерить блок pricing section і отримує потрібні дані через props або локальний state.
export function PricingSection({
  types,
  variants,
  selectedTypeId,
  selectedVariantId,
  currentTypeCode,
  currentVariant,
  stones,
  matrix,
  onSelectType,
  onSelectVariant,
  onUpdateMatrix,
  onOpenStones,
  onOpenEditorMatrix,
  getTypeName,
  getVariantName,
  getStoneName
}) {
  return (
    <>
      <div className="admin-panel-head">
        <div>
          <h2>Ціни й доступність</h2>
          <p className="admin-panel-copy">Спочатку виберіть прикрасу, потім налаштуйте, які камені доступні і скільки вони коштують.</p>
        </div>
      </div>
      <div className="studio-pricing-topbar">
        <div className="admin-chip-row admin-chip-stack">
          <span className="studio-kicker">Тип прикраси</span>
          {types.map((type) => (
            <button key={type.id} type="button" className={`small-button${String(selectedTypeId) === String(type.id) ? " is-active" : ""}`} onClick={() => onSelectType(type)}>
              {getTypeName(type)}
            </button>
          ))}
        </div>
        <div className="admin-chip-row admin-chip-stack">
          <span className="studio-kicker">Варіант</span>
          {variants.map((variant) => (
            <button key={variant.id} type="button" className={`small-button${String(selectedVariantId) === String(variant.id) ? " is-active" : ""}`} onClick={() => onSelectVariant(variant)}>
              {getVariantName(variant, currentTypeCode)}
            </button>
          ))}
        </div>
      </div>
      {currentVariant ? (
        <PricingMatrixSection
          currentVariant={currentVariant}
          stones={stones}
          matrix={matrix}
          onUpdate={onUpdateMatrix}
          onOpenStones={onOpenStones}
          onOpenPricing={onOpenEditorMatrix}
          getStoneName={getStoneName}
        />
      ) : (
        <div className="admin-cardish studio-empty-block">
          <h3>Немає варіанта для налаштування цін</h3>
          <p className="studio-empty-copy">Спочатку створіть варіант усередині типу, а потім увімкніть для нього доступні камені та їхні ціни.</p>
        </div>
      )}
    </>
  );
}

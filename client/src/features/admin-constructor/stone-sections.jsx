// Файл містить секції бібліотеки та редактора каменів admin-конструктора.
import React from "react";

// Компонент рендерить блок stone library section і отримує потрібні дані через props або локальний state.
export function StoneLibrarySection({
  stones,
  matrix,
  getStoneName,
  onCreate,
  onOpenEditor
}) {
  return (
    <>
      <div className="admin-panel-head">
        <div>
          <h2>Бібліотека каменів</h2>
          <p className="admin-panel-copy">Повний список каменів, які можна використовувати в прикрасах.</p>
        </div>
        <button type="button" className="small-button is-active" onClick={onCreate}>Новий камінь</button>
      </div>
      {stones.length ? (
        <section className="studio-stone-library-grid">
          {stones.map((stone) => {
            const usage = matrix.filter((item) => String(item.stone_id) === String(stone.id) && item.is_enabled !== false).length;
            return (
              <button key={stone.id} type="button" className="studio-stone-library-card" onClick={() => onOpenEditor(stone.id)}>
                <span className="studio-stone-library-thumb" style={stone.asset_url ? { backgroundImage: `url(${stone.asset_url})` } : undefined} />
                <strong>{getStoneName(stone, stone.code)}</strong>
                <span>{stone.code}</span>
                <p>{usage} варіантів використовують цей камінь</p>
              </button>
            );
          })}
        </section>
      ) : (
        <div className="admin-cardish studio-empty-block">
          <h3>Бібліотека каменів порожня</h3>
          <p className="studio-empty-copy">Можна почати з порожнього каталогу й додати лише ті камені, які справді потрібні.</p>
        </div>
      )}
    </>
  );
}

// Компонент рендерить блок stone editor section і отримує потрібні дані через props або локальний state.
export function StoneEditorSection({
  form,
  assets,
  assetsById,
  stones,
  usage,
  studioVariants,
  types,
  isSaving,
  isDeletePending,
  navigateBack,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onSave,
  onChange,
  onOpenUsage,
  getStoneName,
  getVariantName,
  getAssetName
}) {
  if (!form) return null;

  return (
    <>
      <div className="admin-panel-head">
        <div>
          <h2>Редактор каменю</h2>
          <p className="admin-panel-copy">Налаштуйте властивості каменю та перевірте, де він використовується.</p>
        </div>
        <div className="admin-chip-row">
          <button type="button" className="small-button" onClick={navigateBack}>Назад до бібліотеки</button>
          {isDeletePending("stone", form?.id) ? (
            <>
              <button type="button" className="small-button button-danger is-confirm" disabled={!form?.id || isSaving} onClick={onConfirmDelete}>Підтвердити видалення</button>
              <button type="button" className="small-button button-secondary-strong" disabled={isSaving} onClick={onCancelDelete}>Скасувати</button>
            </>
          ) : (
            <button type="button" className="small-button button-danger" disabled={!form?.id || isSaving} onClick={onDelete}>Видалити камінь</button>
          )}
          <button type="button" className="small-button is-active" disabled={isSaving} onClick={onSave}>{isSaving ? "Збереження..." : "Зберегти камінь"}</button>
        </div>
      </div>
      <div className="studio-stone-editor-layout">
        <div className="admin-cardish">
          <div className="admin-form-grid compact">
            <label><span>Код</span><input value={form.code || ""} onChange={(e) => onChange({ code: e.target.value })} /></label>
            <label><span>Асет</span><select value={form.asset_id || ""} onChange={(e) => onChange({ asset_id: Number(e.target.value) || null })}><option value="">-</option>{assets.filter((asset) => asset.kind === "stone").map((asset) => <option key={asset.id} value={asset.id}>{getAssetName(asset, { stones })}</option>)}</select></label>
            <label><span>Назва UK</span><input value={form.name_uk || ""} onChange={(e) => onChange({ name_uk: e.target.value })} /></label>
            <label><span>Назва EN</span><input value={form.name_en || ""} onChange={(e) => onChange({ name_en: e.target.value })} /></label>
            <label><span>Масштаб X</span><input type="number" step="0.1" value={form.default_scale_x || 1} onChange={(e) => onChange({ default_scale_x: Number(e.target.value) })} /></label>
            <label><span>Масштаб Y</span><input type="number" step="0.1" value={form.default_scale_y || 1} onChange={(e) => onChange({ default_scale_y: Number(e.target.value) })} /></label>
            <label className="full"><span>Шар</span><select value={form.default_layer_mode || "above"} onChange={(e) => onChange({ default_layer_mode: e.target.value })}><option value="above">над прикрасою</option><option value="below">під прикрасою</option></select></label>
          </div>
        </div>
        <div className="admin-cardish">
          <h3>Попередній перегляд</h3>
          <div className="studio-stone-editor-preview">
            <span className="studio-stone-editor-preview-thumb" style={form.asset_id && assetsById[form.asset_id]?.path ? { backgroundImage: `url(${assetsById[form.asset_id].path})` } : undefined} />
          </div>
          <h3>Використання у варіантах</h3>
          <div className="studio-usage-list">
            {usage.length ? usage.map((entry) => {
              const variant = studioVariants.find((item) => String(item.id) === String(entry.variant_id));
              return (
                <button key={`usage-${entry.variant_id}`} type="button" className="studio-usage-item" onClick={() => onOpenUsage(entry, variant)}>
                  <strong>{getVariantName(variant, types.find((item) => String(item.id) === String(variant?.type_id))?.code) || `Варіант ${entry.variant_id}`}</strong>
                  <span>{entry.price_delta} грн</span>
                </button>
              );
            }) : <p className="studio-empty-copy">Цей камінь ще не увімкнений у жодному варіанті.</p>}
          </div>
        </div>
      </div>
    </>
  );
}

// Файл містить секцію керування asset-бібліотекою admin-конструктора.
import React from "react";

// Компонент рендерить блок assets section і отримує потрібні дані через props або локальний state.
export function AssetsSection({
  assets,
  selectedAssetKind,
  assetUploadState,
  studioVariants,
  types,
  stones,
  isSaving,
  isDeletePending,
  onAssetStateChange,
  onUpload,
  onSelectKind,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  getAssetKindLabel,
  getAssetName
}) {
  const visibleAssets = assets.filter((asset) => asset.kind === selectedAssetKind);

  return (
    <>
      <div className="admin-panel-head">
        <div>
          <h2>Асети</h2>
          <p className="admin-panel-copy">Завантажуйте й перевикористовуйте зображення прикрас, каменів і вітринних асетів.</p>
        </div>
      </div>
      <div className="admin-cardish">
        <div className="admin-form-grid compact">
          <label><span>Назва</span><input value={assetUploadState.label} onChange={(e) => onAssetStateChange({ label: e.target.value })} /></label>
          <label><span>Тип</span><select value={assetUploadState.kind} onChange={(e) => onAssetStateChange({ kind: e.target.value })}><option value="jewelry-base">{getAssetKindLabel("jewelry-base")}</option><option value="stone">{getAssetKindLabel("stone")}</option><option value="product">{getAssetKindLabel("product")}</option><option value="other">{getAssetKindLabel("other")}</option></select></label>
          <label className="full"><span>Теги</span><input value={assetUploadState.tags} onChange={(e) => onAssetStateChange({ tags: e.target.value })} /></label>
          <label className="admin-upload-field full"><span>Завантажити зображення</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={onUpload} /></label>
        </div>
      </div>
      <div className="studio-subnav">
        {["jewelry-base", "stone", "product", "other"].map((kind) => (
          <button key={kind} type="button" className={`small-button${selectedAssetKind === kind ? " is-active" : ""}`} onClick={() => onSelectKind(kind)}>{getAssetKindLabel(kind)}</button>
        ))}
      </div>
      <div className="admin-asset-grid">
        {visibleAssets.map((asset) => (
          <div className="admin-asset-card" key={asset.id}>
            <img src={asset.path} alt={getAssetName(asset, { variants: studioVariants, types, stones })} />
            <strong>{getAssetName(asset, { variants: studioVariants, types, stones })}</strong>
            <span>{asset.path}</span>
            <span>{asset.width && asset.height ? `${asset.width}x${asset.height}` : getAssetKindLabel(asset.kind)}</span>
            <div className="admin-chip-row">
              {isDeletePending("asset", asset.id) ? (
                <>
                  <button type="button" className="small-button button-danger is-confirm" disabled={isSaving} onClick={() => onConfirmDelete(asset)}>Підтвердити видалення</button>
                  <button type="button" className="small-button button-secondary-strong" disabled={isSaving} onClick={onCancelDelete}>Скасувати</button>
                </>
              ) : (
                <button type="button" className="small-button button-danger" disabled={isSaving} onClick={() => onDelete(asset)}>Видалити асет</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {!visibleAssets.length ? (
        <div className="admin-cardish studio-empty-block">
          <h3>У цій категорії поки немає асетів</h3>
          <p className="studio-empty-copy">Можна тримати бібліотеку чистою й додавати лише те, що справді використовується.</p>
        </div>
      ) : null}
    </>
  );
}

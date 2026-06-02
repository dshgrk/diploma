import React from "react";
import { JewelryPreview } from "../../jewelry-preview";
import { StudioSlotCanvasEditor } from "./studio-slot-canvas-editor.jsx";

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

export function StudioWorkspaceBar({
  sections,
  currentSection,
  breadcrumbs,
  onOpenSection
}) {
  return (
    <section className="studio-workspace-bar admin-panel">
      <div className="admin-panel-head">
        <h2>Робочий простір</h2>
      </div>
      <div className="studio-top-nav">
        {sections.map((item) => (
          <button key={item.key} type="button" className={"small-button" + (currentSection === item.key ? " is-active" : "")} onClick={() => onOpenSection(item.key)}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="studio-breadcrumbs">
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item.key}>
            {index > 0 ? <span>/</span> : null}
            {item.isActive ? (
              <span>{item.label}</span>
            ) : (
              <button type="button" className="tiny-link-button" onClick={item.onClick}>{item.label}</button>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

export function StudioWorkspaceHomeSection({
  sections,
  onOpenSection
}) {
  return (
    <section className="studio-home-grid">
      {sections.map((item) => (
        <button key={item.key} type="button" className="studio-home-card" onClick={() => onOpenSection(item.key)}>
          <span className="studio-kicker">Робочий простір</span>
          <strong>{item.label}</strong>
          <p>{item.description}</p>
        </button>
      ))}
    </section>
  );
}

export function StudioWorkspaceMainPanel({
  section,
  jewelryStep,
  stoneStep,
  home,
  jewelryTypes,
  jewelryVariants,
  jewelryEditor,
  stonesList,
  stoneEditor,
  assets,
  pricing
}) {
  return (
    <section className="admin-panel wide studio-main-panel">
      {section === "home" ? home : null}
      {section === "jewelry" && jewelryStep === "types" ? jewelryTypes : null}
      {section === "jewelry" && jewelryStep === "variants" ? jewelryVariants : null}
      {section === "jewelry" && jewelryStep === "editor" ? jewelryEditor : null}
      {section === "stones" && stoneStep === "list" ? stonesList : null}
      {section === "stones" && stoneStep === "editor" ? stoneEditor : null}
      {section === "assets" ? assets : null}
      {section === "pricing" ? pricing : null}
    </section>
  );
}

export function JewelryEditorSection({
  editorSubview,
  onOpenSubview,
  slots,
  basic,
  matrix,
  preview
}) {
  return (
    <>
      <div className="studio-subnav">
        {[
          ["slots", "Слоти"],
          ["basic", "Основне"],
          ["matrix", "Дозволені камені"],
          ["preview", "Попередній перегляд"]
        ].map(([key, label]) => (
          <button key={key} type="button" className={"small-button" + (editorSubview === key ? " is-active" : "")} onClick={() => onOpenSubview(key)}>
            {label}
          </button>
        ))}
      </div>
      {editorSubview === "slots" ? slots : null}
      {editorSubview === "basic" ? basic : null}
      {editorSubview === "matrix" ? matrix : null}
      {editorSubview === "preview" ? preview : null}
    </>
  );
}

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

export function JewelryTypeStepSection({
  types,
  variants,
  jewelryTypes,
  onCreate,
  onOpenType,
  getTypeName
}) {
  return (
    <>
      <div className="admin-panel-head">
        <div>
          <h2>Типи прикрас</h2>
          <p className="admin-panel-copy">Оберіть тип, щоб керувати його варіантами, параметрами й порожніми станами каталогу.</p>
        </div>
        <div className="admin-chip-row">
          <button type="button" className="small-button is-active" onClick={onCreate}>Створити тип</button>
        </div>
      </div>
      {types.length ? (
        <section className="studio-home-grid">
          {types.map((type) => (
            <button key={type.id} type="button" className="studio-home-card" onClick={() => onOpenType(type.id)}>
              <span className="studio-kicker">Тип прикраси</span>
              <strong>{jewelryTypes.find(([code]) => code === type.code)?.[1] || getTypeName(type)}</strong>
              <p>{variants.filter((item) => String(item.type_id) === String(type.id)).length} варіантів</p>
            </button>
          ))}
        </section>
      ) : (
        <div className="admin-cardish studio-empty-block">
          <h3>Каталог поки порожній</h3>
          <p className="studio-empty-copy">Створіть перший тип прикраси, і ми одразу відкриємо для нього редактор варіантів та параметрів.</p>
        </div>
      )}
    </>
  );
}

export function JewelryVariantStepSection({
  currentTypeAdmin,
  currentTypeLabel,
  selectedTypeId,
  variants,
  allSlots,
  isSaving,
  isDeletePending,
  onBack,
  onOpenTypeBasic,
  onCreateVariant,
  onDeleteType,
  onConfirmDeleteType,
  onCancelDelete,
  onOpenVariant,
  getVariantName,
  getVariantAssetUrl,
  getVariantAssetCandidates,
  getVariantBaseAssetUrl
}) {
  return (
    <>
      <div className="admin-panel-head">
        <div>
          <h2>{currentTypeLabel || currentTypeAdmin?.name_uk || "Тип прикраси"}</h2>
          <p className="admin-panel-copy">Додавайте нові варіанти всередині типу й налаштовуйте параметри типу окремо від візуальних варіантів.</p>
        </div>
        <div className="admin-chip-row">
          <button type="button" className="small-button button-secondary-strong" onClick={onBack}>Назад до типів</button>
          <button type="button" className="small-button button-secondary-strong" disabled={!currentTypeAdmin} onClick={onOpenTypeBasic}>Параметри типу</button>
          <button type="button" className="small-button is-active" disabled={!currentTypeAdmin} onClick={onCreateVariant}>Створити варіант</button>
          {isDeletePending("type", currentTypeAdmin?.id) ? (
            <>
              <button type="button" className="small-button button-danger is-confirm" disabled={isSaving} onClick={onConfirmDeleteType}>Підтвердити видалення</button>
              <button type="button" className="small-button button-secondary-strong" disabled={isSaving} onClick={onCancelDelete}>Скасувати</button>
            </>
          ) : (
            <button type="button" className="small-button button-danger" disabled={!currentTypeAdmin || isSaving} onClick={onDeleteType}>Видалити тип</button>
          )}
        </div>
      </div>
      {variants.length ? (
        <section className="studio-variant-grid">
          {variants.map((variant) => {
            const slotCount = allSlots.filter((slot) => String(slot.variant_id) === String(variant.id) && slot.is_active !== false).length;
            const assetPath = getVariantAssetUrl(variant);
            const assetCandidates = getVariantAssetCandidates(variant);
            const previewVariant = { ...variant, base_asset_url: getVariantBaseAssetUrl(variant) };
            return (
              <button key={variant.id} type="button" className="studio-variant-card" onClick={() => onOpenVariant(variant.id)}>
                <div className="studio-variant-art">
                  {assetPath ? (
                    <JewelryPreview
                      variant={previewVariant}
                      slots={[]}
                      stonesByCode={{}}
                      selections={{}}
                      engraving=""
                      baseAssetCandidates={assetCandidates}
                    />
                  ) : (
                    <span>Немає асета</span>
                  )}
                </div>
                <div className="studio-variant-copy">
                  <span className="studio-kicker">{currentTypeLabel || currentTypeAdmin?.name_uk}</span>
                  <strong>{getVariantName(variant, currentTypeAdmin?.code)}</strong>
                  <p>{slotCount} слотів</p>
                </div>
              </button>
            );
          })}
        </section>
      ) : (
        <div className="admin-cardish studio-empty-block">
          <h3>У цього типу поки немає варіантів</h3>
          <p className="studio-empty-copy">Створіть новий варіант усередині типу, як у підвісок із серцем, місяцем або краплею.</p>
          <div className="admin-chip-row">
            <button type="button" className="small-button is-active" onClick={onCreateVariant}>Створити перший варіант</button>
            <button type="button" className="small-button button-secondary-strong" onClick={onOpenTypeBasic}>Відкрити параметри типу</button>
          </div>
        </div>
      )}
    </>
  );
}

export function JewelryBasicSection({
  typeForm,
  variantForm,
  assets,
  currentTypeAdmin,
  currentVariantAdmin,
  selectedTypeId,
  isSaving,
  isDeletePending,
  onBackToVariants,
  onCreateVariant,
  onDeleteVariant,
  onConfirmDeleteVariant,
  onDeleteType,
  onConfirmDeleteType,
  onCancelDelete,
  onSaveVariant,
  onSaveType,
  onSetVariantForm,
  onUpdateTypeField,
  onUpdateTypeMaterial,
  onAddTypeMaterial,
  onRemoveTypeMaterial,
  onUpdateTypeSize,
  onAddTypeSize,
  onRemoveTypeSize,
  onUpdateEngravingField
}) {
  if (!typeForm) return null;

  return (
    <>
      <div className="admin-panel-head">
        <div>
          <h2>Основне</h2>
          <p className="admin-panel-copy">Повний CRUD для самого типу прикраси та вибраного варіанта всередині нього.</p>
        </div>
        <div className="admin-chip-row">
          <button type="button" className="small-button button-secondary-strong" onClick={onBackToVariants}>До варіантів</button>
          <button type="button" className="small-button button-secondary-strong" disabled={!currentTypeAdmin} onClick={onCreateVariant}>Створити варіант</button>
          {isDeletePending("variant", currentVariantAdmin?.id) ? (
            <>
              <button type="button" className="small-button button-danger is-confirm" disabled={isSaving} onClick={onConfirmDeleteVariant}>Підтвердити видалення</button>
              <button type="button" className="small-button button-secondary-strong" disabled={isSaving} onClick={onCancelDelete}>Скасувати</button>
            </>
          ) : (
            <button type="button" className="small-button button-danger" disabled={!currentVariantAdmin || isSaving} onClick={onDeleteVariant}>Видалити варіант</button>
          )}
          {isDeletePending("type", currentTypeAdmin?.id) ? (
            <>
              <button type="button" className="small-button button-danger is-confirm" disabled={isSaving} onClick={onConfirmDeleteType}>Підтвердити видалення типу</button>
              <button type="button" className="small-button button-secondary-strong" disabled={isSaving} onClick={onCancelDelete}>Скасувати</button>
            </>
          ) : (
            <button type="button" className="small-button button-danger" disabled={!currentTypeAdmin || isSaving} onClick={onDeleteType}>Видалити тип</button>
          )}
          {variantForm ? <button type="button" className="small-button is-active" disabled={isSaving} onClick={onSaveVariant}>{isSaving ? "Збереження..." : "Зберегти варіант"}</button> : null}
          <button type="button" className="small-button" disabled={isSaving} onClick={onSaveType}>{isSaving ? "Збереження..." : "Зберегти тип"}</button>
        </div>
      </div>
      <div className="studio-basic-grid">
        <div className="admin-cardish">
          <h3>Варіант</h3>
          {variantForm ? (
            <div className="admin-form-grid compact">
              <label><span>Код</span><input value={variantForm?.code || ""} onChange={(e) => onSetVariantForm((current) => ({ ...(current || {}), code: e.target.value }))} /></label>
              <label><span>Підтип</span><input value={variantForm?.subtype || ""} onChange={(e) => onSetVariantForm((current) => ({ ...(current || {}), subtype: e.target.value }))} /></label>
              <label><span>Група</span><input value={variantForm?.group || ""} onChange={(e) => onSetVariantForm((current) => ({ ...(current || {}), group: e.target.value }))} /></label>
              <label><span>Сортування</span><input type="number" value={variantForm?.sort_order || 0} onChange={(e) => onSetVariantForm((current) => ({ ...(current || {}), sort_order: Number(e.target.value) }))} /></label>
              <label><span>Доплата за модель</span><input type="number" value={variantForm?.price_delta || 0} onChange={(e) => onSetVariantForm((current) => ({ ...(current || {}), price_delta: Number(e.target.value) }))} /></label>
              <label><span>Назва UK</span><input value={variantForm?.name_uk || ""} onChange={(e) => onSetVariantForm((current) => ({ ...(current || {}), name_uk: e.target.value }))} /></label>
              <label><span>Назва EN</span><input value={variantForm?.name_en || ""} onChange={(e) => onSetVariantForm((current) => ({ ...(current || {}), name_en: e.target.value }))} /></label>
              <label className="full"><span>Базовий асет</span><select value={variantForm?.base_asset_id || ""} onChange={(e) => onSetVariantForm((current) => ({ ...(current || {}), base_asset_id: Number(e.target.value) || null }))}><option value="">-</option>{assets.filter((asset) => asset.kind === "jewelry-base").map((asset) => <option key={asset.id} value={asset.id}>{asset.label}</option>)}</select></label>
            </div>
          ) : (
            <div className="studio-empty-copy">У цього типу поки немає вибраного варіанта. Створіть новий варіант, і він одразу з’явиться тут.</div>
          )}
        </div>
        <div className="admin-cardish">
          <h3>Тип прикраси</h3>
          <div className="admin-form-grid compact">
            <label><span>Код</span><input value={typeForm.code || ""} onChange={(e) => onUpdateTypeField("code", e.target.value)} /></label>
            <label><span>Базова ціна</span><input type="number" value={typeForm.base_price || 0} onChange={(e) => onUpdateTypeField("base_price", Number(e.target.value))} /></label>
            <label><span>Сортування</span><input type="number" value={typeForm.sort_order || 0} onChange={(e) => onUpdateTypeField("sort_order", Number(e.target.value))} /></label>
            <label><span>Назва UK</span><input value={typeForm.name_uk || ""} onChange={(e) => onUpdateTypeField("name_uk", e.target.value)} /></label>
            <label><span>Назва EN</span><input value={typeForm.name_en || ""} onChange={(e) => onUpdateTypeField("name_en", e.target.value)} /></label>
          </div>
        </div>
        <div className="admin-cardish">
          <div className="studio-inline-head">
            <h3>Матеріали</h3>
            <button type="button" className="small-button button-secondary-strong" onClick={onAddTypeMaterial}>Додати матеріал</button>
          </div>
          {(typeForm.materials || []).length ? (
            <div className="studio-type-list">
              {(typeForm.materials || []).map((material, index) => (
                <div className="studio-type-row" key={`material-${index}`}>
                  <div className="admin-form-grid compact">
                    <label><span>Код</span><input value={material.code || ""} onChange={(e) => onUpdateTypeMaterial(index, "code", e.target.value)} /></label>
                    <label><span>Сортування</span><input type="number" value={material.sort_order || 0} onChange={(e) => onUpdateTypeMaterial(index, "sort_order", Number(e.target.value))} /></label>
                    <label><span>Назва UK</span><input value={material.name_uk || ""} onChange={(e) => onUpdateTypeMaterial(index, "name_uk", e.target.value)} /></label>
                    <label><span>Назва EN</span><input value={material.name_en || ""} onChange={(e) => onUpdateTypeMaterial(index, "name_en", e.target.value)} /></label>
                    <label><span>Доплата</span><input type="number" value={material.price_delta || 0} onChange={(e) => onUpdateTypeMaterial(index, "price_delta", Number(e.target.value))} /></label>
                    <label><span>Тон</span><input value={material.tone || ""} onChange={(e) => onUpdateTypeMaterial(index, "tone", e.target.value)} /></label>
                  </div>
                  <button type="button" className="small-button button-danger" onClick={() => onRemoveTypeMaterial(index)}>Видалити матеріал</button>
                </div>
              ))}
            </div>
          ) : <p className="studio-empty-copy">У типу немає параметрів матеріалів.</p>}
        </div>
        <div className="admin-cardish">
          <div className="studio-inline-head">
            <h3>Розміри</h3>
            <button type="button" className="small-button button-secondary-strong" onClick={onAddTypeSize}>Додати розмір</button>
          </div>
          {(typeForm.size_options || []).length ? (
            <div className="studio-type-list">
              {(typeForm.size_options || []).map((size, index) => (
                <div className="studio-type-row" key={`size-${index}`}>
                  <div className="admin-form-grid compact">
                    <label><span>Код</span><input value={size.code || ""} onChange={(e) => onUpdateTypeSize(index, "code", e.target.value)} /></label>
                    <label><span>Сортування</span><input type="number" value={size.sort_order || 0} onChange={(e) => onUpdateTypeSize(index, "sort_order", Number(e.target.value))} /></label>
                    <label><span>Назва UK</span><input value={size.label_uk || ""} onChange={(e) => onUpdateTypeSize(index, "label_uk", e.target.value)} /></label>
                    <label><span>Назва EN</span><input value={size.label_en || ""} onChange={(e) => onUpdateTypeSize(index, "label_en", e.target.value)} /></label>
                    <label><span>Доплата</span><input type="number" value={size.price_delta || 0} onChange={(e) => onUpdateTypeSize(index, "price_delta", Number(e.target.value))} /></label>
                    <label><span>За замовчуванням</span><input type="checkbox" checked={Boolean(size.is_default)} onChange={(e) => onUpdateTypeSize(index, "is_default", e.target.checked)} /></label>
                  </div>
                  <button type="button" className="small-button button-danger" onClick={() => onRemoveTypeSize(index)}>Видалити розмір</button>
                </div>
              ))}
            </div>
          ) : <p className="studio-empty-copy">У типу немає параметрів розмірів.</p>}
        </div>
        <div className="admin-cardish">
          <h3>Гравіювання</h3>
          <div className="admin-form-grid compact">
            <label><span>Увімкнено</span><input type="checkbox" checked={Boolean(typeForm.engraving?.enabled)} onChange={(e) => onUpdateEngravingField("enabled", e.target.checked)} /></label>
            <label><span>Максимальна довжина</span><input type="number" value={typeForm.engraving?.max_length || 24} onChange={(e) => onUpdateEngravingField("max_length", Number(e.target.value))} /></label>
            <label><span>Доплата</span><input type="number" value={typeForm.engraving?.price_delta || 0} onChange={(e) => onUpdateEngravingField("price_delta", Number(e.target.value))} /></label>
            <label><span>Плейсхолдер UK</span><input value={typeForm.engraving?.placeholder_uk || ""} onChange={(e) => onUpdateEngravingField("placeholder_uk", e.target.value)} /></label>
            <label><span>Плейсхолдер EN</span><input value={typeForm.engraving?.placeholder_en || ""} onChange={(e) => onUpdateEngravingField("placeholder_en", e.target.value)} /></label>
          </div>
        </div>
      </div>
    </>
  );
}

export function JewelryPreviewSection({
  currentVariantPreview,
  currentVariantAdmin,
  currentSlots,
  stonesByCode,
  previewSelections,
  availablePreviewStones,
  onPreviewSelectionChange,
  getSlotName,
  getStoneName,
  getVariantAssetCandidates
}) {
  if (!currentVariantPreview) return null;

  return (
    <>
      <div className="admin-panel-head"><h2>Попередній перегляд варіанта</h2></div>
      <div className="admin-preview-grid">
        <JewelryPreview
          variant={currentVariantPreview}
          slots={currentSlots}
          stonesByCode={stonesByCode}
          selections={previewSelections}
          engraving=""
          baseAssetCandidates={getVariantAssetCandidates(currentVariantAdmin)}
          applySlotRotation={true}
        />
        <div className="admin-form-grid compact">
          {currentSlots.map((slot) => (
            <label key={"preview-" + slot.id}>
              <span>{getSlotName(slot, slot.code)}</span>
              <select value={previewSelections[slot.code] || "none"} onChange={(e) => onPreviewSelectionChange(slot.code, e.target.value)}>
                <option value="none">Без каменю</option>
                {availablePreviewStones.map((stone) => <option key={stone.id} value={stone.code}>{getStoneName(stone, stone.code)}</option>)}
              </select>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

export function JewelrySlotsSection({
  currentVariantAdmin,
  currentTypeAdmin,
  currentVariantPreview,
  currentVariantEditorBaseAsset,
  currentSlots,
  currentSlot,
  slotForm,
  slotDraftDirty,
  slotSaveStatus,
  slotSaveStatusLabel,
  selectedPreviewStoneCode,
  availablePreviewStones,
  editableSlots,
  stonesByCode,
  previewSelections,
  isSaving,
  displayedY,
  onOpenStones,
  onBackToVariants,
  onStartNewSlot,
  onDuplicateSlot,
  onDeleteSlot,
  onSaveSlot,
  onSelectSlot,
  onPreviewStonePick,
  onCanvasInteractionStart,
  onCanvasMoveSlot,
  onCanvasResizeSlot,
  onCanvasRotateSlot,
  onCanvasInteractionEnd,
  onSlotFieldChange,
  getVariantName,
  getSlotName,
  getStoneName
}) {
  if (!currentVariantAdmin || !slotForm) {
    return (
      <div className="admin-cardish studio-empty-block">
        <h3>У варіанта поки немає слотів</h3>
        <p className="studio-empty-copy">Спочатку виберіть або створіть варіант, потім додайте перший слот, і редактор полотна одразу оживе.</p>
        <div className="admin-chip-row">
          <button type="button" className="small-button button-secondary-strong" onClick={onBackToVariants}>До списку варіантів</button>
          <button type="button" className="small-button is-active" disabled={!currentVariantAdmin} onClick={onStartNewSlot}>Створити перший слот</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-panel-head">
        <div>
          <h2>Редактор прикраси</h2>
          <p className="admin-panel-copy">Налаштування посадкових місць каменів для варіанта {getVariantName(currentVariantAdmin, currentTypeAdmin?.code)}.</p>
        </div>
        <div className="admin-chip-row">
          <button type="button" className="small-button button-secondary-strong" onClick={onOpenStones}>Усі камені</button>
          <button type="button" className="small-button button-secondary-strong" onClick={onStartNewSlot}>Новий слот</button>
          <button type="button" className="small-button button-secondary-strong" disabled={!currentSlot?.id || isSaving} onClick={onDuplicateSlot}>Дублювати слот</button>
          <button type="button" className="small-button button-secondary-strong" disabled={!currentSlot?.id || isSaving} onClick={onDeleteSlot}>Видалити слот</button>
          <button type="button" className={`small-button button-save-slot${slotDraftDirty ? " is-dirty" : ""}`} disabled={isSaving || !slotDraftDirty} onClick={onSaveSlot}>{slotSaveStatus === "saving" ? "Збереження..." : "Зберегти слот"}</button>
        </div>
      </div>
      <div className="studio-editor-layout">
        <aside className="studio-outline-panel">
          <div className="studio-mini-card">
            <span className="studio-kicker">Варіант</span>
            <strong>{getVariantName(currentVariantAdmin, currentTypeAdmin?.code)}</strong>
            <p>{currentSlots.length} слотів, асет {currentVariantAdmin.code || "не вибрано"}.</p>
          </div>
          <div className="studio-outline-list">
            {currentSlots.map((slot, index) => (
              <button key={slot.id} type="button" className={"studio-outline-item" + (String(currentSlot?.id) === String(slot.id) ? " is-active" : "")} onClick={() => onSelectSlot(slot.id)}>
                <span className="studio-outline-badge">{index + 1}</span>
                <div>
                  <strong>{getSlotName(slot, slot.code)}</strong>
                  <span>{Math.round(slot.x)} x {Math.round(slot.y)} · {slot.layer_mode}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="studio-stone-palette">
            <div className="studio-inline-head">
              <h3>Палітра каменів</h3>
              <button type="button" className="small-button button-secondary-strong" onClick={onOpenStones}>Відкрити бібліотеку</button>
            </div>
            <div className="studio-stone-grid">
              <button type="button" className={"studio-stone-choice" + (selectedPreviewStoneCode === "none" ? " is-active" : "")} onClick={() => onPreviewStonePick("none")}>
                <span className="studio-stone-choice-thumb is-empty" />
                <strong>Без каменю</strong>
              </button>
              {availablePreviewStones.map((stone) => (
                <button key={"palette-" + stone.id} type="button" className={"studio-stone-choice" + (selectedPreviewStoneCode === stone.code ? " is-active" : "")} onClick={() => onPreviewStonePick(stone.code)}>
                  <span className="studio-stone-choice-thumb" style={stone.asset_url ? { backgroundImage: "url(" + stone.asset_url + ")" } : undefined} />
                  <strong>{getStoneName(stone, stone.code)}</strong>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="studio-stage-panel">
          <div className="studio-stage-meta">
            <span>Полотно 1:1</span>
            <span>Перетягуйте слот, змінюйте розмір і кут прямо на прикрасі</span>
          </div>
          <StudioSlotCanvasEditor
            variant={currentVariantPreview}
            baseAssetUrl={currentVariantEditorBaseAsset}
            slots={editableSlots}
            stones={stonesByCode}
            previewSelections={previewSelections}
            selectedSlotId={currentSlot?.id}
            onSelectSlot={onSelectSlot}
            onInteractionStart={onCanvasInteractionStart}
            onMoveSlot={onCanvasMoveSlot}
            onResizeSlot={onCanvasResizeSlot}
            onRotateSlot={onCanvasRotateSlot}
            onInteractionEnd={onCanvasInteractionEnd}
          />
          <div className="studio-stage-footer">
            <span>Обраний слот: {getSlotName(currentSlot, slotForm.code || "Новий слот")}</span>
            <span>{Number(slotForm.x || 0).toFixed(1)}% / {displayedY.toFixed(1)}%</span>
            <span className={`studio-slot-save-status is-${slotSaveStatus}`}>{slotSaveStatusLabel()}</span>
          </div>
        </div>

        <aside className="studio-inspector-panel">
          <div className="studio-mini-card">
            <span className="studio-kicker">Інспектор</span>
            <strong>{getSlotName(currentSlot, "Чернетка нового слота")}</strong>
            <p>Точні координати, розмір посадкового кола та шар каменю. У полі Y більше значення означає вище.</p>
          </div>
          <div className="admin-form-grid compact">
            <label><span>Код</span><input value={slotForm.code || ""} onChange={(e) => onSlotFieldChange("code", e.target.value)} /></label>
            <label><span>Сортування</span><input type="number" value={slotForm.sort_order || 0} onChange={(e) => onSlotFieldChange("sort_order", Number(e.target.value))} /></label>
            <label><span>Назва UK</span><input value={slotForm.label_uk || ""} onChange={(e) => onSlotFieldChange("label_uk", e.target.value)} /></label>
            <label><span>Назва EN</span><input value={slotForm.label_en || ""} onChange={(e) => onSlotFieldChange("label_en", e.target.value)} /></label>
            <label><span>X</span><input type="number" step="0.1" value={slotForm.x || 0} onChange={(e) => onSlotFieldChange("x", Number(e.target.value))} /></label>
            <label><span>Y</span><input type="number" step="0.1" value={displayedY} onChange={(e) => onSlotFieldChange("display_y", Number(e.target.value))} /></label>
            <label><span>Масштаб X</span><input type="number" step="0.1" value={slotForm.scale_x || 1} onChange={(e) => onSlotFieldChange("scale_x", Number(e.target.value))} /></label>
            <label><span>Масштаб Y</span><input type="number" step="0.1" value={slotForm.scale_y || 1} onChange={(e) => onSlotFieldChange("scale_y", Number(e.target.value))} /></label>
            <label><span>Діаметр</span><input type="number" step="0.1" value={slotForm.diameter || 12} onChange={(e) => onSlotFieldChange("diameter", Number(e.target.value))} /></label>
            <label><span>Поворот</span><input type="number" step="0.1" min="0" max="360" value={slotForm.rotation_deg || 0} onChange={(e) => onSlotFieldChange("rotation_deg", Number(e.target.value))} /></label>
            <label><span>Режим шару</span><select value={slotForm.layer_mode || "above"} onChange={(e) => onSlotFieldChange("layer_mode", e.target.value)}><option value="above">Камінь над прикрасою</option><option value="below">Камінь під прикрасою</option></select></label>
            <label className="full">
              <span>Камінь для попереднього перегляду</span>
              <select value={selectedPreviewStoneCode} onChange={(e) => onPreviewStonePick(e.target.value)}>
                <option value="none">Без каменю</option>
                {availablePreviewStones.map((stone) => <option key={"preview-stone-" + stone.id} value={stone.code}>{getStoneName(stone, stone.code)}</option>)}
              </select>
            </label>
          </div>
        </aside>
      </div>
    </>
  );
}

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

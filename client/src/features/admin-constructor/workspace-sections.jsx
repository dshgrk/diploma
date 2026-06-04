// Файл містить навігаційні секції робочого простору admin-конструктора.
import React from "react";

// Компонент рендерить блок studio workspace bar і отримує потрібні дані через props або локальний state.
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

// Компонент рендерить блок studio workspace home section і отримує потрібні дані через props або локальний state.
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

// Компонент рендерить блок studio workspace main panel і отримує потрібні дані через props або локальний state.
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

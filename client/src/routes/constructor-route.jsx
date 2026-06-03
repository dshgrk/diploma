// Файл підключає shell публічного конструктора до загального SPA-маршруту.
import React from "react";
import { ConstructorStudioPage } from "../features/constructor/constructor-studio-page.jsx";
import { AuroraBackground, Footer, Header, usePublicLocale } from "./public-shell.jsx";
import "../styles.css";
import "../styles/constructor-page.css";

// Рендерить маршрут конструктора всередині публічного layout сайту.
export default function ConstructorRoute() {
  const { locale, toggleLocale } = usePublicLocale();

  return (
    <>
      <AuroraBackground />
      <div className="app-shell">
        <Header locale={locale} onToggleLocale={toggleLocale} />
        <ConstructorStudioPage locale={locale} />
        <Footer locale={locale} />
      </div>
    </>
  );
}

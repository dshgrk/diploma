// Файл рендерить SVG-іконку типу прикраси для публічного конструктора.
import React from "react";

// Показує компактну іконку за code типу прикраси.
export function TypeIcon({ type }) {
  const color = "currentColor";

  if (type === "ring") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <ellipse cx="16" cy="20" rx="12" ry="5" />
        <path d="M4 20 Q4 8 16 8 Q28 8 28 20" />
      </svg>
    );
  }

  if (type === "bracelet") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <ellipse cx="16" cy="16" rx="12" ry="8" />
        <ellipse cx="16" cy="14" rx="12" ry="8" />
      </svg>
    );
  }

  if (type === "pendant") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M10 10 Q16 5 22 10 Q22 15 16 22 Q10 15 10 10" />
        <circle cx="16" cy="24" r="2.5" fill={color} opacity="0.4" />
      </svg>
    );
  }

  if (type === "earrings") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="10" cy="8" r="3" />
        <line x1="10" y1="11" x2="10" y2="18" />
        <ellipse cx="10" cy="23" rx="4" ry="5" />
        <circle cx="22" cy="8" r="3" />
        <line x1="22" y1="11" x2="22" y2="18" />
        <ellipse cx="22" cy="23" rx="4" ry="5" />
      </svg>
    );
  }

  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="16" cy="16" r="10" />
    </svg>
  );
}

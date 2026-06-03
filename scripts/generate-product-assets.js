// Файл містить службовий Node.js-скрипт для підтримки проєкту.
const fs = require("fs/promises");
const path = require("path");
const { CATALOG_PRODUCTS } = require("../db/catalog-products");

const OUTPUT_DIR = path.resolve(process.cwd(), "public", "assets", "products");

const METAL_GRADIENTS = {
  Silver: ["#f7f8fb", "#b8c0cb", "#f2f4f7"],
  Gold: ["#fff0b8", "#b7862e", "#f6d77b"],
  "Rose Gold": ["#f7d1c3", "#b56c55", "#f3b8a7"]
};

const STONE_GRADIENTS = {
  White: ["#ffffff", "#d9e0ec", "#f6f9ff"],
  Cream: ["#fff5e6", "#e1d0b2", "#fffaf2"],
  Blue: ["#c6ebff", "#3475c8", "#9ad8ff"],
  Aqua: ["#c9fff7", "#30aab0", "#98fff2"],
  Green: ["#d8ffd4", "#2e8a58", "#8fdd8f"],
  Honey: ["#ffe9a1", "#c18111", "#ffd66d"],
  Blush: ["#ffd9e6", "#c66b8e", "#ffb9cf"],
  Burgundy: ["#f2bfca", "#8f2444", "#d96e8f"],
  Champagne: ["#fff0cf", "#b8924d", "#f6d7a0"],
  Clear: ["#ffffff", "#b3c7de", "#f7fbff"],
  Smoke: ["#d9dde7", "#5d6674", "#bcc3cf"],
  Yellow: ["#fff0a8", "#c58c18", "#ffd25d"],
  Ice: ["#eaf8ff", "#77bcd9", "#c4edff"]
};

// Виконує локальну логіку metal gradient для модуля службового скрипта.
function metalGradient(id, tones) {
  return `
    <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${tones[0]}"/>
      <stop offset="52%" stop-color="${tones[1]}"/>
      <stop offset="100%" stop-color="${tones[2]}"/>
    </linearGradient>
  `;
}

// Виконує локальну логіку stone gradient для модуля службового скрипта.
function stoneGradient(id, tones) {
  return `
    <radialGradient id="${id}" cx="34%" cy="30%" r="76%">
      <stop offset="0%" stop-color="${tones[0]}"/>
      <stop offset="58%" stop-color="${tones[1]}"/>
      <stop offset="100%" stop-color="${tones[2]}"/>
    </radialGradient>
  `;
}

// Отримує get stone shape з поточного набору даних або конфігурації.
function getStoneShape(shape, cx, cy, size, fillId) {
  const stroke = 'stroke="rgba(255,255,255,0.4)" stroke-width="8"';
  switch (shape) {
    case "Oval":
      return `<ellipse cx="${cx}" cy="${cy}" rx="${size * 0.62}" ry="${size * 0.82}" fill="url(#${fillId})" ${stroke} />`;
    case "Pear":
      return `<path d="M ${cx} ${cy - size * 0.98} C ${cx + size * 0.68} ${cy - size * 0.4}, ${cx + size * 0.74} ${cy + size * 0.54}, ${cx} ${cy + size * 0.98} C ${cx - size * 0.74} ${cy + size * 0.54}, ${cx - size * 0.68} ${cy - size * 0.4}, ${cx} ${cy - size * 0.98} Z" fill="url(#${fillId})" ${stroke} />`;
    case "Princess":
    case "Emerald Cut":
    case "Baguette":
      return `<rect x="${cx - size * 0.66}" y="${cy - size * 0.66}" width="${size * 1.32}" height="${size * 1.32}" rx="${shape === "Emerald Cut" ? size * 0.18 : size * 0.1}" fill="url(#${fillId})" transform="rotate(45 ${cx} ${cy})" ${stroke} />`;
    case "Heart":
      return `<path d="M ${cx} ${cy + size * 0.88} C ${cx - size * 0.72} ${cy + size * 0.32}, ${cx - size * 1.02} ${cy - size * 0.18}, ${cx - size * 0.58} ${cy - size * 0.64} C ${cx - size * 0.24} ${cy - size * 0.98}, ${cx + size * 0.24} ${cy - size * 0.98}, ${cx + size * 0.58} ${cy - size * 0.64} C ${cx + size * 1.02} ${cy - size * 0.18}, ${cx + size * 0.72} ${cy + size * 0.32}, ${cx} ${cy + size * 0.88} Z" fill="url(#${fillId})" ${stroke} />`;
    case "Marquise":
      return `<path d="M ${cx} ${cy - size} C ${cx + size * 0.54} ${cy - size * 0.66}, ${cx + size * 0.92} ${cy - size * 0.18}, ${cx} ${cy + size} C ${cx - size * 0.92} ${cy - size * 0.18}, ${cx - size * 0.54} ${cy - size * 0.66}, ${cx} ${cy - size} Z" fill="url(#${fillId})" ${stroke} />`;
    case "Trillion":
      return `<polygon points="${cx},${cy - size} ${cx + size * 0.94},${cy + size * 0.7} ${cx - size * 0.94},${cy + size * 0.7}" fill="url(#${fillId})" ${stroke} />`;
    default:
      return `<circle cx="${cx}" cy="${cy}" r="${size * 0.76}" fill="url(#${fillId})" ${stroke} />`;
  }
}

// Виконує локальну логіку draw ring для модуля службового скрипта.
function drawRing(product, metalId, stoneId) {
  const band = `<ellipse cx="600" cy="728" rx="258" ry="162" fill="none" stroke="url(#${metalId})" stroke-width="74" />`;
  const innerBand = `<ellipse cx="600" cy="728" rx="193" ry="112" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="6" />`;
  const shoulders = `<path d="M 446 560 C 500 628, 700 628, 754 560" fill="none" stroke="url(#${metalId})" stroke-width="32" stroke-linecap="round"/>`;
  const bezel = `<circle cx="600" cy="484" r="114" fill="none" stroke="url(#${metalId})" stroke-width="22" />`;
  const accent = product.visualStyle.includes("halo")
    ? `<circle cx="600" cy="484" r="142" fill="none" stroke="rgba(255,245,214,0.58)" stroke-width="10" stroke-dasharray="4 20"/>`
    : "";
  const sideAccent = product.visualStyle.includes("twist")
    ? `<path d="M 472 602 C 520 548, 680 548, 728 602" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="10"/>`
    : product.visualStyle.includes("star")
      ? `<g stroke="url(#${metalId})" stroke-width="12" stroke-linecap="round"><line x1="454" y1="470" x2="500" y2="470"/><line x1="700" y1="470" x2="746" y2="470"/></g>`
      : "";

  return `
    ${band}
    ${innerBand}
    ${shoulders}
    ${bezel}
    ${accent}
    ${sideAccent}
    ${getStoneShape(product.stoneShape, 600, 484, 76, stoneId)}
    <circle cx="560" cy="448" r="14" fill="rgba(255,255,255,0.4)" />
  `;
}

// Виконує локальну логіку draw bracelet для модуля службового скрипта.
function drawBracelet(product, metalId, stoneId) {
  const links = Array.from({ length: 7 }, (_, index) => {
    const x = 210 + index * 120;
    const y = index % 2 === 0 ? 632 : 586;
    return `<ellipse cx="${x}" cy="${y}" rx="74" ry="48" fill="none" stroke="url(#${metalId})" stroke-width="26" transform="rotate(${index % 2 === 0 ? -20 : 18} ${x} ${y})"/>`;
  }).join("");
  const centre = product.visualStyle === "cuff"
    ? `<path d="M 420 520 C 480 420, 720 420, 780 520" fill="none" stroke="url(#${metalId})" stroke-width="56" stroke-linecap="round"/>`
    : `<ellipse cx="600" cy="604" rx="118" ry="90" fill="none" stroke="url(#${metalId})" stroke-width="24"/>`;
  const charm = product.visualStyle === "medallion" || product.visualStyle === "orbital" || product.visualStyle === "orbit"
    ? `<circle cx="600" cy="604" r="62" fill="none" stroke="url(#${metalId})" stroke-width="18"/>`
    : product.visualStyle === "knot"
      ? `<path d="M 542 604 C 560 566, 640 566, 658 604 C 640 642, 560 642, 542 604 Z" fill="none" stroke="url(#${metalId})" stroke-width="16"/>`
      : "";

  return `
    ${links}
    ${centre}
    ${charm}
    ${getStoneShape(product.stoneShape, 600, 604, 58, stoneId)}
    <circle cx="564" cy="576" r="12" fill="rgba(255,255,255,0.42)" />
  `;
}

// Виконує локальну логіку draw earrings для модуля службового скрипта.
function drawEarrings(product, metalId, stoneId) {
  // Виконує локальну логіку unit для модуля службового скрипта.
  function unit(cx) {
    const top = `<circle cx="${cx}" cy="344" r="28" fill="url(#${metalId})"/>`;
    const hook = `<path d="M ${cx} 372 C ${cx} 420, ${cx - 16} 432, ${cx - 16} 470" fill="none" stroke="url(#${metalId})" stroke-width="18" stroke-linecap="round"/>`;
    const body = product.visualStyle === "stud"
      ? `<circle cx="${cx}" cy="520" r="76" fill="none" stroke="url(#${metalId})" stroke-width="18"/>`
      : product.visualStyle === "halo"
        ? `<circle cx="${cx}" cy="560" r="84" fill="none" stroke="url(#${metalId})" stroke-width="18"/><circle cx="${cx}" cy="560" r="110" fill="none" stroke="rgba(255,245,214,0.52)" stroke-width="8" stroke-dasharray="4 18"/>`
        : product.visualStyle === "arc"
          ? `<path d="M ${cx - 64} 476 C ${cx - 24} 432, ${cx + 54} 432, ${cx + 72} 520 C ${cx + 84} 578, ${cx + 50} 640, ${cx} 676" fill="none" stroke="url(#${metalId})" stroke-width="20" stroke-linecap="round"/>`
          : product.visualStyle === "cascade"
            ? `<path d="M ${cx} 392 C ${cx + 30} 440, ${cx + 40} 502, ${cx + 6} 560 C ${cx - 18} 602, ${cx - 18} 654, ${cx} 704" fill="none" stroke="url(#${metalId})" stroke-width="16" stroke-linecap="round"/>`
            : `<path d="M ${cx} 396 C ${cx + 8} 460, ${cx + 20} 514, ${cx} 600" fill="none" stroke="url(#${metalId})" stroke-width="16" stroke-linecap="round"/>`;
    const stoneY = product.visualStyle === "stud" ? 520 : product.visualStyle === "arc" ? 614 : product.visualStyle === "cascade" ? 652 : 592;
    return `${top}${hook}${body}${getStoneShape(product.stoneShape, cx, stoneY, 52, stoneId)}`;
  }

  return `${unit(438)}${unit(762)}`;
}

// Виконує локальну логіку draw pendant для модуля службового скрипта.
function drawPendant(product, metalId, stoneId) {
  const bail = `<path d="M 600 222 C 650 222, 666 268, 642 304 C 622 334, 578 334, 558 304 C 534 268, 550 222, 600 222 Z" fill="none" stroke="url(#${metalId})" stroke-width="18"/>`;
  const jumpRing = `<circle cx="600" cy="342" r="30" fill="none" stroke="url(#${metalId})" stroke-width="12"/>`;
  let body = "";
  switch (product.visualStyle) {
    case "heart":
      body = `<path d="M 600 786 C 488 694, 432 618, 432 540 C 432 452, 494 394, 570 394 C 620 394, 654 422, 600 458 C 646 422, 680 394, 730 394 C 806 394, 868 452, 868 540 C 868 618, 812 694, 600 786 Z" fill="url(#${metalId})"/>`;
      break;
    case "star":
      body = `<polygon points="600,392 650,516 784,528 680,612 714,742 600,670 486,742 520,612 416,528 550,516" fill="url(#${metalId})"/>`;
      break;
    case "moon":
      body = `<path d="M 720 388 C 632 408, 572 486, 572 582 C 572 672, 628 748, 710 774 C 660 806, 596 824, 526 824 C 358 824, 222 688, 222 520 C 222 352, 358 216, 526 216 C 604 216, 674 246, 726 296 C 760 328, 776 360, 720 388 Z" fill="url(#${metalId})" transform="translate(210 98) scale(0.72)"/>`;
      break;
    case "disc":
    case "orbit":
    case "oval":
      body = `<ellipse cx="600" cy="602" rx="156" ry="${product.visualStyle === "oval" ? 208 : 156}" fill="url(#${metalId})"/>`;
      break;
    case "drop":
    case "pear":
    case "flame":
      body = `<path d="M 600 368 C 704 456, 760 540, 760 640 C 760 760, 686 846, 600 846 C 514 846, 440 760, 440 640 C 440 540, 496 456, 600 368 Z" fill="url(#${metalId})"/>`;
      break;
    default:
      body = `<ellipse cx="600" cy="602" rx="156" ry="172" fill="url(#${metalId})"/>`;
      break;
  }

  return `
    ${bail}
    ${jumpRing}
    ${body}
    ${getStoneShape(product.stoneShape, 600, 602, 78, stoneId)}
    <circle cx="564" cy="562" r="14" fill="rgba(255,255,255,0.42)" />
  `;
}

// Готує JSX або HTML-представлення для render product svg.
function renderProductSvg(product) {
  const metalId = `${product.slug}-metal`;
  const stoneId = `${product.slug}-stone`;
  const metal = METAL_GRADIENTS[product.metal] || METAL_GRADIENTS.Gold;
  const stone = STONE_GRADIENTS[product.stoneColor] || STONE_GRADIENTS.White;

  const artByType = {
    ring: drawRing,
    bracelet: drawBracelet,
    earrings: drawEarrings,
    pendant: drawPendant
  };

  const art = artByType[product.type](product, metalId, stoneId);

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200" fill="none">
    <defs>
      ${metalGradient(metalId, metal)}
      ${stoneGradient(stoneId, stone)}
      <filter id="${product.slug}-shadow" x="0" y="0" width="1200" height="1200" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="26" stdDeviation="28" flood-color="rgba(25,17,12,0.18)"/>
      </filter>
      <radialGradient id="${product.slug}-glow" cx="50%" cy="48%" r="40%">
        <stop offset="0%" stop-color="rgba(255, 239, 211, 0.38)"/>
        <stop offset="100%" stop-color="rgba(255, 239, 211, 0)"/>
      </radialGradient>
    </defs>
    <g filter="url(#${product.slug}-shadow)">
      <ellipse cx="600" cy="740" rx="288" ry="96" fill="rgba(18,12,8,0.08)"/>
      <ellipse cx="600" cy="542" rx="332" ry="280" fill="url(#${product.slug}-glow)"/>
      ${art}
    </g>
  </svg>
  `;
}

// Виконує локальну логіку main для модуля службового скрипта.
async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await Promise.all(
    CATALOG_PRODUCTS.map(async (product) => {
      const filePath = path.join(OUTPUT_DIR, `${product.slug}.svg`);
      await fs.writeFile(filePath, renderProductSvg(product).trim(), "utf8");
    })
  );
  console.log(`Generated ${CATALOG_PRODUCTS.length} product assets in ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

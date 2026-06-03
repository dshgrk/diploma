// Файл містить службовий Node.js-скрипт для підтримки проєкту.
const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const TARGET_DIRECTORIES = [
  path.join(ROOT, "public", "assets", "images"),
  path.join(ROOT, "public", "assets", "preview")
];

// Повертає список даних list svg files у форматі, готовому для API або UI.
async function listSvgFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listSvgFiles(absolutePath)));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".svg")) {
      files.push(absolutePath);
    }
  }

  return files;
}

// Виконує локальну логіку rasterize для модуля службового скрипта.
async function rasterize(svgPath) {
  const pngPath = svgPath.replace(/\.svg$/i, ".png");
  const input = await fs.readFile(svgPath);

  await sharp(input, { density: 288 }).png({ compressionLevel: 9 }).toFile(pngPath);
  return pngPath;
}

// Виконує локальну логіку main для модуля службового скрипта.
async function main() {
  const svgFiles = [];

  for (const directory of TARGET_DIRECTORIES) {
    svgFiles.push(...(await listSvgFiles(directory)));
  }

  if (svgFiles.length === 0) {
    console.log("No SVG files found.");
    return;
  }

  for (const file of svgFiles) {
    const pngPath = await rasterize(file);
    console.log(`Rasterized ${path.relative(ROOT, file)} -> ${path.relative(ROOT, pngPath)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

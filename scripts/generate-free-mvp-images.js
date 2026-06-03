// Файл містить службовий Node.js-скрипт для підтримки проєкту.
const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const IMAGE_DIR = path.join(ROOT, "public", "assets", "images");
const PROVIDER = "https://image.pollinations.ai/prompt";

const assets = [
  {
    filename: "product-heart.png",
    seed: 642101,
    prompt:
      "premium handmade silver heart pendant necklace, artisan jewelry catalog product photo, soft warm beige studio background, elegant chain, centered composition, realistic metal reflections, luxury ecommerce image, no text, no logo, no watermark"
  },
  {
    filename: "product-moon.png",
    seed: 642102,
    prompt:
      "premium handmade moon charm bracelet, artisan jewelry catalog product photo, soft warm beige studio background, delicate chain bracelet, centered composition, realistic metal reflections, luxury ecommerce image, no text, no logo, no watermark"
  }
];

// Формує структуру build url для UI, API-відповіді або подальших розрахунків.
function buildUrl({ prompt, seed }) {
  const params = new URLSearchParams({
    width: "1200",
    height: "1200",
    model: "flux",
    seed: String(seed),
    nologo: "true",
    private: "true",
    enhance: "true",
    safe: "true"
  });

  params.delete("private");
  return `${PROVIDER}/${encodeURIComponent(prompt)}?${params.toString()}`;
}

// Виконує локальну логіку download image для модуля службового скрипта.
async function downloadImage(asset) {
  const url = buildUrl(asset);
  const response = await fetch(url, {
    headers: {
      accept: "image/*"
    }
  });

  if (!response.ok) {
    throw new Error(`Pollinations returned ${response.status} for ${asset.filename}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Pollinations returned non-image content for ${asset.filename}: ${contentType}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const targetPath = path.join(IMAGE_DIR, asset.filename);

  await sharp(buffer)
    .resize(1200, 1200, { fit: "cover" })
    .png({ compressionLevel: 9, palette: false })
    .toFile(targetPath);

  return { targetPath, url };
}

// Записує підготовлені дані write manifest у файл, базу або зовнішнє сховище.
async function writeManifest(records) {
  const manifestPath = path.join(IMAGE_DIR, "generated-free-mvp-images.json");
  const manifest = {
    provider: "Pollinations AI free no-key image endpoint",
    provider_url: PROVIDER,
    generated_at: new Date().toISOString(),
    assets: records.map((record) => ({
      filename: path.basename(record.targetPath),
      prompt: record.asset.prompt,
      seed: record.asset.seed,
      source_url: record.url
    }))
  };

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifestPath;
}

// Виконує локальну логіку main для модуля службового скрипта.
async function main() {
  await fs.mkdir(IMAGE_DIR, { recursive: true });

  const records = [];
  for (const asset of assets) {
    const result = await downloadImage(asset);
    records.push({ ...result, asset });
    console.log(`Generated ${path.relative(ROOT, result.targetPath)}`);
  }

  const manifestPath = await writeManifest(records);
  console.log(`Wrote ${path.relative(ROOT, manifestPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

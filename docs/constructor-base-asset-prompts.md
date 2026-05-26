# Prompt pack для base-assets конструктора

Ниже собраны промпты для прозрачных `PNG`-base-assets под layered preview конструктора Aurora Atelier. Это не каталожные packshot-рендеры, а чистые front-facing основы без камней, чтобы поверх них можно было накладывать stone overlays из конструктора.

## Общие требования

`transparent background, centered isolated jewelry base, front-facing, no model, no hand, no text, no watermark, no gemstone rendered, clean premium metal silhouette, realistic polished metal, soft studio lighting, visible empty setting/seats for future stone overlay, luxury minimal Aurora Atelier style`

## Naming convention

Для public preview конструктор теперь умеет подхватывать material-aware assets по naming convention:

- `<variant-code>-silver.png`
- `<variant-code>-gold.png`
- `<variant-code>-rose-gold.png`

Примеры:

- `ring-solitaire-silver.png`
- `ring-solitaire-gold.png`
- `ring-solitaire-rose-gold.png`
- `pendant-heart-silver.png`
- `earrings-drop-rose-gold.png`

Файлы нужно складывать в `public/assets/generated`. Старый `<variant-code>.png` остаётся fallback-изображением, если material-specific asset отсутствует.

## Human labels

Для подписи файлов в asset library или таблицах удобно использовать формат:

- `Ring Solitaire — Silver`
- `Ring Solitaire — Gold`
- `Ring Solitaire — Rose Gold`
- `Ring Duet — Silver`
- `Bracelet Line — Gold`
- `Bracelet Duet — Rose Gold`
- `Pendant Heart — Silver`
- `Pendant Moon — Gold`
- `Pendant Drop — Rose Gold`
- `Earrings Drop — Silver`
- `Earrings Stud — Gold`
- `Earrings Arc — Rose Gold`

## Ring

### `ring-solitaire`

`Ultra realistic luxury jewelry base asset of a minimalist solitaire ring, elegant thin band, one central empty stone setting, refined quiet-luxury proportions, polished metal only, transparent background, centered isolated front-facing composition, no gemstone, no hand, no text, no watermark.`

### `ring-duet`

`Ultra realistic luxury jewelry base asset of a refined duet ring with two balanced opposing empty stone settings, soft asymmetrical quiet-luxury silhouette, polished metal only, transparent background, centered isolated front-facing composition, no gemstone, no hand, no text, no watermark.`

## Bracelet

### `bracelet-line`

`Ultra realistic luxury jewelry base asset of a delicate line bracelet with three evenly spaced empty stone settings along a fine premium chain, restrained editorial silhouette, polished metal only, transparent background, centered isolated front-facing composition, no gemstone, no hand, no text, no watermark.`

### `bracelet-duet`

`Ultra realistic luxury jewelry base asset of a minimal bracelet with two refined empty stone settings as the central composition, elegant balanced chain silhouette, polished metal only, transparent background, centered isolated front-facing composition, no gemstone, no hand, no text, no watermark.`

## Earrings

### `earrings-stud`

`Ultra realistic luxury jewelry base asset of a pair of premium stud earrings with two round empty stone settings, calm symmetrical quiet-luxury styling, polished metal only, transparent background, centered isolated front-facing composition, no gemstone, no ear, no text, no watermark.`

### `earrings-arc`

`Ultra realistic luxury jewelry base asset of a pair of elegant arc drop earrings with two suspended empty stone settings, soft elongated editorial silhouette, polished metal only, transparent background, centered isolated front-facing composition, no gemstone, no ear, no text, no watermark.`

// Файл містить автоматичні перевірки ключових сценаріїв системи.
import { createRequire } from "module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { CartItemPreview } from "../../client/src/features/orders/order-preview.jsx";

const require = createRequire(import.meta.url);
const { buildPreviewLayers } = require("../../server/modules/pricing/pricing.service");

describe("preview layers", () => {
  test("includes base, selected layers and engraving", () => {
    const layers = buildPreviewLayers(
      { preview_base_asset: "/assets/preview/necklace-base.png" },
      [
        {
          layer_key: "stone",
          asset_path: "/assets/preview/stone-opal.png",
          z_index: 3
        }
      ],
      { engraving_text: "Love" }
    );

    expect(layers).toHaveLength(3);
    expect(layers[0].layer_key).toBe("base");
    expect(layers[1].layer_key).toBe("stone");
    expect(layers[2].layer_key).toBe("engraving");
  });

  test("custom design with resolved variant renders only live preview without fallback image", () => {
    const constructorConfig = {
      variants: [
        {
          id: 101,
          type_id: 1,
          code: "ring-solitaire",
          base_asset_url: "/assets/preview/ring-solitaire.png"
        }
      ],
      slotsByVariant: {
        101: [{ id: 1, code: "center", sort_order: 1 }]
      },
      stones: []
    };

    const markup = renderToStaticMarkup(
      React.createElement(CartItemPreview, {
        item: {
          id: 1,
          item_type: "custom_design",
          title: "Каблучка",
          jewelry_type_id: 1,
          configuration: {
            variant_id: 101,
            material: "silver",
            preview_image_url: "/assets/custom/fallback.png"
          }
        },
        constructorConfig
      })
    );

    expect(markup).toContain("cart-custom-preview-overlay");
    expect(markup).not.toContain("cart-custom-preview-image");
  });

  test("custom design without resolved variant falls back to static preview image", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CartItemPreview, {
        item: {
          id: 2,
          item_type: "custom_design",
          title: "Підвіска",
          jewelry_type_id: 99,
          configuration: {
            variant_id: 999,
            preview_image_url: "/assets/custom/fallback-pendant.png"
          }
        },
        constructorConfig: {
          variants: [],
          slotsByVariant: {},
          stones: []
        }
      })
    );

    expect(markup).toContain("cart-custom-preview-image");
    expect(markup).toContain("/assets/custom/fallback-pendant.png");
    expect(markup).not.toContain("cart-custom-preview-overlay");
  });
});

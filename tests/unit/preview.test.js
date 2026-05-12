import { createRequire } from "module";
import { describe, expect, test } from "vitest";

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
});

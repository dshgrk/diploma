const { calculateStudioPrice } = require("../constructor/constructor-json.service");

function buildPreviewLayers(jewelryType, selectedValues, configuration) {
  const layers = [];

  if (jewelryType.preview_base_asset) {
    layers.push({
      layer_key: "base",
      asset_url: jewelryType.preview_base_asset,
      z_index: 1
    });
  }

  (selectedValues || [])
    .filter((value) => value.asset_path)
    .forEach((value) => {
      layers.push({
        layer_key: value.layer_key,
        asset_url: value.asset_path,
        z_index: value.z_index,
        transform_meta: value.metadata_json || null
      });
    });

  if (configuration?.engraving_text?.trim()) {
    layers.push({
      layer_key: "engraving",
      asset_url: null,
      z_index: 4,
      text_placeholder: configuration.engraving_text.trim()
    });
  }

  return layers.sort((left, right) => left.z_index - right.z_index);
}

async function calculateDesignPrice({ jewelryTypeId, configuration = {}, req = null }) {
  return calculateStudioPrice({ jewelryTypeId, configuration, req });
}

module.exports = {
  buildPreviewLayers,
  calculateDesignPrice
};

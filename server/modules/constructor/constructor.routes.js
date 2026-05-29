const express = require("express");
const { asyncHandler } = require("../../middlewares/async-handler");
const {
  getConstructorConfig,
  getConstructorVariantOptions,
  listConstructorTypes,
  listConstructorVariants
} = require("./constructor.service");
const { calculateDesignPrice } = require("../pricing/pricing.service");

const constructorRouter = express.Router();

constructorRouter.get(
  "/config",
  asyncHandler(async (req, res) => {
    const config = await getConstructorConfig(req);
    res.json({ success: true, data: config });
  })
);

constructorRouter.get(
  "/types",
  asyncHandler(async (req, res) => {
    const types = await listConstructorTypes(req);
    res.json({ success: true, data: types });
  })
);

constructorRouter.get(
  "/variants",
  asyncHandler(async (req, res) => {
    const variants = await listConstructorVariants(req);
    res.json({ success: true, data: variants });
  })
);

constructorRouter.get(
  "/variants/:variantId/options",
  asyncHandler(async (req, res) => {
    const options = await getConstructorVariantOptions(req);
    res.json({ success: true, data: options });
  })
);

constructorRouter.post(
  "/price",
  asyncHandler(async (req, res) => {
    const result = await calculateDesignPrice({
      jewelryTypeId: Number(req.body.jewelry_type_id),
      configuration: req.body.configuration || {},
      req
    });
    res.json({ success: true, data: result });
  })
);

module.exports = { constructorRouter };

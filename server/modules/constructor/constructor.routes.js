const express = require("express");
const { asyncHandler } = require("../../middlewares/async-handler");
const { getConstructorConfig } = require("./constructor.service");
const { calculateDesignPrice } = require("../pricing/pricing.service");

const constructorRouter = express.Router();

constructorRouter.get(
  "/config",
  asyncHandler(async (req, res) => {
    const config = await getConstructorConfig(req);
    res.json({ success: true, data: config });
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

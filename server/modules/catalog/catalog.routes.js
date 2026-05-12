const express = require("express");
const { asyncHandler } = require("../../middlewares/async-handler");
const { getProductByIdOrSlug, listProducts } = require("./catalog.service");

const catalogRouter = express.Router();

catalogRouter.get(
  "/products",
  asyncHandler(async (req, res) => {
    const products = await listProducts(req);
    res.json({ success: true, data: products });
  })
);

catalogRouter.get(
  "/products/:identifier",
  asyncHandler(async (req, res) => {
    const product = await getProductByIdOrSlug(req.params.identifier, req);
    res.json({ success: true, data: product });
  })
);

module.exports = { catalogRouter };

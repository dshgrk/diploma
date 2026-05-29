const express = require("express");
const { asyncHandler } = require("../../middlewares/async-handler");
const { getProductByIdOrSlug, listProductFacets, listProducts } = require("./catalog.service");

const catalogRouter = express.Router();

catalogRouter.get(
  "/products",
  asyncHandler(async (req, res) => {
    const products = await listProducts(req);
    res.json({ success: true, data: products });
  })
);

catalogRouter.get(
  "/products/facets",
  asyncHandler(async (req, res) => {
    const facets = await listProductFacets(req);
    res.json({ success: true, data: facets });
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

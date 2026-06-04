// Файл підключає HTTP-endpoint'и для серверного модуля admin-catalog до Express-router.
const express = require("express");
const { requireAdmin } = require("../../middlewares/auth");
const { asyncHandler } = require("../../middlewares/async-handler");
const {
  createMaterial,
  createOptionValue,
  createProduct,
  deactivateMaterial,
  deactivateOptionValue,
  deactivateProduct,
  listConstructorAdminConfig,
  listJewelryTypes,
  listMaterials,
  listProducts,
  updateConstructorLayouts,
  updateMaterial,
  updateOptionValue,
  updateProduct,
  uploadProductImage
} = require("./admin-catalog.service");

const adminCatalogRouter = express.Router();

adminCatalogRouter.use(requireAdmin);

adminCatalogRouter.get(
  "/jewelry-types",
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await listJewelryTypes() });
  })
);

adminCatalogRouter.get(
  "/products",
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await listProducts() });
  })
);

adminCatalogRouter.post(
  "/products",
  asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await createProduct(req.body) });
  })
);

adminCatalogRouter.patch(
  "/products/:productId",
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await updateProduct(Number(req.params.productId), req.body) });
  })
);

adminCatalogRouter.delete(
  "/products/:productId",
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await deactivateProduct(Number(req.params.productId)) });
  })
);

adminCatalogRouter.post(
  "/uploads/product-image",
  asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await uploadProductImage(req.body) });
  })
);

adminCatalogRouter.get(
  "/materials",
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await listMaterials() });
  })
);

adminCatalogRouter.post(
  "/materials",
  asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await createMaterial(req.body) });
  })
);

adminCatalogRouter.patch(
  "/materials/:materialId",
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await updateMaterial(Number(req.params.materialId), req.body) });
  })
);

adminCatalogRouter.delete(
  "/materials/:materialId",
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await deactivateMaterial(Number(req.params.materialId)) });
  })
);

adminCatalogRouter.get(
  "/constructor",
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await listConstructorAdminConfig() });
  })
);

adminCatalogRouter.post(
  "/constructor/values",
  asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await createOptionValue(req.body) });
  })
);

adminCatalogRouter.patch(
  "/constructor/values/:valueId",
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await updateOptionValue(Number(req.params.valueId), req.body) });
  })
);

adminCatalogRouter.delete(
  "/constructor/values/:valueId",
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await deactivateOptionValue(Number(req.params.valueId)) });
  })
);

adminCatalogRouter.patch(
  "/constructor/layouts",
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await updateConstructorLayouts(req.body || {}) });
  })
);

module.exports = { adminCatalogRouter };

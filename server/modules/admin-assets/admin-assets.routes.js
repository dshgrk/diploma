// Файл підключає HTTP-endpoint'и для серверного модуля admin-assets до Express-router.
const express = require("express");
const { requireAdmin } = require("../../middlewares/auth");
const { asyncHandler } = require("../../middlewares/async-handler");
const { createAssetRecord, deleteAsset, listAssets, uploadAsset } = require("../constructor/constructor-json.service");

const adminAssetsRouter = express.Router();
adminAssetsRouter.use(requireAdmin);

adminAssetsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await listAssets() });
  })
);

adminAssetsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await createAssetRecord(req.body || {}) });
  })
);

adminAssetsRouter.post(
  "/upload",
  asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await uploadAsset(req.body || {}) });
  })
);

adminAssetsRouter.delete(
  "/:assetId",
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await deleteAsset(Number(req.params.assetId)) });
  })
);

module.exports = { adminAssetsRouter };

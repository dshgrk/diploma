// Файл підключає HTTP-endpoint'и для серверного модуля admin-constructor до Express-router.
const express = require("express");
const { requireAdmin } = require("../../middlewares/auth");
const { asyncHandler } = require("../../middlewares/async-handler");
const {
  createSlot,
  createStone,
  createType,
  createVariant,
  deleteStone,
  deleteType,
  deleteVariant,
  deactivateSlot,
  deleteVariantStone,
  listAdminConstructorConfig,
  updateSlot,
  updateStone,
  updateType,
  updateVariant,
  upsertVariantStone
} = require("../constructor/constructor-json.service");

const adminConstructorRouter = express.Router();
adminConstructorRouter.use(requireAdmin);

adminConstructorRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await listAdminConstructorConfig() });
  })
);

adminConstructorRouter.post("/types", asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createType(req.body || {}) });
}));
adminConstructorRouter.patch("/types/:typeId", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updateType(Number(req.params.typeId), req.body || {}) });
}));
adminConstructorRouter.delete("/types/:typeId", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await deleteType(Number(req.params.typeId)) });
}));

adminConstructorRouter.post("/variants", asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createVariant(req.body || {}) });
}));
adminConstructorRouter.patch("/variants/:variantId", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updateVariant(Number(req.params.variantId), req.body || {}) });
}));
adminConstructorRouter.delete("/variants/:variantId", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await deleteVariant(Number(req.params.variantId)) });
}));

adminConstructorRouter.post("/slots", asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createSlot(req.body || {}) });
}));
adminConstructorRouter.patch("/slots/:slotId", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updateSlot(Number(req.params.slotId), req.body || {}) });
}));
adminConstructorRouter.delete("/slots/:slotId", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await deactivateSlot(Number(req.params.slotId)) });
}));

adminConstructorRouter.post("/stones", asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createStone(req.body || {}) });
}));
adminConstructorRouter.patch("/stones/:stoneId", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updateStone(Number(req.params.stoneId), req.body || {}) });
}));
adminConstructorRouter.delete("/stones/:stoneId", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await deleteStone(Number(req.params.stoneId)) });
}));

adminConstructorRouter.post("/variant-stones", asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await upsertVariantStone(req.body || {}) });
}));
adminConstructorRouter.patch("/variant-stones", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await upsertVariantStone(req.body || {}) });
}));
adminConstructorRouter.delete("/variant-stones/:variantId/:stoneId", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await deleteVariantStone(Number(req.params.variantId), Number(req.params.stoneId)) });
}));

module.exports = { adminConstructorRouter };

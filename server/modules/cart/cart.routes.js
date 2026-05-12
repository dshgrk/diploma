const express = require("express");
const { asyncHandler } = require("../../middlewares/async-handler");
const { requireAuth } = require("../../middlewares/auth");
const { addCartItem, applyCartPromoCode, deleteCartItem, getCartForUser, removeCartPromoCode, updateCartItem } = require("./cart.service");

const cartRouter = express.Router();

cartRouter.use(requireAuth);

cartRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const cart = await getCartForUser(req.user.id);
    res.json({ success: true, data: cart });
  })
);

cartRouter.post(
  "/items",
  asyncHandler(async (req, res) => {
    const cart = await addCartItem(req.user.id, req.body, req);
    res.status(201).json({ success: true, data: cart });
  })
);

cartRouter.patch(
  "/items/:itemId",
  asyncHandler(async (req, res) => {
    const cart = await updateCartItem(req.user.id, Number(req.params.itemId), req.body, req);
    res.json({ success: true, data: cart });
  })
);

cartRouter.delete(
  "/items/:itemId",
  asyncHandler(async (req, res) => {
    const cart = await deleteCartItem(req.user.id, Number(req.params.itemId));
    res.json({ success: true, data: cart });
  })
);

cartRouter.post(
  "/promo-code",
  asyncHandler(async (req, res) => {
    const cart = await applyCartPromoCode(req.user.id, req.body.code);
    res.json({ success: true, data: cart });
  })
);

cartRouter.delete(
  "/promo-code",
  asyncHandler(async (req, res) => {
    const cart = await removeCartPromoCode(req.user.id);
    res.json({ success: true, data: cart });
  })
);

module.exports = { cartRouter };

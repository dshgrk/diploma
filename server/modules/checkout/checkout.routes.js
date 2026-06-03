// Файл підключає HTTP-endpoint'и для серверного модуля checkout до Express-router.
const express = require("express");
const { requireAuth } = require("../../middlewares/auth");
const { asyncHandler } = require("../../middlewares/async-handler");
const { createCheckoutOrder } = require("./checkout.service");
const { createRateLimiter } = require("../../middlewares/rate-limit");

const checkoutRouter = express.Router();
const checkoutRateLimit = createRateLimiter({
  key: "checkout-create",
  max: 8,
  windowMs: 10 * 60 * 1000,
  message: "Too many checkout attempts. Please wait and try again."
});

checkoutRouter.use(requireAuth);

checkoutRouter.post(
  "/",
  checkoutRateLimit,
  asyncHandler(async (req, res) => {
    const result = await createCheckoutOrder(req.user.id, req.body, req);
    res.status(201).json({ success: true, data: result });
  })
);

module.exports = { checkoutRouter };

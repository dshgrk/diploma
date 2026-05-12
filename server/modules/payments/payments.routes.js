const express = require("express");
const { asyncHandler } = require("../../middlewares/async-handler");
const { requireAuth } = require("../../middlewares/auth");
const { confirmMockPayment } = require("./payments.service");
const { createRateLimiter } = require("../../middlewares/rate-limit");

const paymentsRouter = express.Router();
const paymentConfirmRateLimit = createRateLimiter({
  key: "payment-confirm",
  max: 12,
  windowMs: 10 * 60 * 1000,
  message: "Too many payment confirmation attempts. Please wait and try again."
});

paymentsRouter.use(requireAuth);

paymentsRouter.post(
  "/mock/confirm",
  paymentConfirmRateLimit,
  asyncHandler(async (req, res) => {
    const result = await confirmMockPayment(req.user, req.body);
    res.json({ success: true, data: result });
  })
);

module.exports = { paymentsRouter };
